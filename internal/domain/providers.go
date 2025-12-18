package domain

type ProviderID string

const (
	ProviderOpenAI    ProviderID = "openai"
	ProviderAnthropic ProviderID = "anthropic"
	ProviderGemini    ProviderID = "gemini"
	ProviderOllama    ProviderID = "ollama"
	ProviderLocal     ProviderID = "local-cli"
)

type ModelCapabilitiesDTO struct {
	CanStream    bool `json:"canStream"`
	CanThink     bool `json:"canThink"`
	CanSearch    bool `json:"canSearch"`
	CanVision    bool `json:"canVision"`
	SupportsJson bool `json:"supportsJson"`
}

type ModelDTO struct {
	ID           string               `json:"id"`
	Name         string               `json:"name"`
	ProviderID   ProviderID           `json:"providerId"`
	Capabilities ModelCapabilitiesDTO `json:"capabilities"`
	ContextSize  int                  `json:"contextSize"`
}

type ProviderDTO struct {
	ID      ProviderID `json:"id"`
	Name    string     `json:"name"`
	Models  []ModelDTO `json:"models"`
	Icon    string     `json:"icon"`
	BaseURL string     `json:"baseUrl,omitempty"`
}

func GetProviderRegistry() []ProviderDTO {
	return []ProviderDTO{
		{
			ID:   ProviderOpenAI,
			Name: "OpenAI",
			Models: []ModelDTO{
				{ID: "gpt-4o", Name: "GPT-4o", ProviderID: ProviderOpenAI, ContextSize: 128000, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true, SupportsJson: true}},
				{ID: "gpt-4-turbo", Name: "GPT-4 Turbo", ProviderID: ProviderOpenAI, ContextSize: 128000, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true, SupportsJson: true}},
				{ID: "gpt-3.5-turbo", Name: "GPT-3.5 Turbo", ProviderID: ProviderOpenAI, ContextSize: 16000, Capabilities: ModelCapabilitiesDTO{CanStream: true}},
			},
		},
		{
			ID:   ProviderAnthropic,
			Name: "Anthropic",
			Models: []ModelDTO{
				{ID: "claude-3-5-sonnet-20240620", Name: "Claude 3.5 Sonnet", ProviderID: ProviderAnthropic, ContextSize: 200000, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true, CanThink: true}},
				{ID: "claude-3-opus-20240229", Name: "Claude 3 Opus", ProviderID: ProviderAnthropic, ContextSize: 200000, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true}},
			},
		},
		{
			ID:   ProviderGemini,
			Name: "Google Gemini",
			Models: []ModelDTO{
				{ID: "gemini-1.5-pro", Name: "Gemini 1.5 Pro", ProviderID: ProviderGemini, ContextSize: 1048576, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true, CanSearch: true}},
				{ID: "gemini-1.5-flash", Name: "Gemini 1.5 Flash", ProviderID: ProviderGemini, ContextSize: 1048576, Capabilities: ModelCapabilitiesDTO{CanStream: true, CanVision: true}},
			},
		},
		{
			ID:   ProviderLocal,
			Name: "Claude Code (CLI)",
			Models: []ModelDTO{
				{ID: "claude-code", Name: "Claude CLI", ProviderID: ProviderLocal, ContextSize: 100000, Capabilities: ModelCapabilitiesDTO{CanStream: true}},
			},
		},
	}
}
