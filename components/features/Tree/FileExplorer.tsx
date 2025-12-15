import React, { useMemo } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { TreeRow } from './TreeRow';
import { Input } from '../../ui/Input';
import { Search } from 'lucide-react';
import { filterTree, getAllFileIds } from '../../../utils/tree-utils';

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
      if (type === 'code') targetIds = allIds.filter(id => /\.(ts|tsx|js|jsx|go|py|rs)$/.test(id));
      if (type === 'config') targetIds = allIds.filter(id => /\.(json|yaml|yml|toml|xml)$/.test(id));

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
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-6 pb-4 border-b border-light">
        {/* Header con contador */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-[10px] font-mono text-ash uppercase tracking-widest">
              Explorador
            </h2>
            {selectedCount > 0 && (
              <span className="text-[10px] font-mono text-ink bg-smoke/50 px-2 py-0.5 rounded-sm">
                {selectedCount} {selectedCount === 1 ? 'FILE' : 'FILES'}
              </span>
            )}
          </div>

          {/* Botones de selección */}
          <div className="flex gap-4">
            <button
              onClick={handleSelectAll}
              className="text-[10px] uppercase tracking-widest text-ash hover:text-ink transition-colors"
              title="Seleccionar todo"
            >
              ALL
            </button>
            {selectedCount > 0 && (
              <button
                onClick={handleDeselectAll}
                className="text-[10px] uppercase tracking-widest text-ash hover:text-ink transition-colors"
                title="Deseleccionar"
              >
                NONE
              </button>
            )}
          </div>
        </div>

        {/* Búsqueda con icono */}
        <div className="relative mb-6">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-ash" />
          <input
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            className="w-full bg-transparent border-b border-light pb-2 pl-6 text-xs text-ink placeholder:text-smoke/50 focus:outline-none focus:border-ink font-mono uppercase tracking-wide transition-colors"
          />
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['code', 'config', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => handleSmartSelect(t as any)}
              className="text-[10px] uppercase tracking-widest text-ash hover:text-ink border border-light px-3 py-1.5 rounded-full hover:border-ink transition-all whitespace-nowrap"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20 pt-4">
        {filteredRoot && <TreeRow node={filteredRoot} depth={0} />}
      </div>
    </div>
  );
};