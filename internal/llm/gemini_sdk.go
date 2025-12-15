package llm

import (
	"context"
	"fmt"
	"os"

	"google.golang.org/genai"

	"shotgun/internal/domain"
)

// GeminiSDKProvider implementa Provider usando el SDK oficial de Google
type GeminiSDKProvider struct {
	client *genai.Client
}

// NewGeminiSDKProvider crea un proveedor Gemini usando SDK oficial
// Si apiKey está vacío, usa la variable de entorno GEMINI_API_KEY
func NewGeminiSDKProvider(ctx context.Context, apiKey string) (*GeminiSDKProvider, error) {
	if apiKey == "" {
		apiKey = os.Getenv("GEMINI_API_KEY")
	}

	var client *genai.Client
	var err error

	if apiKey != "" {
		client, err = genai.NewClient(ctx, &genai.ClientConfig{
			APIKey: apiKey,
		})
	} else {
		// Sin API key, intenta autenticación por defecto (Google Cloud)
		client, err = genai.NewClient(ctx, nil)
	}

	if err != nil {
		return nil, fmt.Errorf("crear cliente gemini: %w", err)
	}

	return &GeminiSDKProvider{
		client: client,
	}, nil
}

// Complete ejecuta un prompt sin streaming
func (p *GeminiSDKProvider) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	// Construir contenido de mensajes
	var contents []*genai.Content
	var systemInstruction string

	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemInstruction = m.Content
		} else {
			role := "user"
			if m.Role == domain.RoleAssistant {
				role = "model"
			}
			contents = append(contents, genai.NewContentFromText(m.Content, genai.Role(role)))
		}
	}

	// Configurar modelo (SOTA: gemini-2.5-flash es el más reciente)
	model := spec.Model
	if model == "" {
		model = "gemini-2.5-flash"
	}

	// Crear config de generación
	config := &genai.GenerateContentConfig{}
	if spec.Temperature > 0 {
		config.Temperature = genai.Ptr(float32(spec.Temperature))
	}
	if spec.MaxOutputTokens > 0 {
		config.MaxOutputTokens = int32(spec.MaxOutputTokens)
	}
	if systemInstruction != "" {
		config.SystemInstruction = genai.NewContentFromText(systemInstruction, genai.RoleUser)
	}

	// Ejecutar generación
	result, err := p.client.Models.GenerateContent(ctx, model, contents, config)
	if err != nil {
		return nil, fmt.Errorf("generar contenido: %w", err)
	}

	// Extraer texto
	text := ""
	if result != nil && len(result.Candidates) > 0 {
		candidate := result.Candidates[0]
		if candidate.Content != nil {
			for _, part := range candidate.Content.Parts {
				if part.Text != "" {
					text += part.Text
				}
			}
		}
	}

	// Extraer uso de tokens
	usage := domain.UsageDTO{}
	if result != nil && result.UsageMetadata != nil {
		usage.InputTokens = int(result.UsageMetadata.PromptTokenCount)
		usage.OutputTokens = int(result.UsageMetadata.CandidatesTokenCount)
		usage.TotalTokens = int(result.UsageMetadata.TotalTokenCount)
	}

	return &domain.PromptRunResultDTO{
		RunId:     domain.NewUUID(),
		Provider:  spec.Provider,
		Model:     model,
		Text:      text,
		Usage:     usage,
		CreatedAt: domain.NowISO(),
	}, nil
}

// Stream ejecuta un prompt con streaming
func (p *GeminiSDKProvider) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	// Construir contenido de mensajes
	var contents []*genai.Content
	var systemInstruction string

	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemInstruction = m.Content
		} else {
			role := "user"
			if m.Role == domain.RoleAssistant {
				role = "model"
			}
			contents = append(contents, genai.NewContentFromText(m.Content, genai.Role(role)))
		}
	}

	// Configurar modelo (SOTA: gemini-2.5-flash es el más reciente)
	model := spec.Model
	if model == "" {
		model = "gemini-2.5-flash"
	}

	// Crear config de generación
	config := &genai.GenerateContentConfig{}
	if spec.Temperature > 0 {
		config.Temperature = genai.Ptr(float32(spec.Temperature))
	}
	if spec.MaxOutputTokens > 0 {
		config.MaxOutputTokens = int32(spec.MaxOutputTokens)
	}
	if systemInstruction != "" {
		config.SystemInstruction = genai.NewContentFromText(systemInstruction, genai.RoleUser)
	}

	// Ejecutar streaming (Go 1.23+ iterator pattern)
	for chunk, err := range p.client.Models.GenerateContentStream(ctx, model, contents, config) {
		if err != nil {
			return fmt.Errorf("recibir chunk: %w", err)
		}

		// Extraer texto del chunk
		if chunk != nil && len(chunk.Candidates) > 0 {
			candidate := chunk.Candidates[0]
			if candidate.Content != nil {
				for _, part := range candidate.Content.Parts {
					if part.Text != "" {
						onToken(part.Text)
					}
				}
			}
		}
	}
	return nil
}
