import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Layers, TerminalSquare, Settings, Command, Box } from 'lucide-react';
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
            'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 ease-expo group relative',
            active
                ? 'bg-ink text-ink-inverted shadow-glow-subtle scale-105'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-elevated'
        )}
    >
        {icon}
        {active && (
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-3 bg-status-ready rounded-full shadow-glow animate-reveal" />
        )}
        
        {/* Tooltip (CSS only) */}
        <div className="absolute left-14 px-2 py-1 rounded bg-surface-elevated border border-stroke text-[10px] text-ink opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 shadow-elevated">
            {tooltip}
        </div>
    </button>
);

export const Sidebar: React.FC<{ onSettings: () => void }> = ({ onSettings }) => {
    const { state, dispatch } = useStore();

    return (
        <aside className="w-16 flex flex-col items-center py-6 border-r border-stroke bg-canvas z-50 h-full shrink-0 relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[200px] bg-status-ready/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Logo */}
            <div className="mb-10 relative group">
                <div className="absolute inset-0 bg-status-ready/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-10 h-10 flex items-center justify-center bg-surface-elevated rounded-xl shadow-base border border-stroke group-hover:border-status-ready/50 transition-all duration-500 cursor-pointer">
                    <Box size={18} className="text-status-ready" strokeWidth={2} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-5 w-full items-center">
                <NavItem
                    active={state.activeTab === 'studio'}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'studio' })}
                    icon={<TerminalSquare size={18} strokeWidth={1.5} />}
                    tooltip="Studio"
                />
                <NavItem
                    active={state.activeTab === 'context'}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'context' })}
                    icon={<Layers size={18} strokeWidth={1.5} />}
                    tooltip="Contexto"
                />
            </nav>

            {/* Settings */}
            <button
                onClick={onSettings}
                className="w-10 h-10 flex items-center justify-center text-ink-subtle hover:text-ink transition-all hover:rotate-45 duration-500 ease-expo rounded-xl hover:bg-surface-elevated border border-transparent hover:border-stroke"
                aria-label="ajustes"
            >
                <Settings size={18} strokeWidth={1.5} />
            </button>
        </aside>
    );
};
