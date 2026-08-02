package domain

import (
	"path/filepath"
	goruntime "runtime"
	"strings"
	"time"
)

// ---------------------------------------------------------------------------
// Internal Domain Models (separados de DTOs para flexibilidad)
// ---------------------------------------------------------------------------

// Project representa un proyecto abierto (entidad interna)
type Project struct {
	RootPath string
	RepoName string
	OpenedAt time.Time
}

// NewProject crea un nuevo proyecto desde un path
func NewProject(rootPath string) *Project {
	return &Project{
		RootPath: rootPath,
		RepoName: filepath.Base(rootPath),
		OpenedAt: time.Now().UTC(),
	}
}

// ToDTO convierte a DTO para serializacion
func (p *Project) ToDTO() ProjectDTO {
	return ProjectDTO{
		RootPath: p.RootPath,
		RepoName: p.RepoName,
		OpenedAt: ISOTime(p.OpenedAt.Format(time.RFC3339Nano)),
		Platform: goruntime.GOOS,
	}
}

// FileNode nodo del arbol de archivos (entidad interna)
type FileNode struct {
	RelPath   string
	Name      string
	Kind      FileKind
	Ext       string
	SizeBytes int64
	ModTime   time.Time
	Ignored   bool
	Reason    string
	Children  []*FileNode
}

// ToDTO convierte recursivamente a DTO
func (n *FileNode) ToDTO() FileNodeDTO {
	dto := FileNodeDTO{
		Id:        n.RelPath,
		RelPath:   n.RelPath,
		Name:      n.Name,
		Kind:      n.Kind,
		Ext:       n.Ext,
		SizeBytes: n.SizeBytes,
		ModTime:   ISOTime(n.ModTime.Format(time.RFC3339Nano)),
		Ignored:   n.Ignored,
		Reason:    n.Reason,
	}

	if len(n.Children) > 0 {
		dto.Children = make([]FileNodeDTO, len(n.Children))
		for i, child := range n.Children {
			dto.Children[i] = child.ToDTO()
		}
	}

	return dto
}

// TreeSnapshot snapshot del arbol (entidad interna)
type TreeSnapshot struct {
	Project   *Project
	Root      *FileNode
	Stats     TreeStats
	CreatedAt time.Time
	Version   int
}

// ToDTO convierte a DTO
func (s *TreeSnapshot) ToDTO() TreeSnapshotDTO {
	return TreeSnapshotDTO{
		Project:   s.Project.ToDTO(),
		Root:      s.Root.ToDTO(),
		Stats:     s.Stats.ToDTO(),
		CreatedAt: ISOTime(s.CreatedAt.Format(time.RFC3339Nano)),
		Version:   s.Version,
	}
}

// TreeStats estadisticas del arbol (entidad interna)
type TreeStats struct {
	Files      int
	Dirs       int
	TotalBytes int64
	Ignored    int
	MaxDepth   int
}

// ToDTO convierte a DTO
func (s TreeStats) ToDTO() TreeStatsDTO {
	return TreeStatsDTO{
		Files:      s.Files,
		Dirs:       s.Dirs,
		TotalBytes: s.TotalBytes,
		Ignored:    s.Ignored,
		MaxDepth:   s.MaxDepth,
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// GetFileExtension extrae la extension de un nombre de archivo
func GetFileExtension(name string) string {
	ext := filepath.Ext(name)
	if ext != "" {
		return strings.TrimPrefix(ext, ".")
	}
	return ""
}

// EstimateTokens estima tokens usando heuristica 4-char/token
func EstimateTokens(content string) int {
	return len(content) / 4
}
