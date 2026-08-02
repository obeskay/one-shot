import React from 'react';
import { Sidebar } from './Sidebar';
import { FileExplorer } from '../features/Tree/FileExplorer';
import { PayloadView } from '../features/Payload/PayloadView';
import { Dashboard } from '../OneShot/Dashboard';
import { useStore } from '../../contexts/StoreContext';

export const AppLayout: React.FC = () => {
    const { state } = useStore();

    // Hero mientras no hay proyecto abierto
    if (!state.projectPath) {
        return <Dashboard />;
    }

    return (
        <div className="flex h-screen bg-canvas text-ink font-sans overflow-hidden selection:bg-status-ready selection:text-black">
            <Sidebar />

            <aside className="w-72 border-r border-stroke bg-surface/30 flex flex-col shrink-0">
                <FileExplorer />
            </aside>

            <main className="flex-1 flex flex-col min-w-0 relative bg-canvas">
                <PayloadView />
            </main>
        </div>
    );
};
