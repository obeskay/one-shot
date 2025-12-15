package fs

import (
	"os"
	"time"

	"shotgun/internal/domain"
	"shotgun/internal/ignore"
)

// Scanner orquesta el escaneo de un proyecto
type Scanner struct {
	walker *Walker
}

// ScannerOption configura el scanner
type ScannerOption func(*Scanner)

// NewScanner crea un nuevo scanner
func NewScanner(opts ...ScannerOption) *Scanner {
	s := &Scanner{
		walker: NewWalker(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// WithWalker configura un walker personalizado
func WithWalker(w *Walker) ScannerOption {
	return func(s *Scanner) {
		s.walker = w
	}
}

// ScanOptions opciones para el scan
type ScanOptions struct {
	UseGitignore     bool
	UseCustomIgnore  bool
	CustomIgnoreText string
	MaxDepth         int
	MaxFiles         int
}

// DefaultScanOptions opciones por defecto
func DefaultScanOptions() ScanOptions {
	return ScanOptions{
		UseGitignore:    true,
		UseCustomIgnore: false,
		MaxDepth:        20,
		MaxFiles:        10000,
	}
}

// Scan escanea un proyecto y retorna el snapshot
func (s *Scanner) Scan(rootPath string, opts ScanOptions) (*domain.TreeSnapshot, error) {
	// Verificar que existe
	info, err := os.Stat(rootPath)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, os.ErrInvalid
	}

	// Configurar ignore engine
	engine := ignore.New()
	if opts.UseGitignore {
		_ = engine.LoadGitignore(rootPath)
	}
	if opts.UseCustomIgnore && opts.CustomIgnoreText != "" {
		engine.LoadCustomPatterns(opts.CustomIgnoreText)
	}

	// Configurar walker
	walker := NewWalker(
		WithIgnoreEngine(engine),
		WithMaxDepth(opts.MaxDepth),
		WithMaxFiles(opts.MaxFiles),
	)

	// Ejecutar walk
	result := walker.Walk(rootPath)
	if result.Err != nil {
		return nil, result.Err
	}

	// Construir snapshot
	project := domain.NewProject(rootPath)
	snapshot := &domain.TreeSnapshot{
		Project:   project,
		Root:      result.Node,
		Stats:     result.Stats,
		CreatedAt: time.Now().UTC(),
		Version:   1,
	}

	return snapshot, nil
}

// ScanAsync escanea de forma asincrona con reporte de progreso
func (s *Scanner) ScanAsync(rootPath string, opts ScanOptions, onProgress func(current int)) (*domain.TreeSnapshot, error) {
	info, err := os.Stat(rootPath)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return nil, os.ErrInvalid
	}

	engine := ignore.New()
	if opts.UseGitignore {
		_ = engine.LoadGitignore(rootPath)
	}
	if opts.UseCustomIgnore && opts.CustomIgnoreText != "" {
		engine.LoadCustomPatterns(opts.CustomIgnoreText)
	}

	walker := NewWalker(
		WithIgnoreEngine(engine),
		WithMaxDepth(opts.MaxDepth),
		WithMaxFiles(opts.MaxFiles),
	)

	progress := make(chan int, 10)

	// Procesar progreso
	go func() {
		for p := range progress {
			if onProgress != nil {
				onProgress(p)
			}
		}
	}()

	result := walker.WalkAsync(rootPath, progress)
	if result.Err != nil {
		return nil, result.Err
	}

	project := domain.NewProject(rootPath)
	snapshot := &domain.TreeSnapshot{
		Project:   project,
		Root:      result.Node,
		Stats:     result.Stats,
		CreatedAt: time.Now().UTC(),
		Version:   1,
	}

	return snapshot, nil
}

// ReadFileContent lee el contenido de un archivo
func ReadFileContent(rootPath, relPath string, maxBytes int64) (string, bool, error) {
	fullPath := rootPath + "/" + relPath

	info, err := os.Stat(fullPath)
	if err != nil {
		return "", false, err
	}

	truncated := false
	size := info.Size()
	if maxBytes > 0 && size > maxBytes {
		size = maxBytes
		truncated = true
	}

	content, err := os.ReadFile(fullPath)
	if err != nil {
		return "", false, err
	}

	if truncated {
		content = content[:maxBytes]
	}

	return string(content), truncated, nil
}
