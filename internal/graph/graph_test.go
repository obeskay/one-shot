package graph

import "testing"

func TestBuild_ResuelveGoPorPaquete(t *testing.T) {
	contents := map[string]string{
		"main.go":                "package main\n\nimport (\n\t\"os\"\n\t\"github.com/wailsapp/wails/v2/pkg/runtime\"\n\n\t\"shotgun/internal/fs\"\n)\n\nfunc Main() {}\n",
		"internal/fs/scanner.go": "package fs\n\nfunc Scan() {}\n",
		"internal/fs/walker.go":  "package fs\n\nfunc Walk() {}\n",
	}

	g := Build(contents)

	var main *FileNode
	for _, n := range g.Files {
		if n.RelPath == "main.go" {
			main = n
		}
	}
	if main == nil {
		t.Fatal("no se encontro main.go")
	}

	if len(main.Imports) != 2 {
		t.Errorf("esperaba 2 archivos importados del paquete fs, obtuve %v", main.Imports)
	}
	for _, ext := range main.External {
		if ext == "os" {
			t.Error("la stdlib no debe contar como dependencia externa")
		}
	}
	if len(main.External) != 1 || main.External[0] != "github.com/wailsapp/wails" {
		t.Errorf("esperaba el modulo canonico de wails, obtuve %v", main.External)
	}
}

func TestBuild_ResuelveIndexYExtensionesJS(t *testing.T) {
	contents := map[string]string{
		"src/app.tsx":      "import { Button } from './ui';\nimport { cn } from './utils/cn';\n",
		"src/ui/index.tsx": "export const Button = () => null;\n",
		"src/utils/cn.ts":  "export function cn() {}\n",
	}

	g := Build(contents)

	var app *FileNode
	for _, n := range g.Files {
		if n.RelPath == "src/app.tsx" {
			app = n
		}
	}
	if app == nil {
		t.Fatal("no se encontro src/app.tsx")
	}

	want := map[string]bool{"src/ui/index.tsx": true, "src/utils/cn.ts": true}
	for _, imp := range app.Imports {
		delete(want, imp)
	}
	if len(want) > 0 {
		t.Errorf("imports sin resolver: %v (obtuve %v)", want, app.Imports)
	}
}
