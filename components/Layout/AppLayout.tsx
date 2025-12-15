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

    // Render active view based on sidebar selection
    const renderMainContent = () => {
        switch (state.activeTab) {
            case 'context': return <ContextPanel />;
            case 'chat': return <PromptView />;
            case 'tree':
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-background text-primary font-sans selection:bg-white/20 overflow-hidden">
            {/* Background Grain/Noise can be added here via CSS overlay if desired */}
            
            <Sidebar onSettings={() => setSettingsOpen(true)} />
            
            {state.projectPath && (
                <div className="w-72 border-r border-border hidden md:flex flex-col animate-reveal duration-500">
                    <FileExplorer />
                </div>
            )}

            <main className="flex-1 flex flex-col min-w-0 relative h-full transition-all duration-700 ease-expo">
                <Navbar />
                <div className="flex-1 overflow-hidden relative">
                    {renderMainContent()}
                    <ChatOverlay />
                </div>
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};