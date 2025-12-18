import React, { useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { BrainCircuit, Globe, Terminal, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const ModelSelector: React.FC = () => {
    const { state, dispatch } = useStore();
    const { aiConfig } = state;
    const [isOpen, setIsOpen] = useState(false);

    const provider = state.providers.find(p => p.id === aiConfig.provider);
    const models = provider?.models || [];
    const currentModel = models.find(m => m.id === aiConfig.model);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 h-8 rounded-lg border bg-surface/50 transition-all duration-300",
                    isOpen 
                        ? "border-status-ready bg-surface-elevated shadow-glow-subtle ring-1 ring-status-ready/20" 
                        : "border-stroke hover:border-stroke-emphasis hover:bg-surface"
                )}
            >
                <div className="flex items-center justify-center text-status-ready opacity-80">
                    {provider?.icon ? <span>{provider.icon}</span> : <Terminal size={12} />}
                </div>
                <span className="text-[10px] font-mono font-medium text-ink-muted truncate max-w-[100px]">
                    {currentModel?.name || 'Seleccionar...'}
                </span>
                <ChevronDown size={12} className={cn("text-ink-subtle transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {/* Premium Popover */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-black/5" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute top-10 right-0 w-64 bg-surface-elevated border border-stroke rounded-xl shadow-elevated z-50 overflow-hidden animate-pop-in backdrop-blur-xl">
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-stroke bg-surface-muted/50">
                            <span className="text-[9px] font-mono text-ink-subtle uppercase tracking-widest font-bold">
                                Proveedor: {provider?.name}
                            </span>
                        </div>

                        {/* List */}
                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        dispatch({
                                            type: 'UPDATE_AI_CONFIG',
                                            payload: {
                                                model: m.id,
                                                useThinking: m.canThink ? true : aiConfig.useThinking,
                                            }
                                        });
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200 group",
                                        m.id === aiConfig.model ? "bg-status-ready/10 text-status-ready" : "text-ink-muted hover:bg-surface hover:text-ink"
                                    )}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-medium tracking-wide">{m.name}</span>
                                        <div className="flex gap-2">
                                            {m.canThink && <BrainCircuit size={10} className="text-purple-400 opacity-60" />}
                                            {m.canSearch && <Globe size={10} className="text-green-400 opacity-60" />}
                                        </div>
                                    </div>
                                    {m.id === aiConfig.model && <Check size={12} />}
                                </button>
                            ))}
                        </div>

                        {/* Toggles */}
                        <div className="p-2 border-t border-stroke bg-surface-muted/30 flex items-center justify-around gap-2">
                            {currentModel?.canThink && (
                                <button
                                    onClick={() => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useThinking: !aiConfig.useThinking } })}
                                    className={cn(
                                        "flex-1 h-8 flex items-center justify-center gap-2 rounded-lg transition-all duration-300 text-[10px] font-medium border",
                                        aiConfig.useThinking 
                                            ? "bg-purple-400/10 border-purple-400/20 text-purple-400" 
                                            : "bg-surface border-stroke text-ink-subtle hover:text-ink hover:border-stroke-emphasis"
                                    )}
                                >
                                    <BrainCircuit size={12} />
                                    <span>Pensar</span>
                                </button>
                            )}
                            {currentModel?.canSearch && (
                                <button
                                    onClick={() => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useGrounding: !aiConfig.useGrounding } })}
                                    className={cn(
                                        "flex-1 h-8 flex items-center justify-center gap-2 rounded-lg transition-all duration-300 text-[10px] font-medium border",
                                        aiConfig.useGrounding 
                                            ? "bg-green-400/10 border-green-400/20 text-green-400" 
                                            : "bg-surface border-stroke text-ink-subtle hover:text-ink hover:border-stroke-emphasis"
                                    )}
                                >
                                    <Globe size={12} />
                                    <span>Buscar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
