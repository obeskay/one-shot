import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Bridge } from '../../services/bridge';
import { FolderOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
    const { state, dispatch } = useStore();

    const handleOpen = async () => {
        const path = await Bridge.SelectProject();
        if (path) {
            const tree = await Bridge.ScanProject(path);
            dispatch({ type: 'SET_PROJECT', payload: { path, tree } });
        }
    };

    return (
        <nav className="h-14 border-b border-stroke flex items-center justify-between px-4 bg-glass sticky top-0 z-30 backdrop-blur-md">
            {/* Project Title / Path */}
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col">
                    <span className="text-micro uppercase tracking-widest text-ink-subtle font-mono">
                        espacio actual
                    </span>
                    <h1
                        className="text-sm font-medium text-ink truncate max-w-[300px] md:max-w-md font-mono lowercase"
                        title={state.projectPath || ''}
                    >
                        {state.projectPath ? state.projectPath.split('/').pop() : 'sin proyecto'}
                    </h1>
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={handleOpen}
                className="group flex items-center gap-2 px-4 py-2 rounded-pill border border-stroke hover:border-stroke-emphasis hover:bg-surface transition-all duration-normal"
            >
                <FolderOpen size={14} className="text-ink-subtle group-hover:text-ink transition-colors duration-normal" />
                <span className="text-micro uppercase tracking-widest text-ink-subtle group-hover:text-ink font-mono">
                    cambiar
                </span>
            </button>
        </nav>
    );
};
