// Bridge: Conexion real con backend Go via Wails
import type { TreeSnapshot, FileSummary, PromptRunResult, AIConfig, ChatMessage } from '../types';
import type {
  TreeSnapshotDTO,
  SelectionDTO,
  ContextBuildOptionsDTO,
  ContextPayloadDTO,
  PromptRunSpecDTO,
  PromptRunResultDTO,
  treeDTOToLegacy,
} from '../types/domain';

// Declaraciones de tipos para Wails bindings
declare global {
  interface Window {
    go: {
      app: {
        App: {
          SelectProject(): Promise<string>;
          ScanProject(path: string): Promise<TreeSnapshotDTO>;
          ScanProjectWithOptions(path: string, useGitignore: boolean, customIgnore: string): Promise<TreeSnapshotDTO>;
          ReadFile(relPath: string, projectPath: string): Promise<string>;
          ReadFileWithLimit(relPath: string, projectPath: string, maxBytes: number): Promise<[string, boolean]>;
          GetPlatform(): Promise<string>;
          CancelJob(jobId: string): Promise<void>;
          BuildContext(selection: SelectionDTO, options: ContextBuildOptionsDTO, projectPath: string): Promise<ContextPayloadDTO>;
          RunPrompt(spec: PromptRunSpecDTO): Promise<PromptRunResultDTO>;
        };
      };
    };
    runtime: {
      EventsOn(eventName: string, callback: (...args: unknown[]) => void): () => void;
      EventsOff(eventName: string): void;
      EventsEmit(eventName: string, ...args: unknown[]): void;
    };
  }
}

// Estado del proyecto actual (cache local)
let currentProjectPath: string | null = null;

// Conversion de TreeSnapshotDTO a formato legacy
function convertTreeDTO(dto: TreeSnapshotDTO): TreeSnapshot {
  const convertNode = (node: TreeSnapshotDTO['root']): TreeSnapshot['root'] => ({
    id: node.id,
    name: node.name,
    path: node.relPath,
    isDir: node.kind === 'dir',
    size: node.sizeBytes ?? 0,
    modTime: node.modTime ?? new Date().toISOString(),
    children: node.children?.map(convertNode),
  });

  return {
    root: convertNode(dto.root),
    fileCount: dto.stats.files,
    totalSize: dto.stats.totalBytes,
    scannedAt: dto.createdAt,
  };
}

// Detecta si estamos en entorno Wails o desarrollo web
function isWailsEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.go !== 'undefined' &&
         typeof window.go.app !== 'undefined';
}

// Mock para desarrollo web sin backend
const MockBridge = {
  async SelectProject(): Promise<string> {
    console.warn('[Bridge] Modo mock: SelectProject');
    return '/mock/project/path';
  },

  async ScanProject(_path: string): Promise<TreeSnapshot> {
    console.warn('[Bridge] Modo mock: ScanProject');
    return {
      fileCount: 3,
      totalSize: 1024,
      scannedAt: new Date().toISOString(),
      root: {
        id: 'root',
        name: 'mock-project',
        path: '.',
        isDir: true,
        size: 0,
        modTime: new Date().toISOString(),
        children: [
          { id: 'src', name: 'src', path: 'src', isDir: true, size: 0, modTime: new Date().toISOString(), children: [
            { id: 'src/main.ts', name: 'main.ts', path: 'src/main.ts', isDir: false, size: 512, modTime: new Date().toISOString() },
          ]},
          { id: 'package.json', name: 'package.json', path: 'package.json', isDir: false, size: 256, modTime: new Date().toISOString() },
        ],
      },
    };
  },

  async GetFileContent(_fileId: string): Promise<string> {
    console.warn('[Bridge] Modo mock: GetFileContent');
    return '// Mock file content\nconsole.log("Hello");';
  },

  async SummarizeFile(fileId: string, content: string): Promise<FileSummary> {
    console.warn('[Bridge] Modo mock: SummarizeFile');
    return {
      fileId,
      originalSize: content.length,
      summarySize: Math.floor(content.length * 0.3),
      isReady: true,
      content: `// Summary of ${fileId}`,
    };
  },

  async RunPrompt(_params: { provider: string; model: string; system: string; userPrompt: string; contextFiles: string[] }): Promise<PromptRunResult> {
    console.warn('[Bridge] Modo mock: RunPrompt');
    return {
      id: crypto.randomUUID(),
      content: 'Mock response: Backend no disponible.',
      duration: 100,
    };
  },

  StreamChat(
    _config: AIConfig,
    _fileIds: string[],
    _messages: ChatMessage[],
    onToken: (token: string) => void
  ): { stop: () => void } {
    console.warn('[Bridge] Modo mock: StreamChat');
    let active = true;
    setTimeout(() => {
      if (active) onToken('Mock response: Backend no disponible.');
    }, 100);
    return { stop: () => { active = false; } };
  },
};

