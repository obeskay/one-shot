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
import { isString, logInvalidEvent } from './event-validators';

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
          GetJobStatus(jobId: string): Promise<import('../types/domain').JobProgressDTO>;
          BuildContext(selection: SelectionDTO, options: ContextBuildOptionsDTO, projectPath: string): Promise<ContextPayloadDTO>;
          ConfigureLLM(provider: string, apiKey: string, baseURL: string): Promise<void>;
          RunPrompt(spec: PromptRunSpecDTO): Promise<PromptRunResultDTO>;
          StreamPrompt(spec: PromptRunSpecDTO): Promise<string>; // Retorna jobId
          StopStream(jobId: string): Promise<void>;
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
    onToken: (token: string) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ): { stop: () => void } {
    console.warn('[Bridge] Modo mock: StreamChat');
    let active = true;
    setTimeout(() => {
      if (active) {
        onToken('Mock response: Backend no disponible.');
        if (onComplete) onComplete();
      }
    }, 100);
    return { stop: () => { active = false; } };
  },

  async ConfigureLLM(provider: string, apiKey: string, baseURL: string = ''): Promise<void> {
    console.warn('[Bridge] Modo mock: ConfigureLLM', { provider, hasKey: !!apiKey, baseURL });
    // Simular delay de configuración
    await new Promise(resolve => setTimeout(resolve, 500));
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
    onToken: (token: string) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ): { stop: () => void } {
    let tokenCleanup: (() => void) | null = null;
    let completeCleanup: (() => void) | null = null;
    let errorCleanup: (() => void) | null = null;
    let currentJobId: string | null = null;

    console.log('[Bridge] StreamChat iniciando con config:', config.provider, config.model);

    // Listener: chat:token
    tokenCleanup = window.runtime.EventsOn('chat:token', (token: unknown) => {
      if (!isString(token)) {
        logInvalidEvent('chat:token', token);
        return;
      }
      console.log('[Bridge] Token recibido:', token.substring(0, 50));
      onToken(token);
    });

    // Listener: chat:complete
    completeCleanup = window.runtime.EventsOn('chat:complete', (jobId: unknown) => {
      console.log('[Bridge] Streaming completado, jobId:', jobId);
      if (onComplete) onComplete();
      // Cleanup automatico
      if (tokenCleanup) tokenCleanup();
      if (completeCleanup) completeCleanup();
      if (errorCleanup) errorCleanup();
    });

    // Listener: chat:error
    errorCleanup = window.runtime.EventsOn('chat:error', (errorMsg: unknown) => {
      if (!isString(errorMsg)) {
        logInvalidEvent('chat:error', errorMsg);
        if (onError) onError('Error desconocido');
        return;
      }
      console.error('[Bridge] Error en streaming:', errorMsg);
      if (onError) onError(errorMsg);
      // Cleanup automatico
      if (tokenCleanup) tokenCleanup();
      if (completeCleanup) completeCleanup();
      if (errorCleanup) errorCleanup();
    });

    // Construir spec con contexto de archivos seleccionados
    const spec: PromptRunSpecDTO = {
      provider: config.provider as 'openai' | 'gemini' | 'openrouter',
      model: config.model,
      temperature: config.temperature,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };

    // Llamar a StreamPrompt real del backend
    window.go.app.App.StreamPrompt(spec)
      .then(jobId => {
        currentJobId = jobId;
        console.log('[Bridge] Streaming iniciado, jobId:', jobId);
      })
      .catch(err => {
        console.error('[Bridge] Error iniciando streaming:', err);
        if (onError) onError(err.message || 'Error al iniciar streaming');
        // Cleanup en caso de fallo al iniciar
        if (tokenCleanup) tokenCleanup();
        if (completeCleanup) completeCleanup();
        if (errorCleanup) errorCleanup();
      });

    return {
      stop: () => {
        console.log('[Bridge] Deteniendo streaming, jobId:', currentJobId);
        if (currentJobId) {
          window.go.app.App.StopStream(currentJobId).catch(err => {
            console.error('[Bridge] Error deteniendo stream:', err);
          });
        }
        // Cleanup manual de listeners
        if (tokenCleanup) tokenCleanup();
        if (completeCleanup) completeCleanup();
        if (errorCleanup) errorCleanup();
      },
    };
  },

  async CancelJob(jobId: string): Promise<void> {
    console.log('[Bridge] Cancelando job:', jobId);
    try {
      await window.go.app.App.CancelJob(jobId);
      console.log('[Bridge] Job cancelado exitosamente');
    } catch (err) {
      console.error('[Bridge] Error cancelando job:', err);
      throw err;
    }
  },

  async GetJobStatus(jobId: string): Promise<import('../types/domain').JobProgressDTO> {
    console.log('[Bridge] Obteniendo estado de job:', jobId);
    try {
      const status = await window.go.app.App.GetJobStatus(jobId);
      console.log('[Bridge] Estado del job:', status.state, status.stage);
      return status;
    } catch (err) {
      console.error('[Bridge] Error obteniendo estado de job:', err);
      throw err;
    }
  },

  async ConfigureLLM(provider: string, apiKey: string, baseURL: string = ''): Promise<void> {
    console.log('[Bridge] Configurando LLM provider:', provider);
    try {
      await window.go.app.App.ConfigureLLM(provider, apiKey, baseURL);
      console.log('[Bridge] LLM configurado exitosamente');
    } catch (err) {
      console.error('[Bridge] Error configurando LLM:', err);
      throw err;
    }
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
  GetJobStatus: WailsBridge.GetJobStatus,
  ConfigureLLM: WailsBridge.ConfigureLLM,
  GetPlatform: WailsBridge.GetPlatform,
  getCurrentProjectPath: WailsBridge.getCurrentProjectPath,
  setCurrentProjectPath: WailsBridge.setCurrentProjectPath,
} : null;

// Helpers para manejo robusto de eventos
export function createEventListener<T = unknown>(
  eventName: string,
  handler: (data: T) => void,
  validator?: (data: unknown) => data is T
): () => void {
  if (!isWailsEnvironment()) {
    console.warn(`[Bridge] EventListener "${eventName}" en modo mock`);
    return () => {};
  }

  const cleanup = window.runtime.EventsOn(eventName, (data: unknown) => {
    if (validator && !validator(data)) {
      console.error(`[Bridge] Evento "${eventName}" con datos invalidos:`, data);
      return;
    }
    handler(data as T);
  });

  console.log(`[Bridge] Listener registrado para evento: ${eventName}`);
  return cleanup;
}
