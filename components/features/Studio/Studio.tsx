import React from 'react';
import { useStudio } from '../../../hooks/useStudio';
import { ModelSelector } from '../Prompt/ModelSelector';
import { ChatMessage } from '../Chat/ChatMessage';
import { Button } from '../../ui/Button';
import { X, Sparkles, ArrowUp, Terminal, Square, Plus, Layers } from 'lucide-react';
import { cn, formatNumber } from '../../../utils/cn';

export const Studio: React.FC = () => {
    const {
        state,
        input,
        setInput,
        isStreaming,
        handleSend,
        handleStop,
        scrollRef,
        totalTokens,
        selectedFiles,
        toggleFile
    } = useStudio();

    return (
        <div className="flex flex-col h-full relative bg-canvas overflow-hidden">
            {/* 1. Header: Simplified & Premium */}
            <header className="h-12 border-b border-stroke flex items-center justify-between px-4 bg-glass backdrop-blur-xl z-30 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="flex items-center gap-2 text-ink-subtle px-2 py-1 rounded bg-surface-muted border border-stroke/50">
                        <Terminal size={12} className="text-status-ready" />
                        <span className="text-[10px] font-mono tracking-wider uppercase">Studio</span>
                    </div>
                    
                    <div className="h-4 w-px bg-stroke mx-1" />
                    
                    {/* Context Summary */}
                    <div className="flex items-center gap-2 overflow-hidden">
                        {selectedFiles.length > 0 ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-stroke bg-surface/50 text-[10px] text-ink-muted whitespace-nowrap animate-reveal">
                                <Layers size={10} />
                                <span>{selectedFiles.length} archivos en contexto</span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-ink-subtle italic truncate">Sin contexto seleccionado</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className={cn(
                        "text-[10px] font-mono transition-all duration-500 flex items-center gap-2",
                        totalTokens > state.budgetTokens ? "text-status-error animate-pulse" : "text-ink-subtle"
                    )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                        {formatNumber(totalTokens)} tokens
                    </div>
                    <ModelSelector />
                </div>
            </header>

            {/* 2. Chat Output: Native Feel */}
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32 transition-opacity duration-500" 
                ref={scrollRef}
            >
                {state.chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center select-none animate-reveal">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-status-ready/20 blur-[40px] rounded-full" />
                            <div className="relative w-16 h-16 rounded-2xl bg-surface-elevated border border-stroke-emphasis flex items-center justify-center shadow-glow-subtle">
                                <Sparkles size={28} strokeWidth={1.5} className="text-status-ready" />
                            </div>
                        </div>
                        <h2 className="text-lg font-medium tracking-tight text-ink mb-2">One-Shot Studio</h2>
                        <p className="text-xs font-mono text-ink-subtle max-w-[280px] text-center leading-relaxed">
                            Selecciona archivos para dar contexto e inicia el proceso creativo.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full space-y-8">
                        {state.chatMessages.map(msg => (
                            <ChatMessage 
                                key={msg.id} 
                                message={msg} 
                                isStreaming={isStreaming && msg.role === 'assistant' && msg.id.startsWith('temp-ai')} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Omnibar: Floating & Premium */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none z-40 bg-gradient-to-t from-canvas via-canvas/80 to-transparent">
                <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                    
                    {/* Context Chips (Floating above input) */}
                    {selectedFiles.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto no-scrollbar mask-gradient-right mb-2 pb-1 animate-slide-up">
                            {selectedFiles.map(id => (
                                <div 
                                    key={id} 
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-elevated/80 border border-stroke text-[9px] font-mono text-ink-muted whitespace-nowrap group hover:border-ink-subtle transition-colors"
                                >
                                    <span>{id.split('/').pop()}</span>
                                    <button 
                                        onClick={() => toggleFile(id)}
                                        className="hover:text-status-error opacity-40 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Main Omnibar */}
                    <div className={cn(
                        "relative flex flex-col bg-surface-elevated/90 border border-stroke rounded-2xl shadow-elevated backdrop-blur-xl transition-all duration-500 ease-expo",
                        "focus-within:border-stroke-emphasis focus-within:ring-4 focus-within:ring-status-ready/5 focus-within:shadow-glow-active"
                    )}>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Instrucción o pregunta para la IA..."
                            className="w-full bg-transparent border-none text-[13px] text-ink placeholder:text-ink-subtle/40 px-5 py-4 min-h-[56px] max-h-[200px] resize-none focus:ring-0 scrollbar-hidden leading-relaxed font-sans"
                            disabled={isStreaming}
                        />
                        
                        <div className="flex justify-between items-center px-4 pb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] text-ink-subtle uppercase tracking-[0.2em] font-mono font-semibold opacity-40">
                                    {state.aiConfig.provider === 'local-cli' ? 'Claude CLI' : 'API Node'}
                                </span>
                                <div className="h-3 w-px bg-stroke" />
                                <button className="flex items-center gap-1.5 text-[10px] text-ink-subtle hover:text-ink transition-colors px-2 py-0.5 rounded hover:bg-surface border border-transparent hover:border-stroke">
                                    <Plus size={12} />
                                    <span>Archivo</span>
                                </button>
                            </div>
                            
                            <Button
                                size="icon"
                                className={cn(
                                    "w-10 h-10 rounded-xl transition-all duration-500 shadow-lg", 
                                    isStreaming 
                                        ? "bg-status-error hover:bg-status-error/80 text-white animate-pulse" 
                                        : input.trim() 
                                            ? "bg-status-ready hover:bg-status-active text-canvas" 
                                            : "bg-surface-muted text-ink-subtle border border-stroke"
                                )}
                                onClick={isStreaming ? handleStop : handleSend}
                                disabled={!input.trim() && !isStreaming}
                            >
                                {isStreaming ? <Square size={12} fill="currentColor" /> : <ArrowUp size={20} strokeWidth={2.5} />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
