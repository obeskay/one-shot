import { AIConfig, ProviderConfig, ProviderType } from './types';

// SOTA Models 2025
export const PROVIDERS: ProviderConfig[] = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Native Google AI Studio API',
        requiresApiKey: true,
        icon: '✨',
        models: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fastest multimodel SOTA', maxTokens: 1048576, canSearch: true },
            { id: 'gemini-2.0-flash-thinking-exp-1219', name: 'Gemini 2.0 Flash (Thinking)', description: 'Reasoning-enhanced', maxTokens: 1048576, canThink: true },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Best for complex reasoning', maxTokens: 2097152, canSearch: true },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'High-volume efficiency', maxTokens: 1048576 },
        ]
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude 3.5 & 3.7 Series',
        requiresApiKey: true,
        icon: '🤖',
        baseURL: 'https://api.anthropic.com/v1',
        models: [
            { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: 'SOTA Intelligence & Speed', maxTokens: 200000, canThink: true },
            { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', description: 'Coding & reasoning standard', maxTokens: 200000 },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast & cost-effective', maxTokens: 200000 },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Deep reasoning legacy', maxTokens: 200000 },
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o & o1 Series',
        requiresApiKey: true,
        icon: '🧠',
        baseURL: 'https://api.openai.com/v1',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Omni-model flagship', maxTokens: 128000 },
            { id: 'o1', name: 'o1', description: 'Deep reasoning (SOTA)', maxTokens: 128000, canThink: true },
            { id: 'o1-mini', name: 'o1-mini', description: 'Fast reasoning', maxTokens: 128000, canThink: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o-mini', description: 'Efficient & cheap', maxTokens: 128000 },
        ]
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'Open Reasoning SOTA',
        requiresApiKey: true,
        icon: '🐋',
        baseURL: 'https://api.deepseek.com/v1',
        models: [
            { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'SOTA Open Reasoning', maxTokens: 64000, canThink: true },
            { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'General purpose chat', maxTokens: 64000 },
        ]
    },
    {
        id: 'local',
        name: 'Local (Ollama)',
        description: 'Llama 3.3,DeepSeek, Qwen',
        requiresApiKey: false,
        icon: '💻',
        baseURL: 'http://localhost:11434/v1',
        models: [
            { id: 'llama3.3', name: 'Llama 3.3', description: 'Meta SOTA Open Weights', maxTokens: 128000 },
            { id: 'deepseek-r1:latest', name: 'DeepSeek R1 (Ollama)', description: 'Local Reasoning', maxTokens: 32000, canThink: true },
            { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', description: 'Best local coding model', maxTokens: 32000 },
            { id: 'mistral-large', name: 'Mistral Large', description: 'Mistral flagship', maxTokens: 32000 },
        ]
    }
];

export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    apiKey: '',
    temperature: 0.7,
    systemInstruction: "You are an expert software engineer. Analyze the context provided and generate optimized code or explanations.",
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
    '.wails',
    'go.sum',
];
