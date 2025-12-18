import React from 'react';
import { Sidebar } from './Sidebar';
import { FileExplorer } from '../features/Tree/FileExplorer';
import { Studio } from '../features/Studio/Studio';
import { useStore } from '../../contexts/StoreContext';
import { SettingsModal } from '../features/Settings/SettingsModal';
import { Dashboard } from '../OneShot/Dashboard';

export const AppLayout: React.FC = () => {
    const { state } = useStore();
    const [isSettingsOpen, setSettingsOpen] = React.useState(false);

    // Hero/Landing si no hay proyecto seleccionado
    if (!state.projectPath) {
        return <Dashboard />;
    }

    return (
        <div className="flex h-screen bg-canvas text-ink font-sans overflow-hidden selection:bg-status-ready selection:text-black">
            
            {/* 1. Barra Lateral (Navegación Global) */}
            <Sidebar onSettings={() => setSettingsOpen(true)} />

            {/* 2. Panel Izquierdo (Contexto) */}
            <aside className="w-72 border-r border-stroke bg-surface/30 flex flex-col shrink-0 transition-all duration-500 ease-expo">
                <FileExplorer />
            </aside>

            {/* 3. Área Principal (Studio: Composer + Chat) */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-canvas">
                <Studio />
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};