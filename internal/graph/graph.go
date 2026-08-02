// Package graph construye un mapa de dependencias del codebase a partir de los
// archivos seleccionados. No ejecuta compiladores: extrae imports con patrones
// por lenguaje, suficiente para que un chatbot entienda como se conecta el codigo.
package graph

import (
	"path"
	"regexp"
	"sort"
	"strings"
)

// FileNode representa un archivo dentro del grafo
type FileNode struct {
	RelPath    string   `json:"relPath"`
	Lang       string   `json:"lang"`
	Imports    []string `json:"imports"`    // rutas internas resueltas
	External   []string `json:"external"`   // paquetes de terceros
	Dependents []string `json:"dependents"` // quien lo importa
	Symbols    []string `json:"symbols"`    // exports / definiciones top-level
	Lines      int      `json:"lines"`
}

// Graph es el mapa completo
type Graph struct {
	Files       []*FileNode    `json:"files"`
	EntryPoints []string       `json:"entryPoints"`
	Orphans     []string       `json:"orphans"`
	External    map[string]int `json:"external"`
}

var (
	reJSImport  = regexp.MustCompile(`(?m)^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]`)
	reJSExport  = regexp.MustCompile(`(?m)^\s*export\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]`)
	reJSRequire = regexp.MustCompile(`require\(\s*['"]([^'"]+)['"]\s*\)`)
	reJSDynamic = regexp.MustCompile(`import\(\s*['"]([^'"]+)['"]\s*\)`)
	reCSSImport = regexp.MustCompile(`@import\s+(?:url\()?['"]([^'"]+)['"]`)

	reGoImportBlock  = regexp.MustCompile(`(?s)import\s*\(([^)]*)\)`)
	reGoImportSingle = regexp.MustCompile(`(?m)^\s*import\s+(?:[\w.]+\s+)?"([^"]+)"`)
	reGoQuoted       = regexp.MustCompile(`"([^"]+)"`)

	rePyImport = regexp.MustCompile(`(?m)^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))`)

	// Simbolos top-level: exports JS/TS, func/type Go, def/class Python
	reJSSymbol = regexp.MustCompile(`(?m)^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)`)
	reGoSymbol = regexp.MustCompile(`(?m)^(?:func\s+(?:\([^)]*\)\s*)?([A-Z]\w*)|type\s+([A-Z]\w*))`)
	rePySymbol = regexp.MustCompile(`(?m)^(?:def|class)\s+(\w+)`)

	jsExts = []string{".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css"}
)

// Lang deduce el lenguaje a partir de la extension
func Lang(relPath string) string {
	switch strings.ToLower(path.Ext(relPath)) {
	case ".ts":
		return "typescript"
	case ".tsx":
		return "tsx"
	case ".js", ".mjs", ".cjs":
		return "javascript"
	case ".jsx":
		return "jsx"
	case ".go":
		return "go"
	case ".py":
		return "python"
	case ".rs":
		return "rust"
	case ".css":
		return "css"
	case ".json":
		return "json"
	case ".md":
		return "markdown"
	case ".sh", ".bash", ".zsh":
		return "bash"
	case ".yml", ".yaml":
		return "yaml"
	case ".html":
		return "html"
	case ".sql":
		return "sql"
	default:
		return ""
	}
}

