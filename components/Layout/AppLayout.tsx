import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { FileExplorer } from '../features/Tree/FileExplorer';
import { Dashboard } from '../OneShot/Dashboard';
import { ChatOverlay } from '../features/Chat/ChatOverlay';
import { useStore } from '../../contexts/StoreContext';
import { SettingsModal } from '../features/Settings/SettingsModal';
import { PromptView } from '../features/Prompt/PromptView';
import { ContextPanel } from '../features/Context/ContextPanel';

export const AppLayout: React.FC = () => {
    const { state } = useStore();
    const [isSettingsOpen, setSettingsOpen] = React.useState(false);

    const renderMainContent = () => {
        switch (state.activeTab) {
            case 'context': return <ContextPanel />;
            case 'chat': return <PromptView />;
            case 'tree':
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-canvas text-ink font-sans selection:bg-ink selection:text-canvas overflow-hidden antialiased">

            <Sidebar onSettings={() => setSettingsOpen(true)} />

            {state.projectPath && (
                <aside className="w-80 border-r border-smoke hidden md:flex flex-col shrink-0 transition-all duration-700 ease-expo bg-canvas/30">
                    <FileExplorer />
                </aside>
            )}

            <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden bg-canvas">
                <Navbar />
                <div className="flex-1 overflow-hidden relative transition-opacity duration-700 ease-expo">
                    {renderMainContent()}
                    <ChatOverlay />
                </div>
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};