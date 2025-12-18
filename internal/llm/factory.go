package llm

import (
	"context"
	"fmt"
)

// FactoryConfig contiene los parámetros necesarios para crear un proveedor
type FactoryConfig struct {
	Provider string
	APIKey   string
	BaseURL  string
	WorkDir  string // Para local-cli
}

// NewProvider actúa como una fábrica centralizada para instanciar proveedores
func NewProvider(ctx context.Context, cfg FactoryConfig) (Provider, error) {
	switch cfg.Provider {
	case "openai":
		return NewOpenAIProvider(cfg.APIKey, cfg.BaseURL), nil
	
	case "openrouter":
		return NewOpenRouterProvider(cfg.APIKey), nil
	
	case "gemini":
		// Intenta usar SDK oficial, fallback a HTTP si falla o se prefiere
		p, err := NewGeminiSDKProvider(ctx, cfg.APIKey)
		if err != nil {
			return NewGeminiProvider(cfg.APIKey), nil // Fallback silencioso o loggear advertencia fuera
		}
		return p, nil
	
	case "anthropic":
		return NewAnthropicProvider(cfg.APIKey), nil
	
	case "local-cli":
		return NewClaudeCodeProvider(cfg.WorkDir), nil
	
	default:
		return nil, fmt.Errorf("unknown provider: %s", cfg.Provider)
	}
}
