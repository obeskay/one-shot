package secrets

import (
	"fmt"
	"log/slog"

	"github.com/zalando/go-keyring"
)

const (
	Service = "one-shot-app"
)

// Store handles secure storage of secrets
type Store struct {
	logger *slog.Logger
}

// NewStore creates a new secret store
func NewStore(logger *slog.Logger) *Store {
	return &Store{
		logger: logger,
	}
}

// Set stores a secret securely
func (s *Store) Set(key string, value string) error {
	if value == "" {
		return s.Delete(key)
	}
	
	err := keyring.Set(Service, key, value)
	if err != nil {
		s.logger.Error("Failed to save secret to keyring", "key", key, "error", err)
		return fmt.Errorf("failed to save secret: %w", err)
	}
	return nil
}

// Get retrieves a secret securely
func (s *Store) Get(key string) (string, error) {
	value, err := keyring.Get(Service, key)
	if err != nil {
		if err == keyring.ErrNotFound {
			return "", nil
		}
		s.logger.Error("Failed to get secret from keyring", "key", key, "error", err)
		return "", fmt.Errorf("failed to get secret: %w", err)
	}
	return value, nil
}

// Delete removes a secret securely
func (s *Store) Delete(key string) error {
	err := keyring.Delete(Service, key)
	if err != nil && err != keyring.ErrNotFound {
		s.logger.Error("Failed to delete secret from keyring", "key", key, "error", err)
		return fmt.Errorf("failed to delete secret: %w", err)
	}
	return nil
}
