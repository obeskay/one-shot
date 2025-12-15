import React, { memo, useState } from 'react';
import { FileNode } from '../../../types';
import { cn, formatBytes } from '../../../utils/cn';
import { useStore } from '../../../contexts/StoreContext';
import { getAllFileIds } from '../../../utils/tree-utils';
import { FileIcon } from './FileIcon';
import { Check } from 'lucide-react';

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

  const showCheckbox = isHovered || isSelected || isFullySelected;

  return (
    <div className="animate-fade-in group/row">
      <div
        role="treeitem"
        aria-expanded={node.isDir ? isExpanded : undefined}
        aria-selected={isSelected || isFullySelected}
        tabIndex={0}
        className={cn(
            "group flex items-center h-8 cursor-pointer select-none transition-all duration-300 rounded-lg",
            "focus:outline-none focus:ring-1 focus:ring-ink focus:ring-offset-1 focus:ring-offset-canvas",
            (isSelected || isFullySelected) ? "text-ink" : "text-ash hover:text-ink"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
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
            
            {/* Hover Indicator Background (Subtle) */}
            <div className={cn(
                "absolute inset-0 bg-smoke/30 rounded-lg opacity-0 transition-opacity duration-300 -z-10",
                isHovered && "opacity-100"
            )} />

            {/* Checkbox */}
            <div
              className={cn(
                "flex-shrink-0 w-3 h-3 border border-ash rounded-[2px] flex items-center justify-center transition-all duration-300",
                (isSelected || isFullySelected)
                  ? "bg-ink border-ink"
                  : "border-ash bg-transparent",
                showCheckbox ? "opacity-100 scale-100" : "opacity-0 scale-90"
              )}
            >
              {(isSelected || isFullySelected) && (
                <Check className="w-2.5 h-2.5 text-canvas" strokeWidth={3} />
              )}
            </div>

            {/* Folder Toggle */}
            {node.isDir && (
                <div
                    onClick={handleExpand}
                    className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-smoke/50 rounded-full cursor-pointer transition-colors"
                >
                    <div className={cn(
                        "w-0 h-0 border-l-[3px] border-l-current border-y-[2px] border-y-transparent transition-transform duration-300 ease-expo",
                        isExpanded && "rotate-90"
                    )} />
                </div>
            )}

            {/* Icon */}
            <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              <FileIcon
                isDir={node.isDir}
                expanded={isExpanded}
                name={node.name}
              />
            </div>

            {/* Name */}
            <span className={cn(
                "text-[11px] font-mono truncate transition-all flex-1 min-w-0 tracking-wide",
                node.isDir ? "font-medium uppercase" : "font-normal lowercase text-ash group-hover/row:text-ink"
            )}>
              {node.name}
            </span>

            {/* Size Badge */}
            {!node.isDir && (
              <span className={cn(
                "flex-shrink-0 text-[9px] font-mono text-ash/50 transition-opacity uppercase tracking-widest",
                isHovered ? "opacity-100" : "opacity-0"
              )}>
                {formatBytes(node.size, 0)}
              </span>
            )}
        </div>
      </div>

      {node.isDir && isExpanded && node.children && (
        <div className="flex flex-col relative">
          {/* Vertical Guide Line */}
          <div className="absolute left-[27px] top-0 bottom-0 w-px bg-smoke/40" style={{ left: `${depth * 20 + 27}px` }} />
          {node.children.map(child => (
            <TreeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});