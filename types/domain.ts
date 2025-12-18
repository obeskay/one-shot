// Domain types aligned with Go DTOs (shotgun/internal/domain)

export type ISOTime = string; // RFC3339

export type ErrorDTO = {
  code: string;
  message: string;
  details?: unknown;
};

// ---------------------------------------------------------------------------
// Project / Tree
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Selection / Ignore
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type JobKind = "scan" | "buildContext" | "runPrompt";
export type JobState = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type JobProgressDTO = {
  jobId: string;
  kind: JobKind;
  state: JobState;
  stage?: string;
  current?: number;
  total?: number;
  message?: string;
  startedAt?: ISOTime;
  updatedAt?: ISOTime;
  error?: ErrorDTO;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type ContextBuildOptionsDTO = {
  maxBytes: number;
  maxFileBytes: number;
  includeBinary: boolean;
  format: "xmlish" | "markdown";
};

export type ContextFileDTO = {
  id: string;
  relPath: string;
  sizeBytes?: number;
  truncated: boolean;
  content: string;
};

export type ContextPayloadDTO = {
  snapshotId?: string;
  options: ContextBuildOptionsDTO;
  files: ContextFileDTO[];
  totalBytes: number;
  warnings?: string[];
  createdAt: ISOTime;
};

// ══════════════════════════════════════════════════════════════════════════════
// LLM / Prompt DTOs
// ══════════════════════════════════════════════════════════════════════════════

export interface ModelCapabilitiesDTO {
  canStream: boolean;
  canThink: boolean;
  canSearch: boolean;
  canVision: boolean;
  supportsJson: boolean;
}

export interface ModelDTO {
  id: string;
  name: string;
  providerId: string;
  capabilities: ModelCapabilitiesDTO;
  contextSize: number;
}

export interface ProviderDTO {
  id: string;
  name: string;
  models: ModelDTO[];
  icon: string;
  baseUrl?: string;
}

export type ProviderID = "openai" | "gemini" | "openrouter";
export type ChatRole = "system" | "user" | "assistant";

export type ChatMessageDTO = {
  role: ChatRole;
  content: string;
  createdAt?: ISOTime;
};

export type PromptRunSpecDTO = {
  provider: ProviderID;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
  messages: ChatMessageDTO[];
  context?: ContextPayloadDTO;
};

export type UsageDTO = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type PromptRunResultDTO = {
  runId: string;
  provider: ProviderID;
  model: string;
  text: string;
  rawCall?: Record<string, unknown>;
  usage?: UsageDTO;
  createdAt: ISOTime;
  error?: ErrorDTO;
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export type HistoryItemDTO = {
  id: string;
  title?: string;
  spec: PromptRunSpecDTO;
  result: PromptRunResultDTO;
  createdAt: ISOTime;
};

// ---------------------------------------------------------------------------
// Helpers para conversion legacy -> DTO
// ---------------------------------------------------------------------------

import type { FileNode, TreeSnapshot } from '../types';

export function fileNodeToDTO(node: FileNode): FileNodeDTO {
  return {
    id: node.id,
    relPath: node.path,
    name: node.name,
    kind: node.isDir ? 'dir' : 'file',
    sizeBytes: node.size,
    modTime: node.modTime,
    ignored: false,
    children: node.children?.map(fileNodeToDTO),
  };
}

export function treeDTOToLegacy(dto: TreeSnapshotDTO): TreeSnapshot {
  const convertNode = (node: FileNodeDTO): FileNode => ({
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
