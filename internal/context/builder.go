package context

import (
	"fmt"
	"time"

	"shotgun/internal/domain"
	"shotgun/internal/fs"
)

// Builder construye payloads de contexto
type Builder struct {
	rootPath string
}

// NewBuilder crea un nuevo builder
func NewBuilder(rootPath string) *Builder {
	return &Builder{
		rootPath: rootPath,
	}
}

// ProjectPath retorna el path raíz del proyecto
func (b *Builder) ProjectPath() string {
	return b.rootPath
}

// Build construye el payload de contexto desde una seleccion
func (b *Builder) Build(selection domain.SelectionDTO, opts domain.ContextBuildOptionsDTO) (*domain.ContextPayloadDTO, error) {
	if len(selection.SelectedIds) == 0 {
		return nil, fmt.Errorf("no files selected")
	}

	payload := &domain.ContextPayload{
		Files:      make([]*domain.ContextFile, 0, len(selection.SelectedIds)),
		TotalBytes: 0,
		Warnings:   make([]string, 0),
		CreatedAt:  time.Now().UTC(),
	}

	for _, relPath := range selection.SelectedIds {
		// Leer contenido del archivo
		content, truncated, err := fs.ReadFileContent(b.rootPath, relPath, opts.MaxFileBytes)
		if err != nil {
			payload.Warnings = append(payload.Warnings, fmt.Sprintf("could not read %s: %v", relPath, err))
			continue
		}

		file := &domain.ContextFile{
			RelPath:   relPath,
			SizeBytes: int64(len(content)),
			Content:   content,
			Truncated: truncated,
		}

		// Verificar si excede el presupuesto total
		if opts.MaxBytes > 0 && payload.TotalBytes+file.SizeBytes > opts.MaxBytes {
			payload.Warnings = append(payload.Warnings, fmt.Sprintf("budget exceeded, skipping %s", relPath))
			continue
		}

		payload.Files = append(payload.Files, file)
		payload.TotalBytes += file.SizeBytes
	}

	dto := payload.ToDTO(opts)
	return &dto, nil
}

// FormatPayload formatea el payload segun el formato especificado
func (b *Builder) FormatPayload(payload *domain.ContextPayloadDTO) string {
	if payload.Options.Format == "markdown" {
		return formatMarkdown(payload)
	}
	return formatXMLish(payload)
}

func formatMarkdown(payload *domain.ContextPayloadDTO) string {
	var result string
	for _, file := range payload.Files {
		result += fmt.Sprintf("## %s\n\n```\n%s\n```\n\n", file.RelPath, file.Content)
	}
	return result
}

func formatXMLish(payload *domain.ContextPayloadDTO) string {
	var result string
	for _, file := range payload.Files {
		result += fmt.Sprintf("<file path=\"%s\">\n%s\n</file>\n\n", file.RelPath, file.Content)
	}
	return result
}
