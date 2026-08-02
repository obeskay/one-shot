package app

import (
	"fmt"
	"sync"

	"shotgun/internal/domain"
	"shotgun/internal/fs"
	"shotgun/internal/graph"
)

// maxGraphFileBytes evita que un bundle minificado domine el grafo del proyecto
const maxGraphFileBytes = 512 * 1024

// projectGraph cachea el grafo completo de un proyecto entre llamadas
type projectGraph struct {
	mu       sync.Mutex
	rootPath string
	graph    *graph.Graph
}

// invalidate descarta el grafo cacheado (al reescanear o cambiar de proyecto)
func (p *projectGraph) invalidate() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.rootPath = ""
	p.graph = nil
}

// ExpandSelection agrega a la seleccion los archivos que esta importa.
// depth <= 0 sigue las dependencias hasta el fondo; depth = 1 solo un nivel.
// Devuelve la seleccion ampliada, ordenada.
func (a *App) ExpandSelection(projectPath string, relPaths []string, depth int) ([]string, error) {
	if len(relPaths) == 0 {
		return nil, fmt.Errorf("no hay archivos seleccionados")
	}

	g, err := a.projectGraph(projectPath)
	if err != nil {
		return nil, err
	}

	expanded := g.Closure(relPaths, depth)
	a.logger.Info("Seleccion expandida por grafo",
		"antes", len(relPaths), "despues", len(expanded), "depth", depth)
	return expanded, nil
}

// projectGraph construye (o reutiliza) el grafo de todo el proyecto
func (a *App) projectGraph(projectPath string) (*graph.Graph, error) {
	a.graphCache.mu.Lock()
	defer a.graphCache.mu.Unlock()

	if a.graphCache.graph != nil && a.graphCache.rootPath == projectPath {
		return a.graphCache.graph, nil
	}

	snapshot, err := a.scanner.Scan(projectPath, fs.DefaultScanOptions())
	if err != nil {
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	contents := make(map[string]string)
	collectSources(projectPath, snapshot.Root, contents)

	g := graph.Build(contents)
	a.graphCache.rootPath = projectPath
	a.graphCache.graph = g

	a.logger.Info("Grafo del proyecto construido", "archivos", len(contents))
	return g, nil
}

// collectSources lee los archivos de codigo del arbol, saltando binarios
func collectSources(rootPath string, node *domain.FileNode, out map[string]string) {
	if node == nil {
		return
	}

	for _, child := range node.Children {
		collectSources(rootPath, child, out)
	}

	if node.Kind != domain.FileKindFile || node.Ignored {
		return
	}
	// Solo lenguajes que el grafo sabe leer
	if graph.Lang(node.RelPath) == "" {
		return
	}
	if node.SizeBytes > maxGraphFileBytes {
		return
	}

	content, _, err := fs.ReadFileContent(rootPath, node.RelPath, maxGraphFileBytes)
	if err != nil || fs.IsBinary([]byte(content)) {
		return
	}
	out[node.RelPath] = content
}
