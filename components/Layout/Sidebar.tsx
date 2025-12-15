import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { FolderTree, Layers, TerminalSquare, Settings, Command } from 'lucide-react';
import { cn } from '../../utils/cn';

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, tooltip: string }> = ({ active, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={cn(
            "w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ease-expo group relative",
            active ? "bg-white text-black" : "text-secondary hover:text-primary hover:bg-white/5"
        )}
    >
        {icon}
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-black rounded-r-full -ml-px"></div>}
    </button>
);

export const Sidebar: React.FC<{ onSettings: () => void }> = ({ onSettings }) => {
    const { state, dispatch } = useStore();

    return (
        <aside className="w-16 flex flex-col items-center py-6 border-r border-border bg-background z-40">
            <div className="mb-8">
                <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
                    <Command size={16} className="text-primary" />
                </div>
            </div>
            
            <nav className="flex-1 flex flex-col gap-4 w-full px-3 items-center">
                <NavItem 
                    active={state.activeTab === 'tree'} 
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'tree' })}
                    icon={<FolderTree size={18} strokeWidth={1.5} />}
                    tooltip="Explorer"
                />
                <NavItem 
                    active={state.activeTab === 'context'} 
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'context' })}
                    icon={<Layers size={18} strokeWidth={1.5} />}
                    tooltip="Context"
                />
                <NavItem 
                    active={state.activeTab === 'chat'} 
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'chat' })}
                    icon={<TerminalSquare size={18} strokeWidth={1.5} />}
                    tooltip="Prompt"
                />
            </nav>

            <button 
                onClick={onSettings}
                className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition-colors hover:rotate-90 duration-500 ease-expo"
            >
                <Settings size={18} strokeWidth={1.5} />
            </button>
        </aside>
    );
};