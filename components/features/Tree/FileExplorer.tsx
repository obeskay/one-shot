import React, { useMemo } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { TreeRow } from './TreeRow';
import { Search, Filter, FolderOpen, MousePointer2 } from 'lucide-react';
import { filterTree, getAllFileIds } from '../../../utils/tree-utils';
import { cn } from '../../../utils/cn';

export const FileExplorer: React.FC = () => {
  const { state, dispatch } = useStore();
  const { tree, searchQuery, selectedFileIds } = state;

  const filteredRoot = useMemo(() => {
    if (!tree) return null;
    return filterTree(tree.root, searchQuery);
  }, [tree, searchQuery]);

  const selectedCount = selectedFileIds.size;

  const handleSmartSelect = (type: 'code' | 'config' | 'all') => {
      if (!tree) return;
      const allIds = getAllFileIds(tree.root);
      let targetIds: string[] = [];

      if (type === 'all') targetIds = allIds;
      if (type === 'code') targetIds = allIds.filter(id => /\.(ts|tsx|js|jsx|go|py|rs|java|c|cpp|h)$/.test(id));
      if (type === 'config') targetIds = allIds.filter(id => /\.(json|yaml|yml|toml|xml|ini|env|gitignore)$/.test(id));

      dispatch({ type: 'SELECT_BATCH', payload: { ids: targetIds, selected: true }});
  };

  const handleSelectAll = () => {
    if (!tree) return;
    const allIds = getAllFileIds(tree.root);
    dispatch({ type: 'SELECT_BATCH', payload: { ids: allIds, selected: true }});
  };

  const handleDeselectAll = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  if (!state.projectPath) return null;

  return (
    <div className="flex flex-col h-full bg-surface-muted/30 font-sans relative overflow-hidden border-r border-stroke">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-status-ready/2 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

      {/* Header Sticky */}
      <div className="px-4 pt-5 pb-4 space-y-4 shrink-0">
        
        {/* Title & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-bold text-ink uppercase tracking-[0.15em]">
              Proyecto
            </h2>
          </div>
          
          {selectedCount > 0 && (
             <div className="animate-pop-in flex items-center gap-2">
                <span className="text-[9px] font-mono text-status-ready bg-status-ready/10 px-2 py-0.5 rounded-full border border-status-ready/20">
                    {selectedCount} seleccionados
                </span>
             </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative group">
            <div className="relative flex items-center bg-surface border border-stroke rounded-lg px-2.5 py-1.5 transition-all focus-within:ring-2 focus-within:ring-status-ready/10 focus-within:border-status-ready/30">
                <Search className="w-3.5 h-3.5 text-ink-subtle mr-2" />
                <input
                    placeholder="Filtrar archivos..."
                    value={searchQuery}
                    onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                    className="w-full bg-transparent border-none text-[12px] text-ink placeholder:text-ink-subtle/30 focus:ring-0 p-0 font-light"
                    spellCheck={false}
                />
            </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mask-gradient-right pb-1">
          {[
              { id: 'all', label: 'Todo' }, 
              { id: 'code', label: 'Fuente' }, 
              { id: 'config', label: 'Config' }
           ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleSmartSelect(t.id as any)}
              className="text-[10px] font-medium text-ink-subtle hover:text-ink bg-surface border border-stroke hover:border-stroke-emphasis px-2.5 py-0.5 rounded-md transition-all whitespace-nowrap"
            >
              {t.label}
            </button>
          ))}
          {selectedCount > 0 && (
             <button
               onClick={handleDeselectAll}
               className="text-[10px] font-medium text-status-error/70 hover:text-status-error px-1 transition-colors"
             >
               Limpiar
             </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-0.5">
        {filteredRoot ? (
            <TreeRow node={filteredRoot} depth={0} />
        ) : (
             <div className="flex flex-col items-center justify-center pt-20 text-ink-subtle/30 space-y-3">
                 <Search size={32} strokeWidth={1} className="opacity-20" />
                 <span className="text-[11px] font-mono">Nada por aquí</span>
             </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="px-4 py-2 border-t border-stroke/50 bg-surface-muted/50 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 opacity-40">
              <FolderOpen size={10} />
              <span className="text-[9px] font-mono">{tree?.fileCount || 0} items</span>
          </div>
          <div className="text-[9px] font-mono opacity-20 uppercase tracking-widest">v0.1.0</div>
      </footer>
    </div>
  );
};