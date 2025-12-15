export type ContextStrategy = 'precise' | 'conceptual';

export type ProviderType = 'gemini' | 'anthropic' | 'openai' | 'openrouter' | 'local-cli';

export interface ProviderConfig {
    id: ProviderType;
    name: string;
    description: string;
    requiresApiKey: boolean;
    baseURL?: string;
    models: ModelConfig[];
    icon: string;
}

export interface ModelConfig {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    canThink?: boolean;
    canSearch?: boolean;
}

export interface AIConfig {
    provider: ProviderType;
    model: string;
    apiKey: string;
    baseURL?: string;
    temperature: number;
    systemInstruction: string;
    useThinking: boolean;
    useGrounding: boolean;
    isConfigured: boolean;
}

export interface PromptRunResult {
    id: string;
    content: string;
    duration: number;
}

export interface FileNode {
  id: string; 
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modTime: string;
  children?: FileNode[];
}

export interface TreeSnapshot {
  root: FileNode;
  fileCount: number;
  totalSize: number;
  scannedAt: string;
}

export interface FileSummary {
    fileId: string;
    originalSize: number;
    summarySize: number;
    content: string; 
    isReady: boolean;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isError?: boolean;
}

// UI State
export interface AppState {
  projectPath: string | null;
  tree: TreeSnapshot | null;
  isLoading: boolean;

  // Core Logic
  strategy: ContextStrategy;
  aiConfig: AIConfig;

  // Selection
  selectedFileIds: Set<string>;
  expandedFolderIds: Set<string>;

  // Intelligent Cache
  summaries: Record<string, FileSummary>;
  processingFiles: Set<string>;

  searchQuery: string;

  // View State
  activeTab: string;

  // Conversation (unificado)
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  isChatGenerating: boolean;

  // Intent-First UX
  intent: string;
  budgetTokens: number;

  // Job tracking
  currentJobId: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}