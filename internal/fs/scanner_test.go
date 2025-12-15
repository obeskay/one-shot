package fs

import (
	"os"
	"path/filepath"
	"testing"

	"shotgun/internal/domain"
)

func TestScanner_Scan(t *testing.T) {
	// Crear directorio temporal
	tmpDir, err := os.MkdirTemp("", "scanner-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Crear estructura de archivos
	files := map[string]string{
		"src/main.go":      "package main",
		"src/util/help.go": "package util",
		"README.md":        "# Test",
		"config.json":      "{}",
		".gitignore":       "*.log\n",
	}

	for path, content := range files {
		fullPath := filepath.Join(tmpDir, path)
		dir := filepath.Dir(fullPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed to create dir %s: %v", dir, err)
		}
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write file %s: %v", path, err)
		}
	}

	// Crear archivo que debe ser ignorado
	logFile := filepath.Join(tmpDir, "debug.log")
	if err := os.WriteFile(logFile, []byte("log content"), 0644); err != nil {
		t.Fatalf("failed to write log file: %v", err)
	}

	// Ejecutar scan
	scanner := NewScanner()
	opts := DefaultScanOptions()
	snapshot, err := scanner.Scan(tmpDir, opts)
	if err != nil {
		t.Fatalf("scan failed: %v", err)
	}

	// Verificar snapshot
	if snapshot == nil {
		t.Fatal("snapshot is nil")
	}

	if snapshot.Root == nil {
		t.Fatal("root is nil")
	}

	// Verificar stats (2 dirs: src, src/util + 5 files)
	if snapshot.Stats.Dirs < 2 {
		t.Errorf("expected at least 2 dirs, got %d", snapshot.Stats.Dirs)
	}

	if snapshot.Stats.Files < 4 {
		t.Errorf("expected at least 4 files, got %d", snapshot.Stats.Files)
	}

	// Verificar que .log fue ignorado
	if snapshot.Stats.Ignored < 1 {
		t.Errorf("expected at least 1 ignored, got %d", snapshot.Stats.Ignored)
	}

	t.Logf("Stats: files=%d dirs=%d ignored=%d bytes=%d",
		snapshot.Stats.Files, snapshot.Stats.Dirs,
		snapshot.Stats.Ignored, snapshot.Stats.TotalBytes)
}

func TestScanner_DefaultIgnore(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "ignore-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Crear directorio node_modules (debe ser ignorado por defecto)
	nodeModules := filepath.Join(tmpDir, "node_modules", "lodash")
	if err := os.MkdirAll(nodeModules, 0755); err != nil {
		t.Fatalf("failed to create node_modules: %v", err)
	}
	if err := os.WriteFile(filepath.Join(nodeModules, "index.js"), []byte("module.exports"), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}

	// Crear archivo .DS_Store (debe ser ignorado)
	if err := os.WriteFile(filepath.Join(tmpDir, ".DS_Store"), []byte(""), 0644); err != nil {
		t.Fatalf("failed to write .DS_Store: %v", err)
	}

	// Crear archivo normal
	if err := os.WriteFile(filepath.Join(tmpDir, "index.js"), []byte("console.log"), 0644); err != nil {
		t.Fatalf("failed to write index.js: %v", err)
	}

	scanner := NewScanner()
	opts := DefaultScanOptions()
	snapshot, err := scanner.Scan(tmpDir, opts)
	if err != nil {
		t.Fatalf("scan failed: %v", err)
	}

	// node_modules debe ser ignorado (skip dir)
	// .DS_Store debe ser ignorado (marcado pero contado)
	// Solo index.js debe ser archivo no-ignorado
	t.Logf("Stats: files=%d dirs=%d ignored=%d", snapshot.Stats.Files, snapshot.Stats.Dirs, snapshot.Stats.Ignored)

	// Verificar que node_modules fue saltado (no hay lodash/index.js en el arbol)
	if snapshot.Stats.Ignored < 1 {
		t.Errorf("expected at least 1 ignored entry, got %d", snapshot.Stats.Ignored)
	}
}

func TestWalker_MaxDepth(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "depth-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Crear estructura profunda
	deepPath := filepath.Join(tmpDir, "a", "b", "c", "d", "e", "f")
	if err := os.MkdirAll(deepPath, 0755); err != nil {
		t.Fatalf("failed to create deep path: %v", err)
	}
	if err := os.WriteFile(filepath.Join(deepPath, "deep.txt"), []byte("deep"), 0644); err != nil {
		t.Fatalf("failed to write deep file: %v", err)
	}

	// Walk con maxDepth=3
	walker := NewWalker(WithMaxDepth(3))
	result := walker.Walk(tmpDir)
	if result.Err != nil {
		t.Fatalf("walk failed: %v", result.Err)
	}

	// No debe incluir archivos mas alla de depth 3
	if result.Stats.MaxDepth > 3 {
		t.Errorf("expected max depth <= 3, got %d", result.Stats.MaxDepth)
	}
}

func TestReadFileContent(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "read-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	content := "Hello, World! This is a test file with some content."
	if err := os.WriteFile(filepath.Join(tmpDir, "test.txt"), []byte(content), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}

	// Leer sin truncar
	read, truncated, err := ReadFileContent(tmpDir, "test.txt", 0)
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if truncated {
		t.Error("expected not truncated")
	}
	if read != content {
		t.Errorf("content mismatch: got %q, want %q", read, content)
	}

	// Leer con truncado
	read, truncated, err = ReadFileContent(tmpDir, "test.txt", 10)
	if err != nil {
		t.Fatalf("read failed: %v", err)
	}
	if !truncated {
		t.Error("expected truncated")
	}
	if len(read) != 10 {
		t.Errorf("expected 10 bytes, got %d", len(read))
	}
}

func findNode(node *domain.FileNode, relPath string) *domain.FileNode {
	if node.RelPath == relPath {
		return node
	}
	for _, child := range node.Children {
		if found := findNode(child, relPath); found != nil {
			return found
		}
	}
	return nil
}
