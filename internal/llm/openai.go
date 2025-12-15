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

// OpenAIProvider implementa Provider para APIs compatibles con OpenAI
type OpenAIProvider struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewOpenAIProvider crea un proveedor OpenAI
func NewOpenAIProvider(apiKey, baseURL string) *OpenAIProvider {
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	return &OpenAIProvider{
		apiKey:  apiKey,
		baseURL: strings.TrimSuffix(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// NewOpenRouterProvider crea un proveedor OpenRouter
func NewOpenRouterProvider(apiKey string) *OpenAIProvider {
	return NewOpenAIProvider(apiKey, "https://openrouter.ai/api/v1")
}

// OpenAI API types
type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature *float64      `json:"temperature,omitempty"`
	MaxTokens   *int          `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	ID      string   `json:"id"`
	Choices []choice `json:"choices"`
	Usage   usage    `json:"usage"`
}

type choice struct {
	Message      chatMessage `json:"message"`
	Delta        chatMessage `json:"delta"`
	FinishReason string      `json:"finish_reason"`
}

type usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type streamChunk struct {
	ID      string   `json:"id"`
	Choices []choice `json:"choices"`
}

// Complete ejecuta un prompt sin streaming
func (p *OpenAIProvider) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	messages := make([]chatMessage, 0, len(spec.Messages))
	for _, m := range spec.Messages {
		messages = append(messages, chatMessage{
			Role:    string(m.Role),
			Content: m.Content,
		})
	}

	reqBody := chatRequest{
		Model:    spec.Model,
		Messages: messages,
		Stream:   false,
	}

	if spec.Temperature > 0 {
		temp := spec.Temperature
		reqBody.Temperature = &temp
	}
	if spec.MaxOutputTokens > 0 {
		maxTokens := spec.MaxOutputTokens
		reqBody.MaxTokens = &maxTokens
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	return &domain.PromptRunResultDTO{
		RunId:    uuid.New().String(),
		Provider: spec.Provider,
		Model:    spec.Model,
		Text:     chatResp.Choices[0].Message.Content,
		Usage: domain.UsageDTO{
			InputTokens:  chatResp.Usage.PromptTokens,
			OutputTokens: chatResp.Usage.CompletionTokens,
			TotalTokens:  chatResp.Usage.TotalTokens,
		},
		CreatedAt: domain.NowISO(),
	}, nil
}

// Stream ejecuta un prompt con streaming
func (p *OpenAIProvider) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	messages := make([]chatMessage, 0, len(spec.Messages))
	for _, m := range spec.Messages {
		messages = append(messages, chatMessage{
			Role:    string(m.Role),
			Content: m.Content,
		})
	}

	reqBody := chatRequest{
		Model:    spec.Model,
		Messages: messages,
		Stream:   true,
	}

	if spec.Temperature > 0 {
		temp := spec.Temperature
		reqBody.Temperature = &temp
	}
	if spec.MaxOutputTokens > 0 {
		maxTokens := spec.MaxOutputTokens
		reqBody.MaxTokens = &maxTokens
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
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
		if data == "[DONE]" {
			break
		}

		var chunk streamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue // Skip malformed chunks
		}

		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			onToken(chunk.Choices[0].Delta.Content)
		}
	}

	return scanner.Err()
}
