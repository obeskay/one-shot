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

    const handleClose = () => dispatch({ type: 'TOGGLE_CHAT', payload: false });

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() } as const;
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
        setInput('');
        dispatch({ type: 'SET_CHAT_GENERATING', payload: true });
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { id: 'bot-pending', role: 'assistant', content: '', timestamp: Date.now() } });

        Bridge.StreamChat(
            state.aiConfig, 
            Array.from(state.selectedFileIds), 
            [], 
            (token) => dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: token })
        );

        setTimeout(() => dispatch({ type: 'SET_CHAT_GENERATING', payload: false }), 5000); 
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [state.chatMessages, state.isChatGenerating]);

    if (!state.isChatOpen) return null;

    return (
        <div className="absolute inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
            
            <div className="w-full max-w-[600px] h-full bg-background border-l border-border shadow-2xl flex flex-col animate-reveal relative z-10">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-primary" />
                        <div>
                            <h3 className="text-sm font-medium text-primary lowercase">assistant_process</h3>
                            <p className="text-[10px] text-secondary font-mono">ctx: {state.selectedFileIds.size} files</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-secondary hover:text-red-400 transition-colors" title="Clear">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={handleClose} className="text-secondary hover:text-primary transition-colors">
                            <X size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8" ref={scrollRef}>
                    {state.chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Bot size={32} className="mb-4 text-secondary" strokeWidth={1} />
                            <p className="text-sm font-light lowercase">ready for inquiry.</p>
                        </div>
                    ) : (
                        state.chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)
                    )}
                </div>

                <div className="p-6 border-t border-border bg-background">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="command input..."
                            className="w-full bg-surface/50 border border-border rounded-sm p-4 pr-14 text-sm text-primary focus:border-primary outline-none resize-none h-16 transition-colors font-mono placeholder-zinc-700"
                        />
                        <button 
                            onClick={state.isChatGenerating ? undefined : handleSend}
                            className={cn(
                                "absolute bottom-4 right-4 p-2 text-secondary hover:text-primary transition-colors",
                                state.isChatGenerating && "animate-pulse text-accent"
                            )}
                        >
                            {state.isChatGenerating ? <StopCircle size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};