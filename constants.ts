import { AIConfig, ProviderConfig, ProviderType } from './types';

// SOTA Models 2025 - Actualizado basado en documentación oficial
export const PROVIDERS: ProviderConfig[] = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'API directa de Google AI Studio',
        requiresApiKey: true,
        icon: '✨',
        models: [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'SOTA: Más reciente y rápido', maxTokens: 1000000 },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Rápido y eficiente', maxTokens: 1000000 },
            { id: 'gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', description: 'Con razonamiento extendido', maxTokens: 1000000, canThink: true },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Mejor razonamiento', maxTokens: 2000000, canThink: true },
        ]
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude Opus 4.5, Sonnet 4, Haiku',
        requiresApiKey: true,
        icon: '🤖',
        models: [
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'SOTA: Flagship más capaz', maxTokens: 200000, canThink: true },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Balance velocidad/inteligencia', maxTokens: 200000 },
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Excelente para código', maxTokens: 200000 },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Ultra rápido y económico', maxTokens: 200000 },
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o, o1, o3-mini',
        requiresApiKey: true,
        icon: '🧠',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal flagship', maxTokens: 128000 },
            { id: 'o3-mini', name: 'o3-mini', description: 'SOTA: Razonamiento avanzado económico', maxTokens: 128000, canThink: true },
            { id: 'o1', name: 'o1', description: 'Razonamiento profundo', maxTokens: 128000, canThink: true },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Rápido y capaz', maxTokens: 128000 },
        ]
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Acceso a múltiples modelos',
        requiresApiKey: true,
        baseURL: 'https://openrouter.ai/api/v1',
        icon: '🔀',
        models: [
            { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5 via Router', description: 'Anthropic flagship', maxTokens: 200000 },
            { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 via Router', description: 'Anthropic balance', maxTokens: 200000 },
            { id: 'openai/gpt-4o', name: 'GPT-4o via Router', description: 'OpenAI flagship', maxTokens: 128000 },
            { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash via Router', description: 'Google SOTA', maxTokens: 1000000 },
            { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 via Router', description: 'Open source reasoning', maxTokens: 128000, canThink: true },
        ]
    },
    {
        id: 'local-cli',
        name: 'CLI Local',
        description: 'Claude Code, Gemini CLI, Codex, etc.',
        requiresApiKey: false,
        icon: '💻',
        models: [
            { id: 'claude-code', name: 'Claude Code CLI', description: 'Anthropic CLI oficial - requiere: npm i -g @anthropic-ai/claude-code', maxTokens: 200000 },
            { id: 'gemini-cli', name: 'Gemini CLI', description: 'Google CLI oficial', maxTokens: 1000000 },
            { id: 'codex-cli', name: 'Codex CLI', description: 'OpenAI Codex local', maxTokens: 128000 },
            { id: 'aider', name: 'Aider', description: 'Open source AI pair programmer', maxTokens: 128000 },
            { id: 'cursor', name: 'Cursor', description: 'Cursor AI integration', maxTokens: 128000 },
        ]
    },
];

export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    temperature: 0.7,
    systemInstruction: "Eres un asistente de código experto. Analiza el contexto proporcionado y responde de forma concisa, técnica y precisa.",
    useThinking: false,
    useGrounding: false,
    isConfigured: false,
};

export const getProviderById = (id: ProviderType): ProviderConfig | undefined => {
    return PROVIDERS.find(p => p.id === id);
};

export const getModelsByProvider = (providerId: ProviderType) => {
    const provider = getProviderById(providerId);
    return provider?.models || [];
};

export const IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock',
    '.next',
    '.vercel',
    '__pycache__',
    '.pytest_cache',
    'venv',
    '.env',
    '.env.local',
];
