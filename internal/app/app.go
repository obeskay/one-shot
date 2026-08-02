package app

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	goruntime "runtime"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"shotgun/internal/domain"
	"shotgun/internal/fs"
	"shotgun/internal/payload"
)

// App estructura principal de la aplicacion Wails
type App struct {
	ctx        context.Context
	scanner    *fs.Scanner
	builder    *payload.Builder
	graphCache *projectGraph
	logger     *slog.Logger
}

// New crea una nueva instancia de la aplicacion
func New() *App {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	return &App{
		scanner:    fs.NewScanner(),
		graphCache: &projectGraph{},
		logger:     logger,
	}
}

// Startup se llama cuando la aplicacion inicia
func (a *App) Startup(wailsCtx context.Context) {
	a.ctx = wailsCtx
	a.logger.Info("OneShot iniciado", "platform", goruntime.GOOS)
}

// Shutdown se llama cuando la aplicacion se cierra
func (a *App) Shutdown(ctx context.Context) {
	a.logger.Info("OneShot cerrando")
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

	if path != "" {
		a.builder = payload.NewBuilder(path)
		a.graphCache.invalidate()
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

	a.builder = payload.NewBuilder(path)
	a.graphCache.invalidate()

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

	a.builder = payload.NewBuilder(path)
	a.graphCache.invalidate()

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

// GetPlatform retorna informacion de la plataforma
func (a *App) GetPlatform() string {
	return goruntime.GOOS
}

// ---------------------------------------------------------------------------
// Wails Bound Methods - Payload (el corazon de la app)
// ---------------------------------------------------------------------------

// BuildPayload arma el bloque de texto listo para pegar en un chatbot
func (a *App) BuildPayload(projectPath string, relPaths []string, opts payload.Options) (*payload.Result, error) {
	if a.builder == nil || a.builder.ProjectPath() != projectPath {
		a.builder = payload.NewBuilder(projectPath)
	}

	result, err := a.builder.Build(relPaths, opts)
	if err != nil {
		a.logger.Error("Build de payload fallido", "error", err)
		return nil, err
	}

	a.logger.Info("Payload construido",
		"files", result.Stats.Files,
		"bytes", result.Stats.Bytes,
		"tokens", result.Stats.Tokens,
		"skipped", result.Stats.Skipped)
	return result, nil
}

// CopyToClipboard escribe texto en el portapapeles del sistema.
// Se hace en Go y no en el webview: navigator.clipboard falla con payloads
// grandes y sin gesto de usuario directo.
func (a *App) CopyToClipboard(text string) error {
	if err := wailsRuntime.ClipboardSetText(a.ctx, text); err != nil {
		a.logger.Error("Error copiando al portapapeles", "error", err)
		return fmt.Errorf("no se pudo copiar al portapapeles: %w", err)
	}
	a.logger.Info("Copiado al portapapeles", "bytes", len(text))
	return nil
}

// SavePayload guarda el payload en un archivo elegido por el usuario
func (a *App) SavePayload(text string, suggestedName string) (string, error) {
	if suggestedName == "" {
		suggestedName = "context.md"
	}

	target, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Guardar contexto",
		DefaultFilename: suggestedName,
	})
	if err != nil {
		return "", fmt.Errorf("error abriendo dialogo: %w", err)
	}
	if target == "" {
		return "", nil
	}

	if err := os.WriteFile(target, []byte(text), 0o644); err != nil {
		return "", fmt.Errorf("error guardando archivo: %w", err)
	}

	a.logger.Info("Payload guardado", "path", target)
	return target, nil
}
