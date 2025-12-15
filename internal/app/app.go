package app

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	goruntime "runtime"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"

	ctx "shotgun/internal/context"
	"shotgun/internal/domain"
	"shotgun/internal/fs"
	"shotgun/internal/jobs"
	"shotgun/internal/llm"
)

// App estructura principal de la aplicacion Wails
type App struct {
	ctx        context.Context
	scanner    *fs.Scanner
	jobManager *jobs.Manager
	llmService *llm.Service
	ctxBuilder *ctx.Builder
}

// New crea una nueva instancia de la aplicacion
func New() *App {
	return &App{
		scanner:    fs.NewScanner(),
		jobManager: jobs.NewManager(),
		llmService: llm.NewService(),
	}
}

// Startup se llama cuando la aplicacion inicia
func (a *App) Startup(wailsCtx context.Context) {
	a.ctx = wailsCtx

	// Registrar providers de LLM (API keys vienen del frontend por ahora)
	// En produccion, leer de configuracion
}

// Shutdown se llama cuando la aplicacion se cierra
func (a *App) Shutdown(ctx context.Context) {
	// Cleanup
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - Project Management
// ---------------------------------------------------------------------------

// SelectProject abre un dialogo para seleccionar un directorio
func (a *App) SelectProject() (string, error) {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleccionar proyecto",
	})
	if err != nil {
		return "", fmt.Errorf("error opening directory dialog: %w", err)
	}

	// Inicializar context builder con el nuevo path
	if path != "" {
		a.ctxBuilder = ctx.NewBuilder(path)
	}

	return path, nil
}

// ScanProject escanea un proyecto y retorna el arbol de archivos
func (a *App) ScanProject(path string) (*domain.TreeSnapshotDTO, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("path does not exist: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("path is not a directory")
	}

	// Inicializar context builder
	a.ctxBuilder = ctx.NewBuilder(path)

	opts := fs.DefaultScanOptions()
	snapshot, err := a.scanner.Scan(path, opts)
	if err != nil {
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	dto := snapshot.ToDTO()
	return &dto, nil
}

// ScanProjectWithOptions escanea con opciones personalizadas
func (a *App) ScanProjectWithOptions(path string, useGitignore bool, customIgnore string) (*domain.TreeSnapshotDTO, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("path does not exist: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("path is not a directory")
	}

	a.ctxBuilder = ctx.NewBuilder(path)

	opts := fs.ScanOptions{
		UseGitignore:     useGitignore,
		UseCustomIgnore:  customIgnore != "",
		CustomIgnoreText: customIgnore,
		MaxDepth:         20,
		MaxFiles:         10000,
	}

	snapshot, err := a.scanner.Scan(path, opts)
	if err != nil {
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	dto := snapshot.ToDTO()
	return &dto, nil
}

// ReadFile lee el contenido de un archivo
func (a *App) ReadFile(relPath string, projectPath string) (string, error) {
	fullPath := filepath.Join(projectPath, relPath)

	absProject, _ := filepath.Abs(projectPath)
	absFile, _ := filepath.Abs(fullPath)
	if len(absFile) < len(absProject) || absFile[:len(absProject)] != absProject {
		return "", fmt.Errorf("path traversal attempt detected")
	}

	content, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("error reading file: %w", err)
	}

	return string(content), nil
}

// ReadFileWithLimit lee contenido con limite de bytes
func (a *App) ReadFileWithLimit(relPath string, projectPath string, maxBytes int64) (string, bool, error) {
	content, truncated, err := fs.ReadFileContent(projectPath, relPath, maxBytes)
	if err != nil {
		return "", false, fmt.Errorf("error reading file: %w", err)
	}
	return content, truncated, nil
}

// GetPlatform retorna informacion de la plataforma
func (a *App) GetPlatform() string {
	return goruntime.GOOS
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - Job Management
// ---------------------------------------------------------------------------

// CancelJob cancela un trabajo en ejecucion
func (a *App) CancelJob(jobId string) error {
	if !a.jobManager.CancelJob(jobId) {
		return fmt.Errorf("job not found or already completed: %s", jobId)
	}
	return nil
}

// GetJobStatus obtiene el estado de un job
func (a *App) GetJobStatus(jobId string) (*domain.JobProgressDTO, error) {
	job := a.jobManager.GetJob(jobId)
	if job == nil {
		return nil, fmt.Errorf("job not found: %s", jobId)
	}
	dto := job.ToDTO()
	return &dto, nil
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - Context Building
// ---------------------------------------------------------------------------

// BuildContext construye el contexto para un prompt
func (a *App) BuildContext(selection domain.SelectionDTO, options domain.ContextBuildOptionsDTO, projectPath string) (*domain.ContextPayloadDTO, error) {
	if a.ctxBuilder == nil {
		a.ctxBuilder = ctx.NewBuilder(projectPath)
	}

	payload, err := a.ctxBuilder.Build(selection, options)
	if err != nil {
		return nil, fmt.Errorf("build context failed: %w", err)
	}

	return payload, nil
}

// FormatContext formatea el payload de contexto
func (a *App) FormatContext(payload domain.ContextPayloadDTO) string {
	if a.ctxBuilder == nil {
		return ""
	}
	return a.ctxBuilder.FormatPayload(&payload)
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - LLM
// ---------------------------------------------------------------------------

// ConfigureLLM configura un provider de LLM con API key
func (a *App) ConfigureLLM(provider string, apiKey string, baseURL string) error {
	var p llm.Provider

	switch provider {
	case "openai":
		p = llm.NewOpenAIProvider(apiKey, baseURL)
	case "openrouter":
		p = llm.NewOpenRouterProvider(apiKey)
	default:
		return fmt.Errorf("unknown provider: %s", provider)
	}

	a.llmService.RegisterProvider(domain.ProviderID(provider), p)
	return nil
}

// RunPrompt ejecuta un prompt contra el LLM
func (a *App) RunPrompt(spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	result, err := a.llmService.Complete(a.ctx, spec)
	if err != nil {
		return nil, fmt.Errorf("prompt failed: %w", err)
	}
	return result, nil
}

// StreamPrompt ejecuta un prompt con streaming via Wails Events
func (a *App) StreamPrompt(spec domain.PromptRunSpecDTO) (string, error) {
	job, jobCtx := a.jobManager.CreateJob(domain.JobKindRunPrompt)

	go func() {
		a.jobManager.UpdateJob(job.ID, domain.JobStateRunning, "streaming", 0, 0, "")

		err := a.llmService.Stream(jobCtx, spec, func(token string) {
			// Emitir token al frontend via Wails Events
			wailsRuntime.EventsEmit(a.ctx, "chat:token", token)
		})

		if err != nil {
			a.jobManager.CompleteJob(job.ID, err)
			wailsRuntime.EventsEmit(a.ctx, "chat:error", err.Error())
		} else {
			a.jobManager.CompleteJob(job.ID, nil)
		}

		wailsRuntime.EventsEmit(a.ctx, "chat:complete", job.ID)
	}()

	return job.ID, nil
}

// StopStream detiene el streaming actual
func (a *App) StopStream(jobId string) error {
	return a.CancelJob(jobId)
}
