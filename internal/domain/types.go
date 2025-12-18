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

// ══════════════════════════════════════════════════════════════════════════════
// Job DTOs
// ══════════════════════════════════════════════════════════════════════════════

// JobKind tipo de trabajo
type JobKind string

const (
	JobKindScan         JobKind = "scan"
	JobKindBuildContext JobKind = "buildContext"
	JobKindRunPrompt    JobKind = "runPrompt"
)

// JobState estado del trabajo
type JobState string

const (
	JobStateQueued    JobState = "queued"
	JobStateRunning   JobState = "running"
	JobStateSucceeded JobState = "succeeded"
	JobStateFailed    JobState = "failed"
	JobStateCancelled JobState = "cancelled"
)

// JobProgressDTO progreso de un trabajo
type JobProgressDTO struct {
	JobId     string    `json:"jobId"`
	Kind      JobKind   `json:"kind"`
	State     JobState  `json:"state"`
	Stage     string    `json:"stage,omitempty"`
	Current   int64     `json:"current,omitempty"`
	Total     int64     `json:"total,omitempty"`
	Message   string    `json:"message,omitempty"`
	StartedAt ISOTime   `json:"startedAt,omitempty"`
	UpdatedAt ISOTime   `json:"updatedAt,omitempty"`
	Error     *ErrorDTO `json:"error,omitempty"`
}

// ══════════════════════════════════════════════════════════════════════════════
// Context DTOs
// ══════════════════════════════════════════════════════════════════════════════

// ContextBuildOptionsDTO opciones para construir el contexto
type ContextBuildOptionsDTO struct {
	MaxBytes      int64  `json:"maxBytes"`
	MaxFileBytes  int64  `json:"maxFileBytes"`
	IncludeBinary bool   `json:"includeBinary"`
	Format        string `json:"format"` // "xmlish" | "markdown"
}

// ContextFileDTO archivo incluido en el contexto
type ContextFileDTO struct {
	Id        string `json:"id"`
	RelPath   string `json:"relPath"`
	SizeBytes int64  `json:"sizeBytes,omitempty"`
	Truncated bool   `json:"truncated"`
	Content   string `json:"content"`
}

// ContextPayloadDTO payload completo del contexto
type ContextPayloadDTO struct {
	SnapshotId string                 `json:"snapshotId,omitempty"`
	Options    ContextBuildOptionsDTO `json:"options"`
	Files      []ContextFileDTO       `json:"files"`
	TotalBytes int64                  `json:"totalBytes"`
	Warnings   []string               `json:"warnings,omitempty"`
	CreatedAt  ISOTime                `json:"createdAt"`
}

// ══════════════════════════════════════════════════════════════════════════════
// LLM / Prompt DTOs
// ══════════════════════════════════════════════════════════════════════════════

// ProviderID identificador del proveedor LLM
// Defined in providers.go

// ChatRole rol en la conversación
type ChatRole string

const (
	RoleSystem    ChatRole = "system"
	RoleUser      ChatRole = "user"
	RoleAssistant ChatRole = "assistant"
)

// ChatMessageDTO mensaje de chat
type ChatMessageDTO struct {
	Role      ChatRole `json:"role"`
	Content   string   `json:"content"`
	CreatedAt ISOTime  `json:"createdAt,omitempty"`
}

// PromptRunSpecDTO especificación para ejecutar un prompt
type PromptRunSpecDTO struct {
	Provider        ProviderID         `json:"provider"`
	Model           string             `json:"model"`
	Temperature     float64            `json:"temperature,omitempty"`
	MaxOutputTokens int                `json:"maxOutputTokens,omitempty"`
	Metadata        map[string]string  `json:"metadata,omitempty"`
	Messages        []ChatMessageDTO   `json:"messages"`
	Context         *ContextPayloadDTO `json:"context,omitempty"`
}

// UsageDTO uso de tokens
type UsageDTO struct {
	InputTokens  int `json:"inputTokens,omitempty"`
	OutputTokens int `json:"outputTokens,omitempty"`
	TotalTokens  int `json:"totalTokens,omitempty"`
}

// PromptRunResultDTO resultado de ejecutar un prompt
type PromptRunResultDTO struct {
	RunId     string         `json:"runId"`
	Provider  ProviderID     `json:"provider"`
	Model     string         `json:"model"`
	Text      string         `json:"text"`
	RawCall   map[string]any `json:"rawCall,omitempty"`
	Usage     UsageDTO       `json:"usage,omitempty"`
	CreatedAt ISOTime        `json:"createdAt"`
	Error     *ErrorDTO      `json:"error,omitempty"`
}

// ══════════════════════════════════════════════════════════════════════════════
// History DTOs
// ══════════════════════════════════════════════════════════════════════════════

// HistoryItemDTO item del historial
type HistoryItemDTO struct {
	Id        string             `json:"id"`
	Title     string             `json:"title,omitempty"`
	Spec      PromptRunSpecDTO   `json:"spec"`
	Result    PromptRunResultDTO `json:"result"`
	CreatedAt ISOTime            `json:"createdAt"`
}
