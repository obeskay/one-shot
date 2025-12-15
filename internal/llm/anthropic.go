package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"shotgun/internal/domain"
)

// AnthropicProvider implementa Provider para Anthropic Claude API
type AnthropicProvider struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewAnthropicProvider crea un proveedor Anthropic
func NewAnthropicProvider(apiKey string) *AnthropicProvider {
	return &AnthropicProvider{
		apiKey:  apiKey,
		baseURL: "https://api.anthropic.com/v1",
		httpClient: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// Anthropic API types
type anthropicRequest struct {
	Model       string             `json:"model"`
	MaxTokens   int                `json:"max_tokens"`
	System      string             `json:"system,omitempty"`
	Messages    []anthropicMessage `json:"messages"`
	Temperature float64            `json:"temperature,omitempty"`
	Stream      bool               `json:"stream"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	ID           string              `json:"id"`
	Type         string              `json:"type"`
	Role         string              `json:"role"`
	Content      []anthropicContent  `json:"content"`
	StopReason   string              `json:"stop_reason"`
	Usage        anthropicUsage      `json:"usage"`
}

type anthropicContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type anthropicUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

type anthropicStreamEvent struct {
	Type         string             `json:"type"`
	Index        int                `json:"index,omitempty"`
	ContentBlock *anthropicContent  `json:"content_block,omitempty"`
	Delta        *anthropicDelta    `json:"delta,omitempty"`
	Usage        *anthropicUsage    `json:"usage,omitempty"`
}

type anthropicDelta struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// Complete ejecuta un prompt sin streaming
func (p *AnthropicProvider) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	var systemPrompt string
	messages := make([]anthropicMessage, 0, len(spec.Messages))

	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemPrompt = m.Content
			continue
		}

		role := "user"
		if m.Role == domain.RoleAssistant {
			role = "assistant"
		}

		messages = append(messages, anthropicMessage{
			Role:    role,
			Content: m.Content,
		})
	}

	maxTokens := spec.MaxOutputTokens
	if maxTokens == 0 {
		maxTokens = 4096
	}

	reqBody := anthropicRequest{
		Model:     spec.Model,
		MaxTokens: maxTokens,
		System:    systemPrompt,
		Messages:  messages,
		Stream:    false,
	}

	if spec.Temperature > 0 {
		reqBody.Temperature = spec.Temperature
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/messages", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var anthropicResp anthropicResponse
	if err := json.NewDecoder(resp.Body).Decode(&anthropicResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	text := ""
	if len(anthropicResp.Content) > 0 {
		text = anthropicResp.Content[0].Text
	}

	return &domain.PromptRunResultDTO{
		RunId:    uuid.New().String(),
		Provider: spec.Provider,
		Model:    spec.Model,
		Text:     text,
		Usage: domain.UsageDTO{
			InputTokens:  anthropicResp.Usage.InputTokens,
			OutputTokens: anthropicResp.Usage.OutputTokens,
			TotalTokens:  anthropicResp.Usage.InputTokens + anthropicResp.Usage.OutputTokens,
		},
		CreatedAt: domain.NowISO(),
	}, nil
}

// Stream ejecuta un prompt con streaming
func (p *AnthropicProvider) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	var systemPrompt string
	messages := make([]anthropicMessage, 0, len(spec.Messages))

	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemPrompt = m.Content
			continue
		}

		role := "user"
		if m.Role == domain.RoleAssistant {
			role = "assistant"
		}

		messages = append(messages, anthropicMessage{
			Role:    role,
			Content: m.Content,
		})
	}

	maxTokens := spec.MaxOutputTokens
	if maxTokens == 0 {
		maxTokens = 4096
	}

	reqBody := anthropicRequest{
		Model:     spec.Model,
		MaxTokens: maxTokens,
		System:    systemPrompt,
		Messages:  messages,
		Stream:    true,
	}

	if spec.Temperature > 0 {
		reqBody.Temperature = spec.Temperature
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/messages", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")
		if data == "" || data == "[DONE]" {
			continue
		}

		var event anthropicStreamEvent
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			continue
		}

		if event.Type == "content_block_delta" && event.Delta != nil && event.Delta.Text != "" {
			onToken(event.Delta.Text)
		}
	}

	return scanner.Err()
}
