package app

import (
	"os"
	"path/filepath"
	"testing"
)

func setupRepo(t *testing.T) string {
	t.Helper()
	root := t.TempDir()

	files := map[string]string{
		"src/app.tsx":       "import { Button } from './ui/Button';\nimport './app.css';\n",
		"src/ui/Button.tsx": "import { cn } from '../utils/cn';\nexport const Button = () => null;\n",
		"src/utils/cn.ts":   "export function cn() {}\n",
		"src/app.css":       ".app { color: red; }\n",
		"src/unrelated.ts":  "export const nada = 1;\n",
		"public/logo.png":   "\x89PNG\x00binario",
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

func TestExpandSelection_TraeDependenciasTransitivas(t *testing.T) {
	root := setupRepo(t)
	app := New()

	got, err := app.ExpandSelection(root, []string{"src/app.tsx"}, 0)
	if err != nil {
		t.Fatalf("ExpandSelection fallo: %v", err)
	}

	want := map[string]bool{
		"src/app.tsx":       true,
		"src/ui/Button.tsx": true,
		"src/utils/cn.ts":   true,
		"src/app.css":       true,
	}
	if len(got) != len(want) {
		t.Fatalf("esperaba %d archivos, obtuve %v", len(want), got)
	}
	for _, rel := range got {
		if !want[rel] {
			t.Errorf("archivo inesperado en el cierre: %s", rel)
		}
	}
}

func TestExpandSelection_UnNivel(t *testing.T) {
	root := setupRepo(t)
	app := New()

	got, err := app.ExpandSelection(root, []string{"src/app.tsx"}, 1)
	if err != nil {
		t.Fatalf("ExpandSelection fallo: %v", err)
	}

	// app.tsx + sus imports directos (Button, app.css), sin cn.ts
	if len(got) != 3 {
		t.Errorf("un nivel esperaba 3 archivos, obtuve %v", got)
	}
	for _, rel := range got {
		if rel == "src/utils/cn.ts" {
			t.Error("cn.ts esta a dos saltos, no debia entrar")
		}
	}
}

func TestExpandSelection_SinSeleccionFalla(t *testing.T) {
	app := New()
	if _, err := app.ExpandSelection(setupRepo(t), nil, 0); err == nil {
		t.Error("esperaba error con seleccion vacia")
	}
}

func TestProjectGraph_UsaCacheYSeInvalida(t *testing.T) {
	root := setupRepo(t)
	app := New()

	first, err := app.projectGraph(root)
	if err != nil {
		t.Fatal(err)
	}
	second, err := app.projectGraph(root)
	if err != nil {
		t.Fatal(err)
	}
	if first != second {
		t.Error("esperaba reutilizar el grafo cacheado")
	}

	app.graphCache.invalidate()
	third, err := app.projectGraph(root)
	if err != nil {
		t.Fatal(err)
	}
	if third == first {
		t.Error("tras invalidar debia reconstruirse")
	}
}
