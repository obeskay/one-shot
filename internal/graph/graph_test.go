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

func TestClosure_SigueDependenciasTransitivas(t *testing.T) {
	contents := map[string]string{
		"a.ts": "import './b';\n",
		"b.ts": "import './c';\n",
		"c.ts": "export const c = 1;\n",
		"z.ts": "export const z = 1;\n", // aislado
	}

	g := Build(contents)

	full := g.Closure([]string{"a.ts"}, 0)
	if len(full) != 3 {
		t.Errorf("cierre completo esperaba a,b,c; obtuve %v", full)
	}
	for _, rel := range full {
		if rel == "z.ts" {
			t.Error("z.ts no es alcanzable desde a.ts")
		}
	}

	unNivel := g.Closure([]string{"a.ts"}, 1)
	if len(unNivel) != 2 {
		t.Errorf("un nivel esperaba a,b; obtuve %v", unNivel)
	}
}

func TestClosure_SinSemillasNoExplota(t *testing.T) {
	g := Build(map[string]string{"a.ts": "export const a = 1;\n"})
	if got := g.Closure(nil, 0); len(got) != 0 {
		t.Errorf("esperaba vacio, obtuve %v", got)
	}
}
