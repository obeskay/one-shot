import { AIConfig, ProviderConfig, ProviderType } from './types';

// Dynamic Providers Configuration - No hardcoded model lists
export const PROVIDERS: ProviderConfig[] = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Native Google AI Studio API',
        requiresApiKey: true,
        icon: '✨',
        models: [] // Fetched dynamically
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude 3.5 & 3.7 Series',
        requiresApiKey: true,
        icon: '🤖',
        baseURL: 'https://api.anthropic.com/v1',
        models: [] // Manual entry or backend proxy usually required, keeping empty to enforce manual/fetch
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o & o1 Series',
        requiresApiKey: true,
        icon: '🧠',
        baseURL: 'https://api.openai.com/v1',
        models: [] // Fetched dynamically
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'Open Reasoning SOTA',
        requiresApiKey: true,
        icon: '🐋',
        baseURL: 'https://api.deepseek.com/v1',
        models: [] // Fetched dynamically
    },
    {
        id: 'local',
        name: 'Local (Ollama)',
        description: 'Llama 3.3, DeepSeek, Qwen',
        requiresApiKey: false,
        icon: '💻',
        baseURL: 'http://localhost:11434/v1',
        models: [] // Fetched dynamically
    }
];

export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'gemini',
    model: '', // No default model, must be selected
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
