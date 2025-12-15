package fs

import (
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"shotgun/internal/domain"
	"shotgun/internal/ignore"
)

// WalkResult representa el resultado de recorrer un directorio
type WalkResult struct {
	Node  *domain.FileNode
	Stats domain.TreeStats
	Err   error
}

// Walker recorre el sistema de archivos
type Walker struct {
	ignoreEngine *ignore.Engine
	maxDepth     int
	maxFiles     int
}

// WalkerOption configura el walker
type WalkerOption func(*Walker)

// WithMaxDepth configura la profundidad maxima
func WithMaxDepth(depth int) WalkerOption {
	return func(w *Walker) {
		w.maxDepth = depth
	}
}

// WithMaxFiles configura el numero maximo de archivos
func WithMaxFiles(max int) WalkerOption {
	return func(w *Walker) {
		w.maxFiles = max
	}
}

// WithIgnoreEngine configura el motor de ignore
func WithIgnoreEngine(engine *ignore.Engine) WalkerOption {
	return func(w *Walker) {
		w.ignoreEngine = engine
	}
}

// NewWalker crea un nuevo walker
func NewWalker(opts ...WalkerOption) *Walker {
	w := &Walker{
		ignoreEngine: ignore.New(),
		maxDepth:     20,
		maxFiles:     10000,
	}
	for _, opt := range opts {
		opt(w)
	}
	return w
}

// Walk recorre un directorio y construye el arbol
func (w *Walker) Walk(rootPath string) WalkResult {
	result := WalkResult{
		Stats: domain.TreeStats{},
	}

	// Verificar que el path existe
	rootInfo, err := os.Stat(rootPath)
	if err != nil {
		result.Err = err
		return result
	}

	if !rootInfo.IsDir() {
		result.Err = os.ErrInvalid
		return result
	}

	// Crear nodo raiz
	rootNode := &domain.FileNode{
		RelPath:   ".",
		Name:      filepath.Base(rootPath),
		Kind:      domain.FileKindDir,
		ModTime:   rootInfo.ModTime(),
		SizeBytes: 0,
		Children:  make([]*domain.FileNode, 0),
	}

	// Map para construir el arbol
	nodeMap := make(map[string]*domain.FileNode)
	nodeMap["."] = rootNode

	// Recorrer el directorio
	err = filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return nil // Ignorar errores de acceso
		}

		// Calcular path relativo
		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return nil
		}

		// Ignorar raiz
		if relPath == "." {
			return nil
		}

		// Calcular profundidad
		depth := len(filepath.SplitList(filepath.ToSlash(relPath)))
		if depth > w.maxDepth {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Verificar limite de archivos
		if result.Stats.Files+result.Stats.Dirs >= w.maxFiles {
			return filepath.SkipAll
		}

		// Obtener info del archivo
		info, err := d.Info()
		if err != nil {
			return nil
		}

		isDir := d.IsDir()

		// Verificar si debe ser ignorado
		ignored, reason := w.ignoreEngine.Match(relPath, isDir)

		// Crear nodo
		node := &domain.FileNode{
			RelPath:   filepath.ToSlash(relPath),
			Name:      d.Name(),
			Kind:      getFileKind(d),
			Ext:       domain.GetFileExtension(d.Name()),
			SizeBytes: info.Size(),
			ModTime:   info.ModTime(),
			Ignored:   ignored,
			Reason:    reason,
		}

		if isDir {
			node.Children = make([]*domain.FileNode, 0)
			result.Stats.Dirs++
			if ignored {
				result.Stats.Ignored++
				return filepath.SkipDir // No entrar en directorios ignorados
			}
		} else {
			result.Stats.Files++
			result.Stats.TotalBytes += info.Size()
			if ignored {
				result.Stats.Ignored++
			}
		}

		// Actualizar profundidad maxima
		if depth > result.Stats.MaxDepth {
			result.Stats.MaxDepth = depth
		}

		// Agregar al arbol
		nodeMap[relPath] = node

		// Encontrar padre y agregar como hijo
		parentPath := filepath.Dir(relPath)
		if parentPath == "." {
			rootNode.Children = append(rootNode.Children, node)
		} else if parent, ok := nodeMap[parentPath]; ok {
			parent.Children = append(parent.Children, node)
		}

		return nil
	})

	if err != nil {
		result.Err = err
		return result
	}

	result.Node = rootNode
	return result
}

// getFileKind determina el tipo de nodo
func getFileKind(d fs.DirEntry) domain.FileKind {
	if d.IsDir() {
		return domain.FileKindDir
	}
	if d.Type()&os.ModeSymlink != 0 {
		return domain.FileKindLink
	}
	return domain.FileKindFile
}

// WalkAsync recorre de forma asincrona y envia progreso por canal
func (w *Walker) WalkAsync(rootPath string, progress chan<- int) WalkResult {
	result := WalkResult{
		Stats: domain.TreeStats{},
	}

	rootInfo, err := os.Stat(rootPath)
	if err != nil {
		result.Err = err
		close(progress)
		return result
	}

	if !rootInfo.IsDir() {
		result.Err = os.ErrInvalid
		close(progress)
		return result
	}

	rootNode := &domain.FileNode{
		RelPath:   ".",
		Name:      filepath.Base(rootPath),
		Kind:      domain.FileKindDir,
		ModTime:   rootInfo.ModTime(),
		SizeBytes: 0,
		Children:  make([]*domain.FileNode, 0),
	}

	nodeMap := make(map[string]*domain.FileNode)
	nodeMap["."] = rootNode

	count := 0
	lastReport := time.Now()

	err = filepath.WalkDir(rootPath, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return nil
		}

		relPath, err := filepath.Rel(rootPath, path)
		if err != nil {
			return nil
		}

		if relPath == "." {
			return nil
		}

		depth := len(filepath.SplitList(filepath.ToSlash(relPath)))
		if depth > w.maxDepth {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		if result.Stats.Files+result.Stats.Dirs >= w.maxFiles {
			return filepath.SkipAll
		}

		info, err := d.Info()
		if err != nil {
			return nil
		}

		isDir := d.IsDir()
		ignored, reason := w.ignoreEngine.Match(relPath, isDir)

		node := &domain.FileNode{
			RelPath:   filepath.ToSlash(relPath),
			Name:      d.Name(),
			Kind:      getFileKind(d),
			Ext:       domain.GetFileExtension(d.Name()),
			SizeBytes: info.Size(),
			ModTime:   info.ModTime(),
			Ignored:   ignored,
			Reason:    reason,
		}

		if isDir {
			node.Children = make([]*domain.FileNode, 0)
			result.Stats.Dirs++
			if ignored {
				result.Stats.Ignored++
				return filepath.SkipDir
			}
		} else {
			result.Stats.Files++
			result.Stats.TotalBytes += info.Size()
			if ignored {
				result.Stats.Ignored++
			}
		}

		if depth > result.Stats.MaxDepth {
			result.Stats.MaxDepth = depth
		}

		nodeMap[relPath] = node

		parentPath := filepath.Dir(relPath)
		if parentPath == "." {
			rootNode.Children = append(rootNode.Children, node)
		} else if parent, ok := nodeMap[parentPath]; ok {
			parent.Children = append(parent.Children, node)
		}

		// Reportar progreso cada 100ms
		count++
		if time.Since(lastReport) > 100*time.Millisecond {
			select {
			case progress <- count:
			default:
			}
			lastReport = time.Now()
		}

		return nil
	})

	close(progress)

	if err != nil {
		result.Err = err
		return result
	}

	result.Node = rootNode
	return result
}
