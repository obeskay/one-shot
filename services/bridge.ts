// Bridge: conexion con el backend Go via Wails.
// Sin proveedores de IA: esta app solo escanea, arma el payload y lo copia.
import type { TreeSnapshot, PayloadOptions, PayloadResult } from '../types';
import type { TreeSnapshotDTO } from '../types/domain';

declare global {
  interface Window {
    go: {
      app: {
        App: {
          SelectProject(): Promise<string>;
          ScanProject(path: string): Promise<TreeSnapshotDTO>;
          ScanProjectWithOptions(path: string, useGitignore: boolean, customIgnore: string): Promise<TreeSnapshotDTO>;
          GetPlatform(): Promise<string>;
          BuildPayload(projectPath: string, relPaths: string[], opts: PayloadOptions): Promise<PayloadResult>;
          CopyToClipboard(text: string): Promise<void>;
          SavePayload(text: string, suggestedName: string): Promise<string>;
        };
      };
    };
    runtime?: {
      BrowserOpenURL(url: string): void;
    };
  }
}

let currentProjectPath: string | null = null;

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

// Detecta si corremos dentro de Wails o en un navegador (npm run dev)
function isWailsEnvironment(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.go !== 'undefined' &&
    typeof window.go.app !== 'undefined';
}

// Copia de respaldo para el navegador
async function browserCopy(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('El navegador bloqueo el portapapeles');
}

const MockBridge = {
  async SelectProject(): Promise<string> {
    console.warn('[Bridge] modo mock: SelectProject');
    return '/mock/project';
  },

  async ScanProject(_path: string): Promise<TreeSnapshot> {
    console.warn('[Bridge] modo mock: ScanProject');
    const now = new Date().toISOString();
    return {
      fileCount: 2,
      totalSize: 768,
      scannedAt: now,
      root: {
        id: 'root', name: 'mock-project', path: '.', isDir: true, size: 0, modTime: now,
        children: [
          {
            id: 'src', name: 'src', path: 'src', isDir: true, size: 0, modTime: now, children: [
              { id: 'src/main.ts', name: 'main.ts', path: 'src/main.ts', isDir: false, size: 512, modTime: now },
            ],
          },
          { id: 'package.json', name: 'package.json', path: 'package.json', isDir: false, size: 256, modTime: now },
        ],
      },
    };
  },

  async BuildPayload(_projectPath: string, relPaths: string[], _opts: PayloadOptions): Promise<PayloadResult> {
    console.warn('[Bridge] modo mock: BuildPayload');
    const text = `# Codebase: mock-project\n\n${relPaths.map(p => `### ${p}\n\n\`\`\`\n// mock\n\`\`\`\n`).join('\n')}`;
    return {
      text,
      stats: { files: relPaths.length, skipped: 0, truncated: 0, binary: 0, bytes: text.length, tokens: Math.floor(text.length / 4), externals: 0 },
    };
  },

  async CopyToClipboard(text: string): Promise<void> {
    await browserCopy(text);
  },

  async SavePayload(_text: string, _name: string): Promise<string> {
    console.warn('[Bridge] modo mock: SavePayload');
    return '';
  },

  async GetPlatform(): Promise<string> {
    return 'browser';
  },

  getCurrentProjectPath(): string | null {
    return currentProjectPath;
  },
};

const WailsBridge = {
  async SelectProject(): Promise<string> {
    const path = await window.go.app.App.SelectProject();
    if (path) currentProjectPath = path;
    return path;
  },

  async ScanProject(path: string): Promise<TreeSnapshot> {
    currentProjectPath = path;
    return convertTreeDTO(await window.go.app.App.ScanProject(path));
  },

  async ScanProjectWithOptions(path: string, useGitignore: boolean, customIgnore: string): Promise<TreeSnapshot> {
    currentProjectPath = path;
    return convertTreeDTO(await window.go.app.App.ScanProjectWithOptions(path, useGitignore, customIgnore));
  },

  async BuildPayload(projectPath: string, relPaths: string[], opts: PayloadOptions): Promise<PayloadResult> {
    return await window.go.app.App.BuildPayload(projectPath, relPaths, opts);
  },

  // El copiado ocurre en Go: el webview falla con payloads grandes
  async CopyToClipboard(text: string): Promise<void> {
    await window.go.app.App.CopyToClipboard(text);
  },

  async SavePayload(text: string, suggestedName: string): Promise<string> {
    return await window.go.app.App.SavePayload(text, suggestedName);
  },

  async GetPlatform(): Promise<string> {
    return await window.go.app.App.GetPlatform();
  },

  getCurrentProjectPath(): string | null {
    return currentProjectPath;
  },
};

export const Bridge = isWailsEnvironment() ? WailsBridge : MockBridge;

// Abre una URL en el navegador del sistema (Wails) o en una pestana nueva
export function openExternal(url: string): void {
  if (typeof window !== 'undefined' && window.runtime?.BrowserOpenURL) {
    window.runtime.BrowserOpenURL(url);
    return;
  }
  window.open(url, '_blank', 'noopener');
}
