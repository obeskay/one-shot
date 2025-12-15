import React, { useMemo } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { findNodeById } from '../../utils/tree-utils';
import { X, FileCode, FileJson, FileText, File, ArrowRight } from 'lucide-react';
import { formatBytes, estimateTokens } from '../../utils/cn';

interface FileCardProps {
  fileId: string;
}

export const FileCard: React.FC<FileCardProps> = ({ fileId }) => {
  const { state, dispatch } = useStore();

  const node = useMemo(() => {
    if (!state.tree) return null;
    return findNodeById(state.tree.root, fileId);
  }, [state.tree, fileId]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_SELECT', payload: fileId });
  };

  if (!node) return null;

  const ext = node.name.split('.').pop()?.toLowerCase() || '';
  const tokens = estimateTokens(node.size);

  const getIcon = () => {
    const size = 20;
    const strokeWidth = 1.5;
    if (['ts', 'tsx', 'js', 'jsx', 'go', 'py', 'rs', 'rb', 'php', 'java', 'c', 'cpp', 'h'].includes(ext)) {
      return <FileCode size={size} strokeWidth={strokeWidth} />;
    }
    if (['json', 'yaml', 'yml', 'toml', 'xml', 'env'].includes(ext)) {
      return <FileJson size={size} strokeWidth={strokeWidth} />;
    }
    if (['md', 'txt', 'rst', 'doc'].includes(ext)) {
      return <FileText size={size} strokeWidth={strokeWidth} />;
    }
    return <File size={size} strokeWidth={strokeWidth} />;
  };

  // Obtener nombre corto del path para mostrar contexto
  const pathParts = fileId.split('/');
  const shortPath = pathParts.length > 2
    ? `.../${pathParts.slice(-2, -1)[0]}/`
    : pathParts.length > 1
    ? `${pathParts[0]}/`
    : '';

  return (
    <article className="group relative cursor-pointer">
      {/* Card con border-radius orgánico */}
      <div className="rounded-organic-card border border-stroke bg-surface/50 p-4 transition-all duration-slow hover:border-stroke-emphasis hover:shadow-elevated hover:bg-surface">
        <div className="flex items-start justify-between gap-3">
          {/* Icon + Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-canvas flex items-center justify-center shrink-0 text-ink-subtle group-hover:text-ink transition-colors duration-slow">
              {getIcon()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-ink truncate lowercase tracking-tight">
                {node.name}
              </span>
              <span className="text-micro text-ink-subtle font-mono truncate mt-0.5">
                {shortPath}{formatBytes(node.size, 0)}
              </span>
            </div>
          </div>

          {/* Token badge */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-micro text-ink-subtle font-mono bg-canvas px-2 py-0.5 rounded-pill">
              {tokens > 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens}tk
            </span>

            {/* Remove button - arrow reveal pattern */}
            <button
              onClick={handleRemove}
              className="w-6 h-6 rounded-full border border-stroke flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-normal hover:border-status-error hover:text-status-error text-ink-subtle"
              aria-label={`Quitar ${node.name}`}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
