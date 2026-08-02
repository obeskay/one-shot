// Tipos alineados con los DTOs de Go (shotgun/internal/domain)

export type ISOTime = string; // RFC3339

export type ErrorDTO = {
  code: string;
  message: string;
  details?: unknown;
};

export type ProjectDTO = {
  rootPath: string;
  repoName: string;
  openedAt: ISOTime;
  scanHash?: string;
  platform?: string;
};

export type TreeStatsDTO = {
  files: number;
  dirs: number;
  totalBytes: number;
  ignored: number;
  maxDepth: number;
};

export type FileKind = "dir" | "file" | "link";

export type FileNodeDTO = {
  id: string;
  relPath: string;
  name: string;
  kind: FileKind;
  ext?: string;
  sizeBytes?: number;
  modTime?: ISOTime;
  hash?: string;
  ignored: boolean;
  reason?: string;
  children?: FileNodeDTO[];
};

export type TreeSnapshotDTO = {
  project: ProjectDTO;
  root: FileNodeDTO;
  stats: TreeStatsDTO;
  createdAt: ISOTime;
  version: number;
};

export type SelectionDTO = {
  selectedIds: string[];
  expandedIds?: string[];
  focusId?: string;
};

export type IgnoreOptionsDTO = {
  useGitignore: boolean;
  useCustomIgnore: boolean;
  customIgnoreText?: string;
};
