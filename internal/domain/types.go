package domain

import (
	"crypto/rand"
	"fmt"
	"time"
)

// NewUUID genera un UUID v4 simple
func NewUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// ══════════════════════════════════════════════════════════════════════════════
// Common Types
// ══════════════════════════════════════════════════════════════════════════════

// ISOTime representa timestamps en formato RFC3339 (UTC)
type ISOTime string

func NowISO() ISOTime {
	return ISOTime(time.Now().UTC().Format(time.RFC3339Nano))
}

func (t ISOTime) Time() (time.Time, error) {
	return time.Parse(time.RFC3339Nano, string(t))
}

// ErrorDTO estructura estándar para errores
type ErrorDTO struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

// ══════════════════════════════════════════════════════════════════════════════
// Project / Tree DTOs
// ══════════════════════════════════════════════════════════════════════════════

// ProjectDTO información del proyecto abierto
type ProjectDTO struct {
	RootPath string  `json:"rootPath"`
	RepoName string  `json:"repoName"`
	OpenedAt ISOTime `json:"openedAt"`
	ScanHash string  `json:"scanHash,omitempty"`
	Platform string  `json:"platform,omitempty"`
}

// TreeSnapshotDTO snapshot completo del árbol de archivos
type TreeSnapshotDTO struct {
	Project   ProjectDTO   `json:"project"`
	Root      FileNodeDTO  `json:"root"`
	Stats     TreeStatsDTO `json:"stats"`
	CreatedAt ISOTime      `json:"createdAt"`
	Version   int          `json:"version"`
}

// TreeStatsDTO estadísticas del árbol
type TreeStatsDTO struct {
	Files      int   `json:"files"`
	Dirs       int   `json:"dirs"`
	TotalBytes int64 `json:"totalBytes"`
	Ignored    int   `json:"ignored"`
	MaxDepth   int   `json:"maxDepth"`
}

// FileKind tipo de nodo en el árbol
type FileKind string

const (
	FileKindDir  FileKind = "dir"
	FileKindFile FileKind = "file"
	FileKindLink FileKind = "link"
)

// FileNodeDTO nodo individual del árbol
type FileNodeDTO struct {
	Id        string        `json:"id"`
	RelPath   string        `json:"relPath"`
	Name      string        `json:"name"`
	Kind      FileKind      `json:"kind"`
	Ext       string        `json:"ext,omitempty"`
	SizeBytes int64         `json:"sizeBytes,omitempty"`
	ModTime   ISOTime       `json:"modTime,omitempty"`
	Hash      string        `json:"hash,omitempty"`
	Ignored   bool          `json:"ignored"`
	Reason    string        `json:"reason,omitempty"`
	Children  []FileNodeDTO `json:"children,omitempty"`
}

// ══════════════════════════════════════════════════════════════════════════════
// Selection / Ignore DTOs
// ══════════════════════════════════════════════════════════════════════════════

// SelectionDTO estado de selección del usuario
type SelectionDTO struct {
	SelectedIds []string `json:"selectedIds"`
	ExpandedIds []string `json:"expandedIds,omitempty"`
	FocusId     string   `json:"focusId,omitempty"`
}

// IgnoreOptionsDTO configuración de reglas de ignore
type IgnoreOptionsDTO struct {
	UseGitignore     bool   `json:"useGitignore"`
	UseCustomIgnore  bool   `json:"useCustomIgnore"`
	CustomIgnoreText string `json:"customIgnoreText,omitempty"`
}
