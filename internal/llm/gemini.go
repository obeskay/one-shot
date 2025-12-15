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

// GeminiProvider implementa Provider para Google Gemini API
type GeminiProvider struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewGeminiProvider crea un proveedor Gemini
func NewGeminiProvider(apiKey string) *GeminiProvider {
	return &GeminiProvider{
		apiKey:  apiKey,
		baseURL: "https://generativelanguage.googleapis.com/v1beta",
		httpClient: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// Gemini API types
type geminiRequest struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig *geminiGenerationConfig `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Role  string        `json:"role"`
	Parts []geminiPart  `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	Temperature     float64 `json:"temperature,omitempty"`
	MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
}

type geminiResponse struct {
	Candidates    []geminiCandidate `json:"candidates"`
	UsageMetadata *geminiUsage      `json:"usageMetadata,omitempty"`
}

type geminiCandidate struct {
	Content      geminiContent `json:"content"`
	FinishReason string        `json:"finishReason"`
}

type geminiUsage struct {
	PromptTokenCount     int `json:"promptTokenCount"`
	CandidatesTokenCount int `json:"candidatesTokenCount"`
	TotalTokenCount      int `json:"totalTokenCount"`
}

type geminiStreamResponse struct {
	Candidates []geminiCandidate `json:"candidates"`
}

// roleMapping convierte roles de OpenAI a Gemini
func geminiRole(role string) string {
	switch role {
	case "system", "user":
		return "user"
	case "assistant":
		return "model"
	default:
		return "user"
	}
}

// Complete ejecuta un prompt sin streaming
func (p *GeminiProvider) Complete(ctx context.Context, spec domain.PromptRunSpecDTO) (*domain.PromptRunResultDTO, error) {
	contents := make([]geminiContent, 0, len(spec.Messages))

	// Gemini no tiene role "system", lo combinamos con el primer mensaje user
	var systemPrompt string
	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemPrompt = m.Content
			continue
		}

		text := m.Content
		if systemPrompt != "" && m.Role == domain.RoleUser {
			text = systemPrompt + "\n\n" + text
			systemPrompt = ""
		}

		contents = append(contents, geminiContent{
			Role:  geminiRole(string(m.Role)),
			Parts: []geminiPart{{Text: text}},
		})
	}

	reqBody := geminiRequest{
		Contents: contents,
	}

	if spec.Temperature > 0 || spec.MaxOutputTokens > 0 {
		reqBody.GenerationConfig = &geminiGenerationConfig{
			Temperature:     spec.Temperature,
			MaxOutputTokens: spec.MaxOutputTokens,
		}
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", p.baseURL, spec.Model, p.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var geminiResp geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 {
		return nil, fmt.Errorf("no candidates in response")
	}

	text := ""
	if len(geminiResp.Candidates[0].Content.Parts) > 0 {
		text = geminiResp.Candidates[0].Content.Parts[0].Text
	}

	usage := domain.UsageDTO{}
	if geminiResp.UsageMetadata != nil {
		usage.InputTokens = geminiResp.UsageMetadata.PromptTokenCount
		usage.OutputTokens = geminiResp.UsageMetadata.CandidatesTokenCount
		usage.TotalTokens = geminiResp.UsageMetadata.TotalTokenCount
	}

	return &domain.PromptRunResultDTO{
		RunId:     uuid.New().String(),
		Provider:  spec.Provider,
		Model:     spec.Model,
		Text:      text,
		Usage:     usage,
		CreatedAt: domain.NowISO(),
	}, nil
}

// Stream ejecuta un prompt con streaming
func (p *GeminiProvider) Stream(ctx context.Context, spec domain.PromptRunSpecDTO, onToken func(string)) error {
	contents := make([]geminiContent, 0, len(spec.Messages))

	var systemPrompt string
	for _, m := range spec.Messages {
		if m.Role == domain.RoleSystem {
			systemPrompt = m.Content
			continue
		}

		text := m.Content
		if systemPrompt != "" && m.Role == domain.RoleUser {
			text = systemPrompt + "\n\n" + text
			systemPrompt = ""
		}

		contents = append(contents, geminiContent{
			Role:  geminiRole(string(m.Role)),
			Parts: []geminiPart{{Text: text}},
		})
	}

	reqBody := geminiRequest{
		Contents: contents,
	}

	if spec.Temperature > 0 || spec.MaxOutputTokens > 0 {
		reqBody.GenerationConfig = &geminiGenerationConfig{
			Temperature:     spec.Temperature,
			MaxOutputTokens: spec.MaxOutputTokens,
		}
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/models/%s:streamGenerateContent?key=%s&alt=sse", p.baseURL, spec.Model, p.apiKey)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
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
		if data == "" {
			continue
		}

		var chunk geminiStreamResponse
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		if len(chunk.Candidates) > 0 && len(chunk.Candidates[0].Content.Parts) > 0 {
			onToken(chunk.Candidates[0].Content.Parts[0].Text)
		}
	}

	return scanner.Err()
}