// Build construye el grafo. contents mapea relPath -> contenido del archivo.
func Build(contents map[string]string) *Graph {
	g := &Graph{
		Files:    make([]*FileNode, 0, len(contents)),
		External: make(map[string]int),
	}

	// Indices para resolver imports: archivos presentes y archivos por carpeta
	present := make(map[string]bool, len(contents))
	byDir := make(map[string][]string, len(contents))
	for rel := range contents {
		present[rel] = true
		dir := path.Dir(rel)
		byDir[dir] = append(byDir[dir], rel)
	}

	byPath := make(map[string]*FileNode, len(contents))

	paths := make([]string, 0, len(contents))
	for rel := range contents {
		paths = append(paths, rel)
	}
	sort.Strings(paths)

	for _, rel := range paths {
		src := contents[rel]
		node := &FileNode{
			RelPath: rel,
			Lang:    Lang(rel),
			Lines:   strings.Count(src, "\n") + 1,
			Symbols: symbols(rel, src),
		}

		isGo := node.Lang == "go"
		for _, spec := range rawImports(rel, src) {
			// Go: un import apunta a un paquete (carpeta), no a un archivo
			if isGo {
				if files, ok := resolveGoPackage(spec, byDir); ok {
					for _, f := range files {
						if f != rel {
							node.Imports = appendUnique(node.Imports, f)
						}
					}
					continue
				}
				if pkg := goExternalName(spec); pkg != "" {
					node.External = appendUnique(node.External, pkg)
					g.External[pkg]++
				}
				continue
			}

			if resolved, ok := resolve(rel, spec, present); ok {
				node.Imports = appendUnique(node.Imports, resolved)
			} else if pkg := externalName(spec); pkg != "" {
				node.External = appendUnique(node.External, pkg)
				g.External[pkg]++
			}
		}

		sort.Strings(node.Imports)
		sort.Strings(node.External)
		g.Files = append(g.Files, node)
		byPath[rel] = node
	}

	// Fan-in
	for _, n := range g.Files {
		for _, dep := range n.Imports {
			if target, ok := byPath[dep]; ok {
				target.Dependents = appendUnique(target.Dependents, n.RelPath)
			}
		}
	}

	for _, n := range g.Files {
		sort.Strings(n.Dependents)
		switch {
		case len(n.Dependents) == 0 && len(n.Imports) > 0:
			g.EntryPoints = append(g.EntryPoints, n.RelPath)
		case len(n.Dependents) == 0 && len(n.Imports) == 0 && n.Lang != "":
			g.Orphans = append(g.Orphans, n.RelPath)
		}
	}

	return g
}

// rawImports extrae los specs de import sin resolver
func rawImports(relPath, src string) []string {
	var out []string
	add := func(matches [][]string) {
		for _, m := range matches {
			for _, group := range m[1:] {
				if group != "" {
					out = append(out, group)
				}
			}
		}
	}

	switch Lang(relPath) {
	case "typescript", "tsx", "javascript", "jsx":
		add(reJSImport.FindAllStringSubmatch(src, -1))
		add(reJSExport.FindAllStringSubmatch(src, -1))
		add(reJSRequire.FindAllStringSubmatch(src, -1))
		add(reJSDynamic.FindAllStringSubmatch(src, -1))
	case "css":
		add(reCSSImport.FindAllStringSubmatch(src, -1))
	case "go":
		for _, block := range reGoImportBlock.FindAllStringSubmatch(src, -1) {
			add(reGoQuoted.FindAllStringSubmatch(block[1], -1))
		}
		add(reGoImportSingle.FindAllStringSubmatch(src, -1))
	case "python":
		add(rePyImport.FindAllStringSubmatch(src, -1))
	}

	return out
}

// symbols extrae definiciones top-level relevantes (max 12 por archivo)
func symbols(relPath, src string) []string {
	var re *regexp.Regexp
	switch Lang(relPath) {
	case "typescript", "tsx", "javascript", "jsx":
		re = reJSSymbol
	case "go":
		re = reGoSymbol
	case "python":
		re = rePySymbol
	default:
		return nil
	}

	var out []string
	for _, m := range re.FindAllStringSubmatch(src, -1) {
		for _, group := range m[1:] {
			if group != "" {
				out = appendUnique(out, group)
			}
		}
		if len(out) >= 12 {
			break
		}
	}
	return out
}

