import React, { useMemo } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { TreeRow } from './TreeRow';
import { Input } from '../../ui/Input';
import { Search } from 'lucide-react';
import { filterTree, getAllFileIds } from '../../../utils/tree-utils';

export const FileExplorer: React.FC = () => {
  const { state, dispatch } = useStore();
  const { tree, searchQuery } = state;

  const filteredRoot = useMemo(() => {
    if (!tree) return null;
    return filterTree(tree.root, searchQuery); 
  }, [tree, searchQuery]);

  const handleSmartSelect = (type: 'code' | 'config' | 'all') => {
      if (!tree) return;
      const allIds = getAllFileIds(tree.root);
      let targetIds: string[] = [];

      if (type === 'all') targetIds = allIds;
      if (type === 'code') targetIds = allIds.filter(id => /\.(ts|tsx|js|jsx|go|py|rs)$/.test(id));
      if (type === 'config') targetIds = allIds.filter(id => /\.(json|yaml|yml|toml|xml)$/.test(id));

      dispatch({ type: 'SELECT_BATCH', payload: { ids: targetIds, selected: true }});
  };

  if (!state.projectPath) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 pb-2">
        <div className="mb-6">
            <Input 
                placeholder="search tree..." 
                value={searchQuery}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                className="text-xs font-mono"
            />
        </div>
        
        <div className="flex gap-2 mb-4 border-b border-border pb-4 overflow-x-auto no-scrollbar">
            {['code', 'config', 'all'].map((t) => (
                <button 
                    key={t}
                    onClick={() => handleSmartSelect(t as any)}
                    className="text-[10px] uppercase tracking-widest text-secondary hover:text-primary border border-border px-2 py-1 rounded-sm hover:border-secondary transition-colors"
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
        {filteredRoot && <TreeRow node={filteredRoot} depth={0} />}
      </div>
    </div>
  );
};