import { PayloadOptions } from './types';

export const DEFAULT_PAYLOAD_OPTIONS: PayloadOptions = {
    includeTree: true,
    includeGraph: true,
    includeContents: true,
    maxFileBytes: 256 * 1024,
    instruction: '',
};

// Destinos comunes donde se pega el contexto
export const PASTE_TARGETS = [
    { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com' },
    { id: 'claude', label: 'Claude', url: 'https://claude.ai/new' },
    { id: 'kimi', label: 'Kimi', url: 'https://www.kimi.com' },
];

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
