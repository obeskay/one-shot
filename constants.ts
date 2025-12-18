import { AIConfig, ProviderConfig, ProviderType } from './types';

// Deprecated: Providers are now fetched dynamically from backend
// export const PROVIDERS: ProviderConfig[] = [];

// export const getProviderById = ...
// export const getModelsByProvider = ...

export const DEFAULT_AI_CONFIG: import('./types').AIConfig = {
    provider: 'gemini',
    model: '', // No default model, must be selected
    apiKey: '',
    temperature: 0.7,
    systemInstruction: "You are an expert software engineer. Analyze the context provided and generate optimized code or explanations.",
    useThinking: false,
    useGrounding: false,
    isConfigured: false,
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
