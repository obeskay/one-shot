package llm

import (
	"context"
	"fmt"

	"shotgun/internal/domain"
)

// Provider interfaz para proveedores de LLM
type Provider interface {
	Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error)
	Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error
}

// Service orquesta llamadas a LLM
type Service struct {
	providers map[domain.ProviderID]Provider
}

// NewService crea un nuevo servicio LLM
func NewService() *Service {
	return &Service{
		providers: make(map[domain.ProviderID]Provider),
	}
}

// RegisterProvider registra un proveedor
func (s *Service) RegisterProvider(id domain.ProviderID, provider Provider) {
	s.providers[id] = provider
}

// Complete ejecuta un prompt y retorna el resultado
func (s *Service) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	provider, ok := s.providers[spec.Provider]
	if !ok {
		return nil, fmt.Errorf("provider not registered: %s", spec.Provider)
	}
	return provider.Complete(ctx, spec)
}

// Stream ejecuta un prompt con streaming
func (s *Service) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	provider, ok := s.providers[spec.Provider]
	if !ok {
		return fmt.Errorf("provider not registered: %s", spec.Provider)
	}
	return provider.Stream(ctx, spec, onToken)
}
