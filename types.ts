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

// Opciones de armado del payload (espejo de payload.Options en Go)
export interface PayloadOptions {
  includeTree: boolean;
  includeGraph: boolean;
  includeContents: boolean;
  maxFileBytes: number;
  instruction: string;
}

export interface PayloadStats {
  files: number;
  skipped: number;
  truncated: number;
  bytes: number;
  tokens: number;
  externals: number;
}

export interface PayloadResult {
  text: string;
  stats: PayloadStats;
  warnings?: string[];
}

export interface AppState {
  projectPath: string | null;
  tree: TreeSnapshot | null;
  isLoading: boolean;

  selectedFileIds: Set<string>;
  expandedFolderIds: Set<string>;
  searchQuery: string;

  options: PayloadOptions;

  payload: PayloadResult | null;
  isBuilding: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