// Bridge real conectado a Wails
const WailsBridge = {
  async SelectProject(): Promise<string> {
    const path = await window.go.app.App.SelectProject();
    if (path) {
      currentProjectPath = path;
    }
    return path;
  },

  async ScanProject(path: string): Promise<TreeSnapshot> {
    currentProjectPath = path;
    const dto = await window.go.app.App.ScanProject(path);
    return convertTreeDTO(dto);
  },

  async ScanProjectWithOptions(path: string, useGitignore: boolean, customIgnore: string): Promise<TreeSnapshot> {
    currentProjectPath = path;
    const dto = await window.go.app.App.ScanProjectWithOptions(path, useGitignore, customIgnore);
    return convertTreeDTO(dto);
  },

  async GetFileContent(fileId: string): Promise<string> {
    if (!currentProjectPath) {
      throw new Error('No project selected');
    }
    return await window.go.app.App.ReadFile(fileId, currentProjectPath);
  },

  async GetFileContentWithLimit(fileId: string, maxBytes: number): Promise<{ content: string; truncated: boolean }> {
    if (!currentProjectPath) {
      throw new Error('No project selected');
    }
    const [content, truncated] = await window.go.app.App.ReadFileWithLimit(fileId, currentProjectPath, maxBytes);
    return { content, truncated };
  },

  async SummarizeFile(fileId: string, content: string): Promise<FileSummary> {
    // Por ahora, summarize es local (heuristica simple)
    // En Fase 5 esto puede conectarse a un LLM
    const originalSize = content.length;
    const summarySize = Math.floor(originalSize * 0.3);

    return {
      fileId,
      originalSize,
      summarySize,
      isReady: true,
      content: content.slice(0, summarySize) + '\n// ... (truncated)',
    };
  },

  async BuildContext(
    selectedIds: string[],
    options: ContextBuildOptionsDTO
  ): Promise<ContextPayloadDTO> {
    if (!currentProjectPath) {
      throw new Error('No project selected');
    }
    const selection: SelectionDTO = { selectedIds };
    return await window.go.app.App.BuildContext(selection, options, currentProjectPath);
  },

  async RunPrompt(params: { provider: string; model: string; system: string; userPrompt: string; contextFiles: string[] }): Promise<PromptRunResult> {
    // Construir spec para el backend
    const spec: PromptRunSpecDTO = {
      provider: params.provider as 'openai' | 'gemini' | 'openrouter',
      model: params.model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.userPrompt },
      ],
    };

    const result = await window.go.app.App.RunPrompt(spec);

    return {
      id: result.runId,
      content: result.text,
      duration: 0, // TODO: calcular desde timestamps
    };
  },

  StreamChat(
    config: AIConfig,
    fileIds: string[],
    messages: ChatMessage[],
    onToken: (token: string) => void
  ): { stop: () => void } {
    let cleanup: (() => void) | null = null;

    // Escuchar eventos de tokens
    cleanup = window.runtime.EventsOn('chat:token', (token: unknown) => {
      if (typeof token === 'string') {
        onToken(token);
      }
    });

    // Iniciar streaming (fire and forget)
    const spec: PromptRunSpecDTO = {
      provider: config.provider as 'openai' | 'gemini' | 'openrouter',
      model: config.model,
      temperature: config.temperature,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };

    // TODO: En Fase 5, llamar a metodo de streaming del backend
    // Por ahora, simular con RunPrompt
    window.go.app.App.RunPrompt(spec)
      .then(result => {
        // Simular streaming palabra por palabra
        const words = result.text.split(' ');
        let i = 0;
        const interval = setInterval(() => {
          if (i < words.length) {
            onToken(words[i] + ' ');
            i++;
          } else {
            clearInterval(interval);
            window.runtime.EventsEmit('chat:complete', result.runId);
          }
        }, 50);
      })
      .catch(err => {
        onToken(`Error: ${err.message}`);
        window.runtime.EventsEmit('chat:complete', '');
      });

    return {
      stop: () => {
        if (cleanup) cleanup();
        // TODO: Cancelar job en backend
      },
    };
  },

  async CancelJob(jobId: string): Promise<void> {
    await window.go.app.App.CancelJob(jobId);
  },

  async GetPlatform(): Promise<string> {
    return await window.go.app.App.GetPlatform();
  },

  // Getter para path actual
  getCurrentProjectPath(): string | null {
    return currentProjectPath;
  },

  setCurrentProjectPath(path: string): void {
    currentProjectPath = path;
  },
};

// Exportar bridge apropiado segun entorno
export const Bridge = isWailsEnvironment() ? WailsBridge : MockBridge;

// Re-exportar metodos adicionales solo disponibles en Wails
export const WailsExtras = isWailsEnvironment() ? {
  ScanProjectWithOptions: WailsBridge.ScanProjectWithOptions,
  GetFileContentWithLimit: WailsBridge.GetFileContentWithLimit,
  BuildContext: WailsBridge.BuildContext,
  CancelJob: WailsBridge.CancelJob,
  GetPlatform: WailsBridge.GetPlatform,
  getCurrentProjectPath: WailsBridge.getCurrentProjectPath,
  setCurrentProjectPath: WailsBridge.setCurrentProjectPath,
} : null;
