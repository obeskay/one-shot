import React from 'react';
import { Folder } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { Bridge } from '../../services/bridge';
import { cn } from '../../utils/cn';

export const Navbar: React.FC = () => {
  const { state, dispatch } = useStore();

  const handleOpen = async () => {
      const path = await Bridge.SelectProject();
      const tree = await Bridge.ScanProject(path);
      dispatch({ type: 'SET_PROJECT', payload: { path, tree }});
  };

  return (
    <nav className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm z-30 select-none">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold tracking-tight lowercase">one_shot</h1>
        {state.projectPath && (
            <>
                <span className="text-border text-xs">/</span>
                <span className="text-xs text-secondary font-mono lowercase">{state.projectPath.split('/').pop()}</span>
            </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
            onClick={handleOpen}
            className="group flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
            <Folder size={14} className="group-hover:stroke-primary transition-colors" />
            <span className="lowercase border-b border-transparent group-hover:border-primary pb-0.5 transition-all">
                {state.projectPath ? 'change_repo' : 'open_repo'}
            </span>
        </button>
      </div>
    </nav>
  );
};