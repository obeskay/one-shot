// Package payload arma el bloque de texto final que el usuario pega en un
// chatbot (ChatGPT, Claude, Kimi, etc.). Un solo mensaje autocontenido:
// estructura, grafo de dependencias y contenido de los archivos.
package payload

import (
	"fmt"
	"path"
	"sort"
	"strings"

	"shotgun/internal/fs"
	"shotgun/internal/graph"
)

// Options controla que secciones se incluyen
type Options struct {
	IncludeTree     bool   `json:"includeTree"`
	IncludeGraph    bool   `json:"includeGraph"`
	IncludeContents bool   `json:"includeContents"`
	MaxFileBytes    int64  `json:"maxFileBytes"`
	Instruction     string `json:"instruction"`
}

// DefaultOptions valores razonables: todo activado, 256KB por archivo
func DefaultOptions() Options {
	return Options{
		IncludeTree:     true,
		IncludeGraph:    true,
		IncludeContents: true,
		MaxFileBytes:    256 * 1024,
	}
}

// Stats resumen numerico del payload
type Stats struct {
	Files     int   `json:"files"`
	Skipped   int   `json:"skipped"`
	Truncated int   `json:"truncated"`
	Binary    int   `json:"binary"`
	Bytes     int64 `json:"bytes"`
	Tokens    int   `json:"tokens"`
	Externals int   `json:"externals"`
}

// Result payload listo para el portapapeles
type Result struct {
	Text     string   `json:"text"`
	Stats    Stats    `json:"stats"`
	Warnings []string `json:"warnings,omitempty"`
}

// asset es un archivo no textual: se lista, no se transcribe
type asset struct {
	RelPath   string
	SizeBytes int64
}

// Builder arma payloads para un proyecto
type Builder struct {
	rootPath string
}

// NewBuilder crea un builder anclado a la raiz del proyecto
func NewBuilder(rootPath string) *Builder {
	return &Builder{rootPath: rootPath}
}

// ProjectPath retorna la raiz del proyecto
func (b *Builder) ProjectPath() string {
	return b.rootPath
}

// Build lee los archivos seleccionados y devuelve el texto final
func (b *Builder) Build(relPaths []string, opts Options) (*Result, error) {
	if len(relPaths) == 0 {
		return nil, fmt.Errorf("no hay archivos seleccionados")
	}

	if opts.MaxFileBytes <= 0 {
		opts.MaxFileBytes = DefaultOptions().MaxFileBytes
	}

	sorted := append([]string(nil), relPaths...)
	sort.Strings(sorted)

	res := &Result{}
	contents := make(map[string]string, len(sorted))
	truncatedSet := make(map[string]bool)
	ordered := make([]string, 0, len(sorted))
	assets := make([]asset, 0)

	for _, rel := range sorted {
		content, truncated, err := fs.ReadFileContent(b.rootPath, rel, opts.MaxFileBytes)
		if err != nil {
			res.Warnings = append(res.Warnings, fmt.Sprintf("%s: %v", rel, err))
			res.Stats.Skipped++
			continue
		}

		// Imagenes, fuentes, binarios: se listan, nunca se transcriben
		if fs.IsBinary([]byte(content)) {
			size, err := fs.FileSize(b.rootPath, rel)
			if err != nil {
				size = int64(len(content))
			}
			assets = append(assets, asset{RelPath: rel, SizeBytes: size})
			res.Stats.Binary++
			continue
		}

		contents[rel] = content
		ordered = append(ordered, rel)
		if truncated {
			truncatedSet[rel] = true
			res.Stats.Truncated++
		}
		res.Stats.Bytes += int64(len(content))
	}

	res.Stats.Files = len(ordered)
	if res.Stats.Files == 0 && len(assets) == 0 {
		return nil, fmt.Errorf("ningun archivo pudo leerse")
	}

	g := graph.Build(contents)
	res.Stats.Externals = len(g.External)

	var sb strings.Builder
	projectName := path.Base(b.rootPath)

	sb.WriteString(fmt.Sprintf("# Codebase: %s\n\n", projectName))
	sb.WriteString(fmt.Sprintf("%d archivos de texto · %s · ~%s tokens aprox.",
		res.Stats.Files, humanBytes(res.Stats.Bytes), humanCount(estimateTokens(res.Stats.Bytes))))
	if len(assets) > 0 {
		sb.WriteString(fmt.Sprintf(" · %d binarios listados sin contenido", len(assets)))
	}
	sb.WriteString("\n")
	sb.WriteString("Contexto generado con One-Shot. Todo lo necesario esta en este mensaje.\n\n")

	if strings.TrimSpace(opts.Instruction) != "" {
		sb.WriteString("## Objetivo\n\n")
		sb.WriteString(strings.TrimSpace(opts.Instruction))
		sb.WriteString("\n\n")
	}

	if opts.IncludeTree {
		treePaths := append([]string(nil), ordered...)
		for _, a := range assets {
			treePaths = append(treePaths, a.RelPath)
		}
		sort.Strings(treePaths)

		sb.WriteString("## Estructura\n\n```\n")
		sb.WriteString(renderTree(treePaths))
		sb.WriteString("```\n\n")
	}

	if opts.IncludeGraph {
		writeGraph(&sb, g)
	}

	if len(assets) > 0 {
		sb.WriteString("## Recursos binarios\n\n")
		sb.WriteString("Existen en el proyecto pero su contenido no es texto (imagenes, fuentes, etc.):\n\n")
		for _, a := range assets {
			sb.WriteString(fmt.Sprintf("- `%s` · %s\n", a.RelPath, humanBytes(a.SizeBytes)))
		}
		sb.WriteString("\n")
	}

	if opts.IncludeContents && len(ordered) > 0 {
		sb.WriteString("## Archivos\n\n")
		for _, rel := range ordered {
			sb.WriteString(fmt.Sprintf("### %s\n\n", rel))
			if truncatedSet[rel] {
				sb.WriteString("> Truncado por limite de tamano.\n\n")
			}
			sb.WriteString("```" + graph.Lang(rel) + "\n")
			sb.WriteString(strings.TrimRight(contents[rel], "\n"))
			sb.WriteString("\n```\n\n")
		}
	}

	if len(res.Warnings) > 0 {
		sb.WriteString("## Avisos\n\n")
		for _, w := range res.Warnings {
			sb.WriteString("- " + w + "\n")
		}
		sb.WriteString("\n")
	}

	res.Text = sb.String()
	res.Stats.Tokens = estimateTokens(int64(len(res.Text)))
	return res, nil
}

