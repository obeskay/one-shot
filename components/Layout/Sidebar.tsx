import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { FolderTree, Layers, TerminalSquare, Settings, Command } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItemProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    tooltip: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, tooltip }) => (
    <button
        onClick={onClick}
        className={cn(
            'w-10 h-10 flex items-center justify-center rounded-base transition-all duration-slow ease-expo-out group relative',
            active
                ? 'bg-ink text-ink-inverted'
                : 'text-ink-subtle hover:text-ink hover:bg-surface'
        )}
        title={tooltip}
        aria-label={tooltip}
    >
        {icon}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-status-ready rounded-full -ml-2" />
        )}
    </button>
);

export const Sidebar: React.FC<{ onSettings: () => void }> = ({ onSettings }) => {
    const { state, dispatch } = useStore();

    return (
        <aside className="w-16 flex flex-col items-center py-6 border-r border-stroke bg-canvas z-40 h-full shrink-0">
            {/* Logo */}
            <div className="mb-10">
                <div className="w-9 h-9 flex items-center justify-center bg-surface-elevated rounded-base shadow-subtle border border-stroke">
                    <Command size={16} className="text-ink" strokeWidth={1.5} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-4 w-full px-3 items-center">
                <NavItem
                    active={state.activeTab === 'tree'}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'tree' })}
                    icon={<FolderTree size={18} strokeWidth={1.5} />}
                    tooltip="explorador"
                />
                <NavItem
                    active={state.activeTab === 'context'}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'context' })}
                    icon={<Layers size={18} strokeWidth={1.5} />}
                    tooltip="contexto"
                />
                <NavItem
                    active={state.activeTab === 'chat'}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'chat' })}
                    icon={<TerminalSquare size={18} strokeWidth={1.5} />}
                    tooltip="chat"
                />
            </nav>

            {/* Settings */}
            <button
                onClick={onSettings}
                className="w-10 h-10 flex items-center justify-center text-ink-subtle hover:text-ink transition-all hover:rotate-90 duration-slow ease-expo-out"
                aria-label="ajustes"
            >
                <Settings size={18} strokeWidth={1.5} />
            </button>
        </aside>
    );
};
