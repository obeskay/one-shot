package payload

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func setupProject(t *testing.T) string {
	t.Helper()
	root := t.TempDir()

	files := map[string]string{
		"src/main.ts":       "import { helper } from './lib/helper';\nimport React from 'react';\n\nexport const main = () => helper();\n",
		"src/lib/helper.ts": "export function helper() {\n  return 42;\n}\n",
		"README.md":         "# demo\n",
	}

	for rel, content := range files {
		full := filepath.Join(root, rel)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	return root
}

func TestBuild_IncluyeTodasLasSecciones(t *testing.T) {
	root := setupProject(t)
	b := NewBuilder(root)

	res, err := b.Build([]string{"src/main.ts", "src/lib/helper.ts", "README.md"}, DefaultOptions())
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}

	if res.Stats.Files != 3 {
		t.Errorf("esperaba 3 archivos, obtuve %d", res.Stats.Files)
	}

	for _, want := range []string{
		"## Estructura",
		"## Grafo de dependencias",
		"## Archivos",
		"### src/main.ts",
		"helper",
	} {
		if !strings.Contains(res.Text, want) {
			t.Errorf("el payload no contiene %q", want)
		}
	}
}

func TestBuild_ResuelveImportsRelativosYExternos(t *testing.T) {
	root := setupProject(t)
	b := NewBuilder(root)

	res, err := b.Build([]string{"src/main.ts", "src/lib/helper.ts"}, DefaultOptions())
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}

	// main.ts importa ./lib/helper -> debe resolverse a la ruta real
	if !strings.Contains(res.Text, "importa: `src/lib/helper.ts`") {
		t.Errorf("no resolvio el import relativo:\n%s", res.Text)
	}
	// helper.ts es usado por main.ts
	if !strings.Contains(res.Text, "usado por: `src/main.ts`") {
		t.Errorf("no calculo el fan-in:\n%s", res.Text)
	}
	// react es dependencia externa
	if !strings.Contains(res.Text, "`react` (1)") {
		t.Errorf("no detecto la dependencia externa:\n%s", res.Text)
	}
}

func TestBuild_SeccionesOpcionales(t *testing.T) {
	root := setupProject(t)
	b := NewBuilder(root)

	opts := DefaultOptions()
	opts.IncludeContents = false
	opts.IncludeGraph = false
	opts.Instruction = "refactoriza el modulo"

	res, err := b.Build([]string{"src/main.ts"}, opts)
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}

	if strings.Contains(res.Text, "## Archivos") {
		t.Error("no debia incluir el contenido de los archivos")
	}
	if strings.Contains(res.Text, "## Grafo") {
		t.Error("no debia incluir el grafo")
	}
	if !strings.Contains(res.Text, "refactoriza el modulo") {
		t.Error("debia incluir el objetivo del usuario")
	}
}

func TestBuild_ArchivoFaltanteGeneraAviso(t *testing.T) {
	root := setupProject(t)
	b := NewBuilder(root)

	res, err := b.Build([]string{"src/main.ts", "no/existe.ts"}, DefaultOptions())
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}

	if res.Stats.Skipped != 1 {
		t.Errorf("esperaba 1 archivo omitido, obtuve %d", res.Stats.Skipped)
	}
	if len(res.Warnings) == 0 {
		t.Error("esperaba un aviso por el archivo faltante")
	}
}

func TestBuild_SinSeleccionFalla(t *testing.T) {
	b := NewBuilder(setupProject(t))
	if _, err := b.Build(nil, DefaultOptions()); err == nil {
		t.Error("esperaba error con seleccion vacia")
	}
}

func TestBuild_BinariosSeListanNoSeTranscriben(t *testing.T) {
	root := setupProject(t)

	// PNG real minimo: firma + byte NUL en el header
	png := []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 'I', 'H', 'D', 'R'}
	if err := os.MkdirAll(filepath.Join(root, "public"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "public/logo.png"), png, 0o644); err != nil {
		t.Fatal(err)
	}

	res, err := NewBuilder(root).Build([]string{"src/main.ts", "public/logo.png"}, DefaultOptions())
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}

	if res.Stats.Binary != 1 {
		t.Errorf("esperaba 1 binario, obtuve %d", res.Stats.Binary)
	}
	if res.Stats.Files != 1 {
		t.Errorf("el binario no debe contar como archivo de texto, obtuve %d", res.Stats.Files)
	}
	if strings.Contains(res.Text, "PNG") && strings.Contains(res.Text, "```\n\x89") {
		t.Error("se transcribieron los bytes del binario")
	}
	if !strings.Contains(res.Text, "## Recursos binarios") {
		t.Error("falta la seccion de recursos binarios")
	}
	if !strings.Contains(res.Text, "- `public/logo.png`") {
		t.Error("el binario debe aparecer listado con su ruta")
	}
	// Sigue existiendo en el arbol para que el chatbot sepa que esta ahi
	if !strings.Contains(res.Text, "logo.png") {
		t.Error("el binario debe aparecer en la estructura")
	}
}

func TestBuild_SoloBinariosNoFalla(t *testing.T) {
	root := setupProject(t)
	if err := os.WriteFile(filepath.Join(root, "icon.ico"), []byte{0x00, 0x00, 0x01, 0x00}, 0o644); err != nil {
		t.Fatal(err)
	}

	res, err := NewBuilder(root).Build([]string{"icon.ico"}, DefaultOptions())
	if err != nil {
		t.Fatalf("Build fallo: %v", err)
	}
	if res.Stats.Binary != 1 || res.Stats.Files != 0 {
		t.Errorf("stats inesperadas: %+v", res.Stats)
	}
}
