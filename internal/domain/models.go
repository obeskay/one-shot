package domain

import (
	"context"
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
// Job Management (entidades internas)
// ---------------------------------------------------------------------------

// Job representa un trabajo en ejecucion
type Job struct {
	ID        string
	Kind      JobKind
	State     JobState
	Stage     string
	Current   int64
	Total     int64
	Message   string
	StartedAt time.Time
	UpdatedAt time.Time
	Error     error
	Cancel    context.CancelFunc
}

// ToDTO convierte a DTO
func (j *Job) ToDTO() JobProgressDTO {
	dto := JobProgressDTO{
		JobId:     j.ID,
		Kind:      j.Kind,
		State:     j.State,
		Stage:     j.Stage,
		Current:   j.Current,
		Total:     j.Total,
		Message:   j.Message,
		StartedAt: ISOTime(j.StartedAt.Format(time.RFC3339Nano)),
		UpdatedAt: ISOTime(j.UpdatedAt.Format(time.RFC3339Nano)),
	}

	if j.Error != nil {
		dto.Error = &ErrorDTO{
			Code:    "JOB_ERROR",
			Message: j.Error.Error(),
		}
	}

	return dto
}

// ---------------------------------------------------------------------------
// Context Building (entidades internas)
// ---------------------------------------------------------------------------

// ContextFile archivo procesado para el contexto
type ContextFile struct {
	RelPath   string
	SizeBytes int64
	Content   string
	Truncated bool
}

// ToDTO convierte a DTO
func (f *ContextFile) ToDTO() ContextFileDTO {
	return ContextFileDTO{
		Id:        f.RelPath,
		RelPath:   f.RelPath,
		SizeBytes: f.SizeBytes,
		Content:   f.Content,
		Truncated: f.Truncated,
	}
}

// ContextPayload payload completo del contexto
type ContextPayload struct {
	Files      []*ContextFile
	TotalBytes int64
	Warnings   []string
	CreatedAt  time.Time
}

// ToDTO convierte a DTO
func (p *ContextPayload) ToDTO(opts ContextBuildOptionsDTO) ContextPayloadDTO {
	files := make([]ContextFileDTO, len(p.Files))
	for i, f := range p.Files {
		files[i] = f.ToDTO()
	}

	return ContextPayloadDTO{
		Options:    opts,
		Files:      files,
		TotalBytes: p.TotalBytes,
		Warnings:   p.Warnings,
		CreatedAt:  ISOTime(p.CreatedAt.Format(time.RFC3339Nano)),
	}
}

// ---------------------------------------------------------------------------
// LLM (entidades internas)
// ---------------------------------------------------------------------------

// ChatMessage mensaje de chat interno
type ChatMessage struct {
	Role      ChatRole
	Content   string
	CreatedAt time.Time
}

// ToDTO convierte a DTO
func (m *ChatMessage) ToDTO() ChatMessageDTO {
	return ChatMessageDTO{
		Role:      m.Role,
		Content:   m.Content,
		CreatedAt: ISOTime(m.CreatedAt.Format(time.RFC3339Nano)),
	}
}

// PromptResult resultado de un prompt
type PromptResult struct {
	RunId        string
	Provider     ProviderID
	Model        string
	Text         string
	InputTokens  int
	OutputTokens int
	CreatedAt    time.Time
	Error        error
}

// ToDTO convierte a DTO
func (r *PromptResult) ToDTO() PromptRunResultDTO {
	dto := PromptRunResultDTO{
		RunId:    r.RunId,
		Provider: r.Provider,
		Model:    r.Model,
		Text:     r.Text,
		Usage: UsageDTO{
			InputTokens:  r.InputTokens,
			OutputTokens: r.OutputTokens,
			TotalTokens:  r.InputTokens + r.OutputTokens,
		},
		CreatedAt: ISOTime(r.CreatedAt.Format(time.RFC3339Nano)),
	}

	if r.Error != nil {
		dto.Error = &ErrorDTO{
			Code:    "LLM_ERROR",
			Message: r.Error.Error(),
		}
	}

	return dto
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