func writeGraph(sb *strings.Builder, g *graph.Graph) {
	sb.WriteString("## Grafo de dependencias\n\n")

	if len(g.EntryPoints) > 0 {
		sb.WriteString("**Puntos de entrada** (nadie los importa dentro de la seleccion):\n\n")
		for _, e := range g.EntryPoints {
			sb.WriteString("- `" + e + "`\n")
		}
		sb.WriteString("\n")
	}

	if top := g.TopExternal(20); len(top) > 0 {
		parts := make([]string, 0, len(top))
		for _, name := range top {
			parts = append(parts, fmt.Sprintf("`%s` (%d)", name, g.External[name]))
		}
		sb.WriteString("**Dependencias externas mas usadas:** " + strings.Join(parts, ", ") + "\n\n")
	}

	sb.WriteString("**Mapa modulo por modulo:**\n\n")
	for _, n := range g.Files {
		if len(n.Imports) == 0 && len(n.Dependents) == 0 && len(n.Symbols) == 0 {
			continue
		}
		sb.WriteString("- `" + n.RelPath + "`")
		if len(n.Symbols) > 0 {
			sb.WriteString(" — define: " + strings.Join(n.Symbols, ", "))
		}
		sb.WriteString("\n")
		if len(n.Imports) > 0 {
			sb.WriteString("  - importa: " + joinCode(n.Imports) + "\n")
		}
		if len(n.Dependents) > 0 {
			sb.WriteString("  - usado por: " + joinCode(n.Dependents) + "\n")
		}
		if len(n.External) > 0 {
			sb.WriteString("  - externo: " + joinCode(n.External) + "\n")
		}
	}
	sb.WriteString("\n")

	if len(g.Orphans) > 0 {
		sb.WriteString("**Sin conexiones detectadas:** " + joinCode(g.Orphans) + "\n\n")
	}
}

// renderTree dibuja un arbol ASCII a partir de rutas planas
func renderTree(paths []string) string {
	type node struct {
		children map[string]*node
		isFile   bool
	}
	root := &node{children: map[string]*node{}}

	for _, p := range paths {
		cur := root
		segments := strings.Split(p, "/")
		for i, seg := range segments {
			child, ok := cur.children[seg]
			if !ok {
				child = &node{children: map[string]*node{}}
				cur.children[seg] = child
			}
			if i == len(segments)-1 {
				child.isFile = true
			}
			cur = child
		}
	}

	var sb strings.Builder
	var walk func(n *node, prefix string)
	walk = func(n *node, prefix string) {
		names := make([]string, 0, len(n.children))
		for name := range n.children {
			names = append(names, name)
		}
		sort.Slice(names, func(i, j int) bool {
			a, b := n.children[names[i]], n.children[names[j]]
			if a.isFile != b.isFile {
				return !a.isFile // carpetas primero
			}
			return names[i] < names[j]
		})

		for i, name := range names {
			child := n.children[name]
			last := i == len(names)-1
			branch := "├── "
			nextPrefix := prefix + "│   "
			if last {
				branch = "└── "
				nextPrefix = prefix + "    "
			}
			suffix := ""
			if !child.isFile {
				suffix = "/"
			}
			sb.WriteString(prefix + branch + name + suffix + "\n")
			walk(child, nextPrefix)
		}
	}
	walk(root, "")
	return sb.String()
}

func joinCode(items []string) string {
	parts := make([]string, 0, len(items))
	for _, item := range items {
		parts = append(parts, "`"+item+"`")
	}
	return strings.Join(parts, ", ")
}

// estimateTokens aproxima 1 token ≈ 4 bytes
func estimateTokens(bytes int64) int {
	return int(bytes / 4)
}

func humanBytes(b int64) string {
	switch {
	case b >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(b)/(1<<20))
	case b >= 1<<10:
		return fmt.Sprintf("%.1f KB", float64(b)/(1<<10))
	default:
		return fmt.Sprintf("%d B", b)
	}
}

func humanCount(n int) string {
	if n >= 1000 {
		return fmt.Sprintf("%.1fk", float64(n)/1000)
	}
	return fmt.Sprintf("%d", n)
}
