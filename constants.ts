
import { AIConfig } from './types';

export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'gemini',
    model: 'gemini-3-pro-preview', 
    temperature: 0.7,
    systemInstruction: "You are Shotgun, an elite coding assistant. You analyze the provided file context deeply before answering. Be concise, technical, and accurate.",
    useThinking: false,
    useGrounding: false,
};

export const MODELS = [
    { 
        id: 'gemini-3-pro-preview', 
        name: 'Gemini 3.0 Pro', 
        description: 'Best for complex reasoning & coding', 
        canThink: true 
    },
    { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash', 
        description: 'Balanced speed & intelligence. Supports Search.',
        canSearch: true
    },
    { 
        id: 'gemini-2.5-flash-lite', 
        name: 'Gemini 2.5 Flash-Lite', 
        description: 'Ultra-fast, low latency responses', 
        speed: 'lightning' 
    },
];

export const IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock'
];
