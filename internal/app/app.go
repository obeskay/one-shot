package app

import (
	"context"
	"fmt"
	"log/slog"
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
	logger     *slog.Logger
}

// New crea una nueva instancia de la aplicacion
func New() *App {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	return &App{
		scanner:    fs.NewScanner(),
		jobManager: jobs.NewManager(),
		llmService: llm.NewService(),
		logger:     logger,
	}
}

// Startup se llama cuando la aplicacion inicia
func (a *App) Startup(wailsCtx context.Context) {
	a.ctx = wailsCtx
	a.logger.Info("OneShot iniciado", "platform", goruntime.GOOS)

	// Registrar providers de LLM (API keys vienen del frontend por ahora)
	// En produccion, leer de configuracion
}

// Shutdown se llama cuando la aplicacion se cierra
func (a *App) Shutdown(ctx context.Context) {
	a.logger.Info("OneShot cerrando")
	// Cleanup
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - Project Management
// ---------------------------------------------------------------------------

// SelectProject abre un dialogo para seleccionar un directorio
func (a *App) SelectProject() (string, error) {
	a.logger.Info("Abriendo dialogo de seleccion de proyecto")

	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Seleccionar proyecto",
	})
	if err != nil {
		a.logger.Error("Error abriendo dialogo", "error", err)
		return "", fmt.Errorf("error opening directory dialog: %w", err)
	}

	// Inicializar context builder con el nuevo path
	if path != "" {
		a.ctxBuilder = ctx.NewBuilder(path)
		a.logger.Info("Proyecto seleccionado", "path", path)
	}

	return path, nil
}

// ScanProject escanea un proyecto y retorna el arbol de archivos
func (a *App) ScanProject(path string) (*domain.TreeSnapshotDTO, error) {
	a.logger.Info("Iniciando escaneo de proyecto", "path", path)

	info, err := os.Stat(path)
	if err != nil {
		a.logger.Error("Path no existe", "path", path, "error", err)
		return nil, fmt.Errorf("path does not exist: %w", err)
	}
	if !info.IsDir() {
		a.logger.Error("Path no es directorio", "path", path)
		return nil, fmt.Errorf("path is not a directory")
	}

	// Inicializar context builder
	a.ctxBuilder = ctx.NewBuilder(path)

	opts := fs.DefaultScanOptions()
	snapshot, err := a.scanner.Scan(path, opts)
	if err != nil {
		a.logger.Error("Scan fallido", "path", path, "error", err)
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	dto := snapshot.ToDTO()
	a.logger.Info("Escaneo completado", "files", dto.Stats.Files, "dirs", dto.Stats.Dirs, "totalBytes", dto.Stats.TotalBytes)
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
	a.logger.Info("Cancelando job", "jobId", jobId)

	if !a.jobManager.CancelJob(jobId) {
		a.logger.Warn("Job no encontrado o ya completado", "jobId", jobId)
		return fmt.Errorf("job not found or already completed: %s", jobId)
	}

	a.logger.Info("Job cancelado exitosamente", "jobId", jobId)
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
	a.logger.Info("Configurando LLM provider", "provider", provider)

	var p llm.Provider
	var err error

	switch provider {
	case "openai":
		p = llm.NewOpenAIProvider(apiKey, baseURL)
	case "openrouter":
		p = llm.NewOpenRouterProvider(apiKey)
	case "gemini":
		// Usar SDK oficial de Google si hay API key o env var
		p, err = llm.NewGeminiSDKProvider(a.ctx, apiKey)
		if err != nil {
			// Fallback a implementación HTTP básica
			a.logger.Warn("Fallback a Gemini HTTP provider", "error", err)
			p = llm.NewGeminiProvider(apiKey)
		}
	case "anthropic":
		p = llm.NewAnthropicProvider(apiKey)
	case "local-cli":
		// Claude Code CLI - no requiere API key, usa CLI instalado
		workDir := ""
		if a.ctxBuilder != nil {
			workDir = a.ctxBuilder.ProjectPath()
		}
		p = llm.NewClaudeCodeProvider(workDir)
		a.logger.Info("Claude Code CLI configurado", "workDir", workDir)
	default:
		a.logger.Error("Provider desconocido", "provider", provider)
		return fmt.Errorf("unknown provider: %s", provider)
	}

	a.llmService.RegisterProvider(domain.ProviderID(provider), p)
	a.logger.Info("LLM provider configurado exitosamente", "provider", provider)
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
	a.logger.Info("Iniciando streaming de prompt", "jobId", job.ID, "provider", spec.Provider, "model", spec.Model)

	go func() {
		a.jobManager.UpdateJob(job.ID, domain.JobStateRunning, "streaming", 0, 0, "")

		tokenCount := 0
		err := a.llmService.Stream(jobCtx, spec, func(token string) {
			// Emitir token al frontend via Wails Events
			wailsRuntime.EventsEmit(a.ctx, "chat:token", token)
			tokenCount++
		})

		if err != nil {
			a.logger.Error("Error en streaming", "jobId", job.ID, "error", err)
			a.jobManager.CompleteJob(job.ID, err)
			wailsRuntime.EventsEmit(a.ctx, "chat:error", err.Error())
		} else {
			a.logger.Info("Streaming completado", "jobId", job.ID, "tokensEmitted", tokenCount)
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
