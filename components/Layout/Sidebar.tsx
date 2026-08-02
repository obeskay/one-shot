import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Bridge } from '../../services/bridge';
import { Box, FolderOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { dispatch } = useStore();

    const handleOpen = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const path = await Bridge.SelectProject();
            if (path) {
                const tree = await Bridge.ScanProject(path);
                dispatch({ type: 'SET_PROJECT', payload: { path, tree } });
            }
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <aside className="w-16 flex flex-col items-center py-6 border-r border-stroke bg-canvas shrink-0 relative">
            <div className="absolute top-0 left-0 w-full h-[200px] bg-status-ready/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="mb-10 relative">
                <div className="relative w-10 h-10 flex items-center justify-center bg-surface-elevated rounded-xl shadow-base border border-stroke">
                    <Box size={18} className="text-status-ready" strokeWidth={2} />
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-5 w-full items-center">
                <button
                    onClick={handleOpen}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-subtle hover:text-ink hover:bg-surface-elevated transition-all duration-300 group relative"
                    aria-label="Cambiar proyecto"
                >
                    <FolderOpen size={18} strokeWidth={1.5} />
                    <span className="absolute left-14 px-2 py-1 rounded bg-surface-elevated border border-stroke text-[10px] text-ink opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-elevated">
                        Cambiar proyecto
                    </span>
                </button>
            </nav>
        </aside>
    );
};
