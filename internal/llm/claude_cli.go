package llm

import (
	"context"
	"fmt"
	"strings"

	claudecode "github.com/yukifoo/claude-code-sdk-go"

	"shotgun/internal/domain"
)

// ClaudeCodeProvider implementa Provider usando Claude Code CLI (SOTA 2025)
// Referencia: github.com/yukifoo/claude-code-sdk-go
type ClaudeCodeProvider struct {
	workDir      string
	systemPrompt string
}

// NewClaudeCodeProvider crea un proveedor Claude Code CLI
func NewClaudeCodeProvider(workDir string) *ClaudeCodeProvider {
	return &ClaudeCodeProvider{
		workDir: workDir,
	}
}

// intPtr helper para crear puntero a int
func intPtr(v int) *int {
	return &v
}

// strPtr helper para crear puntero a string
func strPtr(v string) *string {
	return &v
}

// boolPtr helper para crear puntero a bool
func boolPtr(v bool) *bool {
	return &v
}

// Complete ejecuta un prompt sin streaming usando Claude Code CLI
func (p *ClaudeCodeProvider) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	// Extraer system prompt y construir prompt de usuario
	var systemPrompt string
	var userPrompts []string

	for _, m := range spec.Messages {
		switch m.Role {
		case domain.RoleSystem:
			systemPrompt = m.Content
		case domain.RoleUser:
			userPrompts = append(userPrompts, m.Content)
		case domain.RoleAssistant:
			// Incluir contexto de conversación previa
			userPrompts = append(userPrompts, fmt.Sprintf("[Respuesta anterior]: %s", m.Content))
		}
	}

	fullPrompt := strings.Join(userPrompts, "\n\n")

	// Opciones para Claude Code CLI (SOTA: todas las opciones son punteros)
	options := &claudecode.Options{
		MaxTurns: intPtr(1),
	}

	// System prompt para guiar el comportamiento
	if systemPrompt != "" {
		options.SystemPrompt = strPtr(systemPrompt)
	}

	// Working directory para contexto del proyecto
	if p.workDir != "" {
		options.Cwd = strPtr(p.workDir)
	}

	// Ejecutar query
	messages, err := claudecode.Query(ctx, fullPrompt, options)
	if err != nil {
		return nil, fmt.Errorf("claude code query: %w", err)
	}

	// Extraer texto de respuesta usando la API de interfaces
	responseText := extractTextFromMessages(messages)

	return &domain.PromptRunResultDTO{
		RunId:     domain.NewUUID(),
		Provider:  spec.Provider,
		Model:     spec.Model,
		Text:      responseText,
		CreatedAt: domain.NowISO(),
	}, nil
}

// Stream ejecuta un prompt con streaming usando Claude Code CLI
func (p *ClaudeCodeProvider) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	// Extraer system prompt y construir prompt de usuario
	var systemPrompt string
	var userPrompts []string

	for _, m := range spec.Messages {
		switch m.Role {
		case domain.RoleSystem:
			systemPrompt = m.Content
		case domain.RoleUser:
			userPrompts = append(userPrompts, m.Content)
		case domain.RoleAssistant:
			userPrompts = append(userPrompts, fmt.Sprintf("[Respuesta anterior]: %s", m.Content))
		}
	}

	fullPrompt := strings.Join(userPrompts, "\n\n")

	// Opciones para Claude Code CLI
	options := &claudecode.Options{
		MaxTurns: intPtr(1),
	}

	if systemPrompt != "" {
		options.SystemPrompt = strPtr(systemPrompt)
	}

	if p.workDir != "" {
		options.Cwd = strPtr(p.workDir)
	}

	// Ejecutar query con streaming via channels
	msgChan, errChan := claudecode.QueryStream(ctx, fullPrompt, options)

	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return nil // Canal cerrado, streaming completado
			}
			// Procesar mensaje usando la API de interfaces
			text := extractTextFromMessage(msg)
			if text != "" {
				onToken(text)
			}
		case err := <-errChan:
			if err != nil {
				return fmt.Errorf("claude code stream: %w", err)
			}
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

// extractTextFromMessages extrae texto de una lista de mensajes
func extractTextFromMessages(messages []claudecode.Message) string {
	var parts []string
	for _, msg := range messages {
		text := extractTextFromMessage(msg)
		if text != "" {
			parts = append(parts, text)
		}
	}
	return strings.Join(parts, "")
}

// extractTextFromMessage extrae texto de un mensaje individual
func extractTextFromMessage(msg claudecode.Message) string {
	// Solo procesar mensajes del asistente
	if msg.Type() != claudecode.MessageTypeAssistant {
		return ""
	}

	var parts []string
	for _, block := range msg.Content() {
		if block.Type() == claudecode.ContentBlockTypeText {
			if textBlock, ok := block.(*claudecode.TextBlock); ok {
				parts = append(parts, textBlock.Text)
			}
		}
	}
	return strings.Join(parts, "")
}
