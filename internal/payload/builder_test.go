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
		"src/main.ts": "import { helper } from './lib/helper';\nimport React from 'react';\n\nexport const main = () => helper();\n",
		"src/lib/helper.ts": "export function helper() {\n  return 42;\n}\n",
		"README.md": "# demo\n",
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
