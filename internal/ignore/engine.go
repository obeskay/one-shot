package ignore

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// Engine maneja las reglas de ignore para el scanner
type Engine struct {
	patterns      []pattern
	defaultIgnore []string
}

type pattern struct {
	raw      string
	negation bool
	dirOnly  bool
	glob     string
}

// DefaultIgnorePatterns patrones por defecto que siempre se ignoran
var DefaultIgnorePatterns = []string{
	".git",
	".svn",
	".hg",
	"node_modules",
	"__pycache__",
	".pytest_cache",
	".mypy_cache",
	"venv",
	".venv",
	"env",
	".env",
	"dist",
	"build",
	".next",
	".nuxt",
	"target",
	"vendor",
	".idea",
	".vscode",
	"*.pyc",
	"*.pyo",
	"*.class",
	"*.o",
	"*.a",
	"*.so",
	"*.dylib",
	"*.exe",
	"*.dll",
	".DS_Store",
	"Thumbs.db",
	"*.log",
	"*.tmp",
	"*.temp",
	"*.swp",
	"*.swo",
	"*~",
	"go.sum",
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
	"Cargo.lock",
	"Gemfile.lock",
	"poetry.lock",
}

// New crea un nuevo Engine con patrones por defecto
func New() *Engine {
	return &Engine{
		patterns:      make([]pattern, 0),
		defaultIgnore: DefaultIgnorePatterns,
	}
}

// LoadGitignore carga patrones desde un archivo .gitignore
func (e *Engine) LoadGitignore(rootPath string) error {
	gitignorePath := filepath.Join(rootPath, ".gitignore")

	file, err := os.Open(gitignorePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // No es error si no existe
		}
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		e.AddPattern(line)
	}

	return scanner.Err()
}

// LoadCustomPatterns carga patrones personalizados desde texto
func (e *Engine) LoadCustomPatterns(text string) {
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		e.AddPattern(line)
	}
}

// AddPattern agrega un patron al engine
func (e *Engine) AddPattern(raw string) {
	p := pattern{raw: raw}

	// Detectar negacion
	if strings.HasPrefix(raw, "!") {
		p.negation = true
		raw = raw[1:]
	}

	// Detectar si es solo para directorios
	if strings.HasSuffix(raw, "/") {
		p.dirOnly = true
		raw = strings.TrimSuffix(raw, "/")
	}

	p.glob = raw
	e.patterns = append(e.patterns, p)
}

// Match verifica si un path debe ser ignorado
// relPath debe ser relativo al root del proyecto
// isDir indica si el path es un directorio
func (e *Engine) Match(relPath string, isDir bool) (ignored bool, reason string) {
	name := filepath.Base(relPath)

	// Verificar patrones por defecto primero
	for _, defaultPattern := range e.defaultIgnore {
		if matchGlob(defaultPattern, name, relPath) {
			return true, "default"
		}
	}

	// Verificar patrones cargados
	ignored = false
	for _, p := range e.patterns {
		if p.dirOnly && !isDir {
			continue
		}

		matches := matchGlob(p.glob, name, relPath)
		if matches {
			if p.negation {
				ignored = false
				reason = ""
			} else {
				ignored = true
				reason = "gitignore"
			}
		}
	}

	return ignored, reason
}

// matchGlob implementa matching simple de glob patterns
func matchGlob(pattern, name, relPath string) bool {
	// Pattern con path separator - match contra relPath
	if strings.Contains(pattern, "/") {
		pattern = strings.TrimPrefix(pattern, "/")
		return matchSimpleGlob(pattern, relPath)
	}

	// Pattern simple - match contra nombre
	return matchSimpleGlob(pattern, name)
}

// matchSimpleGlob implementa matching basico de * y **
func matchSimpleGlob(pattern, text string) bool {
	// Match exacto
	if pattern == text {
		return true
	}

	// Pattern con **
	if strings.Contains(pattern, "**") {
		parts := strings.Split(pattern, "**")
		if len(parts) == 2 {
			return strings.HasPrefix(text, strings.TrimSuffix(parts[0], "/")) &&
				strings.HasSuffix(text, strings.TrimPrefix(parts[1], "/"))
		}
	}

	// Pattern con * simple
	if strings.Contains(pattern, "*") {
		parts := strings.Split(pattern, "*")
		if len(parts) == 2 {
			return strings.HasPrefix(text, parts[0]) && strings.HasSuffix(text, parts[1])
		}
	}

	return false
}

// IsDefaultIgnored verifica si un nombre esta en la lista de ignore por defecto
func (e *Engine) IsDefaultIgnored(name string) bool {
	for _, pattern := range e.defaultIgnore {
		if matchGlob(pattern, name, name) {
			return true
		}
	}
	return false
}
