import React, { memo } from 'react';
import { FileNode } from '../../../types';
import { cn, formatBytes } from '../../../utils/cn';
import { useStore } from '../../../contexts/StoreContext';
import { getAllFileIds } from '../../../utils/tree-utils';

interface TreeRowProps {
  node: FileNode;
  depth: number;
}

export const TreeRow: React.FC<TreeRowProps> = memo(({ node, depth }) => {
  const { state, dispatch } = useStore();
  
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

  return (
    <div className="animate-fade-in">
      <div 
        className={cn(
            "group flex items-center h-7 cursor-pointer select-none transition-colors duration-200",
            (isSelected || isFullySelected) ? "text-primary" : "text-secondary hover:text-primary"
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
        onClick={handleSelect}
      >
        <div className="flex items-center w-full relative">
            {/* Guide line */}
            <div className="absolute left-[-6px] top-0 bottom-0 w-px bg-border group-hover:bg-white/20 transition-colors" />

            {/* Folder Toggle */}
            {node.isDir && (
                <div 
                    onClick={handleExpand}
                    className="absolute -left-[14px] w-3 h-3 flex items-center justify-center hover:bg-white/10 rounded-sm cursor-pointer"
                >
                    <div className={cn(
                        "w-0 h-0 border-l-[3px] border-l-current border-y-[3px] border-y-transparent transition-transform duration-200",
                        isExpanded && "rotate-90"
                    )} />
                </div>
            )}
            
            <span className={cn(
                "text-xs font-mono truncate transition-all",
                node.isDir ? "font-medium" : "font-normal",
                (isSelected || isFullySelected) && "underline decoration-primary/50 underline-offset-4"
            )}>
              {node.name}
            </span>

            {/* Size Badge (Visible on hover) */}
            {!node.isDir && (
              <span className="ml-auto text-[9px] font-mono text-border opacity-0 group-hover:opacity-100 transition-opacity">
                {formatBytes(node.size, 0)}
              </span>
            )}
        </div>
      </div>

      {node.isDir && isExpanded && node.children && (
        <div className="flex flex-col border-l border-border/50 ml-[5px]">
          {node.children.map(child => (
            <TreeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});