import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { Bridge } from '../../../services/bridge';
import { X, ArrowRight, Bot, Terminal, StopCircle, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { cn } from '../../../utils/cn';

export const ChatOverlay: React.FC = () => {
    const { state, dispatch } = useStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const streamControlRef = useRef<{ stop: () => void } | null>(null);

    const handleClose = () => dispatch({ type: 'TOGGLE_CHAT', payload: false });

    const handleClear = () => {
        if (window.confirm('¿Limpiar todo el historial de chat?')) {
            dispatch({ type: 'CLEAR_CHAT' });
        }
    };

    const handleStop = () => {
        if (streamControlRef.current) {
            streamControlRef.current.stop();
            streamControlRef.current = null;
        }
        setIsStreaming(false);
        dispatch({ type: 'SET_CHAT_GENERATING', payload: false });
    };

    const handleSend = () => {
        if (!input.trim() || state.isChatGenerating) return;

        const userMsg = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: input,
            timestamp: Date.now()
        };

        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
        setInput('');

        const assistantMsg = {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content: '',
            timestamp: Date.now()
        };

        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMsg });
        dispatch({ type: 'SET_CHAT_GENERATING', payload: true });
        setIsStreaming(true);

        const streamControl = Bridge.StreamChat(
            state.aiConfig,
            Array.from(state.selectedFileIds),
            [],
            (token) => dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: token }),
            () => {
                setIsStreaming(false);
                dispatch({ type: 'SET_CHAT_GENERATING', payload: false });
            },
            (error) => {
                setIsStreaming(false);
                dispatch({ type: 'SET_CHAT_GENERATING', payload: false });
                dispatch({
                    type: 'ADD_CHAT_MESSAGE',
                    payload: {
                        id: crypto.randomUUID(),
                        role: 'assistant' as const,
                        content: `Error: ${error}`,
                        timestamp: Date.now(),
                        isError: true
                    }
                });
            }
        );

        streamControlRef.current = streamControl;
    };

    useEffect(() => {
        return () => {
            if (streamControlRef.current) {
                streamControlRef.current.stop();
                streamControlRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.chatMessages, isStreaming]);

    if (!state.isChatOpen) return null;

    return (
        <div className="absolute inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-canvas/60 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
            
            <div
                className="w-full max-w-[600px] h-full bg-canvas border-l border-smoke shadow-2xl flex flex-col relative z-10"
                style={{
                    animation: 'slideInRight 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-light shrink-0">
                    <div className="flex items-center gap-4">
                        <Terminal size={18} className="text-ink" />
                        <div>
                            <h3 className="text-xl font-semibold text-ink lowercase tracking-tight">Chat AI</h3>
                            <p className="text-[10px] text-ash font-mono uppercase tracking-widest mt-1">
                                Contexto: {state.selectedFileIds.size} archivos
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleClear}
                            className="text-ash hover:text-red-500 transition-colors"
                            title="Limpiar chat"
                            disabled={state.chatMessages.length === 0}
                        >
                            <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-ash hover:text-ink transition-colors hover:rotate-90 duration-500"
                            title="Cerrar"
                        >
                            <X size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8"
                    ref={scrollRef}
                >
                    {state.chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Bot size={48} className="mb-6 text-ash" strokeWidth={1} />
                            <p className="text-lg font-light lowercase text-ink tracking-tight">
                                Comienza una conversación
                            </p>
                            <p className="text-xs text-ash font-mono uppercase tracking-widest mt-4">
                                Selecciona archivos para dar contexto
                            </p>
                        </div>
                    ) : (
                        state.chatMessages.map((msg, idx) => (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                isStreaming={
                                    isStreaming &&
                                    idx === state.chatMessages.length - 1 &&
                                    msg.role === 'assistant'
                                }
                            />
                        ))
                    )}

                    {state.isChatGenerating && state.chatMessages.length > 0 && (
                        <div className="flex items-center gap-2 text-ash/60 text-[10px] font-mono uppercase tracking-widest animate-pulse ml-2">
                            <Bot size={12} />
                            <span>thinking...</span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-8 border-t border-light bg-canvas/50 backdrop-blur-md shrink-0">
                    <div className="relative group">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Escribe tu mensaje..."
                            disabled={state.isChatGenerating}
                            className={cn(
                                "w-full bg-transparent border-b border-light p-2 pr-14",
                                "text-base text-ink focus:border-ink outline-none resize-none h-16",
                                "transition-all duration-500 font-sans placeholder:text-smoke placeholder:font-light",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        />
                        <button
                            onClick={state.isChatGenerating ? handleStop : handleSend}
                            disabled={!state.isChatGenerating && !input.trim()}
                            className={cn(
                                "absolute bottom-4 right-2 p-2 transition-all duration-300 rounded-full hover:bg-smoke/30",
                                "disabled:opacity-30 disabled:cursor-not-allowed",
                                state.isChatGenerating
                                    ? "text-red-400 hover:text-red-500 animate-pulse"
                                    : "text-ash hover:text-ink"
                            )}
                        >
                            {state.isChatGenerating ? (
                                <StopCircle size={24} strokeWidth={1} />
                            ) : (
                                <ArrowRight size={24} strokeWidth={1} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};