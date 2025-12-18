import React, { useMemo, useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { ModelSelector } from './ModelSelector';
import { Send, Sparkles, Paperclip, Zap, ArrowUp } from 'lucide-react';
import { Button } from '../../ui/Button';
import { estimateTokens, formatNumber, cn } from '../../../utils/cn';
import { findNodeById } from '../../../utils/tree-utils';
import { Bridge } from '../../../services/bridge';
import { useToast } from '../../../contexts/ToastContext';

export const PromptView: React.FC = () => {
    const { state } = useStore();
    const { addToast } = useToast();
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const project = state.projectPath?.split('/').pop() || 'sin proyecto';

    // Context Stats
    const selectedFiles = useMemo(() => Array.from(state.selectedFileIds), [state.selectedFileIds]);
    const { totalTokens } = useMemo(() => {
        if (!state.tree?.root) return { totalSize: 0, totalTokens: 0 };
        let size = 0;
        for (const id of selectedFiles) {
            const node = findNodeById(state.tree.root, id);
            if (node && !node.isDir) size += node.size;
        }
        return { totalSize: size, totalTokens: estimateTokens(size) };
    }, [selectedFiles, state.tree]);

    const budgetLimit = state.budgetTokens;
    const isOverBudget = totalTokens > budgetLimit;

    const handleSend = async () => {
        if (!input.trim()) return;
        if (selectedFiles.length === 0) {
             addToast('error', 'Selecciona archivos primero');
             return;
        }

        setIsGenerating(true);
        try {
            let contextPayload = '';
            for (const id of selectedFiles) {
                const content = await Bridge.GetFileContent(id);
                contextPayload += `<file path="${id}">
${content}
</file>

`;
            }

            const systemPrompt = `Eres un asistente experto.
CONTEXTO:
${contextPayload}`;

            const fullPrompt = `${state.intent ? `OBJETIVO GLOBAL: ${state.intent}\n\n` : ''}SOLICITUD: ${input}`;

            await navigator.clipboard.writeText(`${systemPrompt}\n\n${fullPrompt}`);
            addToast('success', 'Prompt copiado al portapapeles');
        } catch (error) {
            addToast('error', 'Error al generar');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-canvas relative font-sans text-ink selection:bg-status-ready selection:text-black">
            
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="uppercase tracking-[0.2em] text-[10px] text-ink-disabled font-medium pointer-events-auto">
                    {project}
                </div>
                {/* Stats Minimal */}
                <div className={cn(
                    "flex flex-col items-end pointer-events-auto transition-opacity duration-300",
                    isOverBudget ? "text-status-error" : "text-ink-disabled"
                )}>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <Zap size={10} fill="currentColor" />
                        <span>{formatNumber(totalTokens)}</span>
                        <span className="opacity-50">/ {(budgetLimit/1000).toFixed(0)}k</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8 animate-reveal">
                    
                    {/* Welcome / Empty State */}
                    <div className="text-center space-y-4 mb-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-white/5 shadow-glow mb-4">
                            <Sparkles size={20} className="text-status-ready" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-light tracking-tight text-ink">
                            ¿Qué quieres construir hoy?
                        </h2>
                    </div>

                    {/* The Omnibar */}
                    <div className="relative group w-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-status-ready/20 via-primary/20 to-status-ready/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl" />
                        
                        <div className="relative bg-surface-elevated/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 focus-within:border-white/10 focus-within:ring-1 focus-within:ring-white/5">
                            
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Describe tu tarea..."
                                className="w-full bg-transparent border-none text-base text-ink placeholder:text-ink-subtle/30 px-5 py-4 min-h-[60px] max-h-[300px] resize-none focus:ring-0 scrollbar-hidden leading-relaxed"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            {/* Omnibar Footer */}
                            <div className="px-3 pb-3 pt-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ModelSelector />
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="h-4 w-px bg-white/5 mx-1" />
                                    )}
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-ink-subtle hover:text-ink transition-colors cursor-default">
                                            <Paperclip size={10} />
                                            <span>{selectedFiles.length} <span className="hidden sm:inline">archivos</span></span>
                                        </div>
                                    )}
                                </div>

                                <Button 
                                    className="rounded-xl w-8 h-8 p-0 flex items-center justify-center bg-ink text-canvas hover:bg-white transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                                    disabled={!input.trim() || isGenerating}
                                    onClick={handleSend}
                                    isLoading={isGenerating}
                                >
                                    <ArrowUp size={16} strokeWidth={2.5} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-wrap justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-500">
                        {['Explicar código', 'Refactorizar', 'Generar tests', 'Buscar bugs'].map(s => (
                            <button 
                                key={s}
                                onClick={() => setInput(s)}
                                className="px-3 py-1.5 text-xs text-ink-subtle border border-transparent hover:border-white/10 hover:bg-white/5 rounded-full transition-all"
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};