// resolve convierte un import relativo en una ruta del proyecto
func resolve(from, spec string, present map[string]bool) (string, bool) {
	if !strings.HasPrefix(spec, ".") {
		return "", false
	}

	base := path.Join(path.Dir(from), spec)
	base = strings.TrimPrefix(path.Clean(base), "./")

	if present[base] {
		return base, true
	}
	for _, ext := range jsExts {
		if present[base+ext] {
			return base + ext, true
		}
		if present[path.Join(base, "index"+ext)] {
			return path.Join(base, "index"+ext), true
		}
	}

	// Import con extension explicita que el proyecto escribe distinto (.js -> .ts)
	if ext := path.Ext(base); ext != "" {
		stem := strings.TrimSuffix(base, ext)
		for _, alt := range jsExts {
			if present[stem+alt] {
				return stem + alt, true
			}
		}
	}

	return "", false
}

// resolveGoPackage mapea "modulo/internal/fs" a los archivos de esa carpeta.
// El prefijo del modulo se descarta buscando la carpeta que coincida por sufijo.
func resolveGoPackage(spec string, byDir map[string][]string) ([]string, bool) {
	segments := strings.Split(spec, "/")

	for i := range segments {
		candidate := strings.Join(segments[i:], "/")
		files, ok := byDir[candidate]
		if !ok {
			continue
		}
		// Los archivos _test.go no forman parte del paquete importable
		out := make([]string, 0, len(files))
		for _, f := range files {
			if strings.HasSuffix(f, "_test.go") {
				continue
			}
			out = append(out, f)
		}
		return out, len(out) > 0
	}
	return nil, false
}

// goExternalName ignora la stdlib y agrupa modulos por su ruta canonica.
// La stdlib se reconoce porque su primer segmento no tiene punto ("os", "net/http").
func goExternalName(spec string) string {
	parts := strings.Split(spec, "/")
	if !strings.Contains(parts[0], ".") {
		return "" // stdlib
	}
	if len(parts) >= 3 {
		return strings.Join(parts[:3], "/")
	}
	return spec
}

// externalName normaliza un spec de terceros al nombre del paquete raiz
func externalName(spec string) string {
	if spec == "" || strings.HasPrefix(spec, ".") {
		return ""
	}
	// Alias internos tipo "@/components/x" no son paquetes reales
	if strings.HasPrefix(spec, "@/") || strings.HasPrefix(spec, "~/") {
		return ""
	}
	parts := strings.Split(spec, "/")
	if strings.HasPrefix(spec, "@") && len(parts) >= 2 {
		return parts[0] + "/" + parts[1]
	}
	return parts[0]
}

func appendUnique(list []string, v string) []string {
	for _, item := range list {
		if item == v {
			return list
		}
	}
	return append(list, v)
}

// TopExternal devuelve los paquetes externos ordenados por uso
func (g *Graph) TopExternal(limit int) []string {
	type kv struct {
		name  string
		count int
	}
	pairs := make([]kv, 0, len(g.External))
	for name, count := range g.External {
		pairs = append(pairs, kv{name, count})
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].count == pairs[j].count {
			return pairs[i].name < pairs[j].name
		}
		return pairs[i].count > pairs[j].count
	})

	out := make([]string, 0, limit)
	for i, p := range pairs {
		if limit > 0 && i >= limit {
			break
		}
		out = append(out, p.name)
	}
	return out
}

// Closure devuelve las semillas mas todo lo que alcanzan siguiendo imports.
// depth <= 0 significa cierre transitivo completo.
func (g *Graph) Closure(seeds []string, depth int) []string {
	edges := make(map[string][]string, len(g.Files))
	for _, n := range g.Files {
		edges[n.RelPath] = n.Imports
	}

	visited := make(map[string]bool, len(seeds))
	frontier := make([]string, 0, len(seeds))
	for _, s := range seeds {
		if !visited[s] {
			visited[s] = true
			frontier = append(frontier, s)
		}
	}

	for level := 0; len(frontier) > 0; level++ {
		if depth > 0 && level >= depth {
			break
		}

		next := make([]string, 0)
		for _, cur := range frontier {
			for _, dep := range edges[cur] {
				if !visited[dep] {
					visited[dep] = true
					next = append(next, dep)
				}
			}
		}
		frontier = next
	}

	out := make([]string, 0, len(visited))
	for rel := range visited {
		out = append(out, rel)
	}
	sort.Strings(out)
	return out
}
