import React, { memo, useState } from 'react';
import { FileNode } from '../../../types';
import { cn, formatBytes } from '../../../utils/cn';
import { useStore } from '../../../contexts/StoreContext';
import { getAllFileIds } from '../../../utils/tree-utils';
import { FileIcon } from './FileIcon';
import { Check, ChevronRight } from 'lucide-react';

interface TreeRowProps {
  node: FileNode;
  depth: number;
}

export const TreeRow: React.FC<TreeRowProps> = memo(({ node, depth }) => {
  const { state, dispatch } = useStore();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = state.expandedFolderIds.has(node.id);
  const isSelected = state.selectedFileIds.has(node.id);
  const allChildrenIds = React.useMemo(() => node.isDir ? getAllFileIds(node) : [], [node]);
  const isFullySelected = node.isDir && allChildrenIds.length > 0 && allChildrenIds.every(id => state.selectedFileIds.has(id));

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDir) {
      dispatch({ type: 'TOGGLE_EXPAND', payload: node.id });
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.isDir) {
          const shouldSelect = !isFullySelected;
          dispatch({
              type: 'SELECT_BATCH',
              payload: { ids: allChildrenIds, selected: shouldSelect }
          });
      } else {
          dispatch({ type: 'TOGGLE_SELECT', payload: node.id });
      }
  };

  const shouldShowCheckbox = (selected: boolean, fullySelected: boolean, hovered: boolean) => selected || fullySelected || hovered;

  return (
    <div className="w-full">
      <div
        role="treeitem"
        aria-expanded={node.isDir ? isExpanded : undefined}
        aria-selected={isSelected || isFullySelected}
        tabIndex={0}
        className={cn(
            "group flex items-center h-7 cursor-pointer select-none transition-colors duration-200 rounded-md mx-1 relative",
            "focus-visible:ring-2 focus-visible:ring-status-ready/30 outline-none",
            (isSelected || isFullySelected) 
                ? "text-ink bg-status-ready/5" 
                : "text-ink-subtle hover:text-ink hover:bg-surface-elevated/50"
        )}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={handleSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(e as any);
          }
          if (node.isDir && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            e.preventDefault();
            if ((e.key === 'ArrowRight' && !isExpanded) || (e.key === 'ArrowLeft' && isExpanded)) {
              handleExpand(e as any);
            }
          }
        }}
      >
        <div className="flex items-center gap-2 w-full relative pr-2">
            
            {/* Checkbox (optimized visually) */}
            <div
              className={cn(
                "flex-shrink-0 w-3 h-3 border rounded-[3px] flex items-center justify-center transition-opacity duration-200",
                (isSelected || isFullySelected)
                  ? "bg-status-ready border-status-ready opacity-100"
                  : "border-stroke/50 bg-transparent group-hover:border-ink-muted",
                 !shouldShowCheckbox(isSelected, isFullySelected, isHovered) && "opacity-0"
              )}
            >
              {(isSelected || isFullySelected) && (
                <Check className="w-2 h-2 text-canvas" strokeWidth={3.5} />
              )}
            </div>

            {/* Folder Toggle */}
            {node.isDir ? (
                <div
                    onClick={handleExpand}
                    className={cn(
                        "flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded cursor-pointer text-ink-subtle hover:text-ink transition-transform duration-200",
                        isExpanded && "rotate-90"
                    )}
                >
                    <ChevronRight size={10} strokeWidth={2.5} />
                </div>
            ) : <div className="w-3.5" /> /* spacer */}

            {/* Icon */}
            <div className={cn(
                "flex-shrink-0 transition-colors",
                (isSelected || isFullySelected) ? "text-status-ready" : "text-ink-subtle/70 group-hover:text-ink-subtle"
            )}>
              <FileIcon
                isDir={node.isDir}
                expanded={isExpanded}
                name={node.name}
              />
            </div>

            {/* Name */}
            <span className={cn(
                "text-[11px] font-sans truncate transition-colors flex-1 min-w-0 tracking-tight",
                node.isDir ? "font-medium text-ink" : "font-normal text-ink-subtle group-hover:text-ink"
            )}>
              {node.name}
            </span>

            {/* Size Badge */}
            {!node.isDir && isHovered && (
              <span className="flex-shrink-0 text-[9px] font-mono text-ink-subtle/40">
                {formatBytes(node.size, 0)}
              </span>
            )}
        </div>
      </div>

      {node.isDir && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});