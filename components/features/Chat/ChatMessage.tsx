import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as IChatMessage } from '../../../types';
import { cn } from '../../../utils/cn';
import { User, Bot, Sparkles, Terminal } from 'lucide-react';

interface ChatMessageProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex w-full group/msg",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex gap-4 max-w-[90%] md:max-w-2xl",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar Area */}
        <div className="shrink-0 pt-1">
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500",
                isUser 
                    ? "bg-surface-elevated border-stroke shadow-sm" 
                    : "bg-status-ready/10 border-status-ready/20 text-status-ready shadow-glow-subtle"
            )}>
                {isUser ? <User size={14} className="text-ink-muted" /> : <Bot size={14} />}
            </div>
        </div>

        {/* Content Area */}
        <div className={cn(
            "flex flex-col gap-1.5",
            isUser ? "items-end" : "items-start"
        )}>
            {/* Metadata */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-mono tracking-wider text-ink-subtle uppercase opacity-50">
                    {isUser ? 'Usuario' : 'One-Shot AI'}
                </span>
                <span className="w-1 h-1 rounded-full bg-stroke" />
                <span className="text-[10px] font-mono text-ink-subtle opacity-40">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Bubble */}
            <div className={cn(
                "rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed transition-all duration-500",
                isUser 
                    ? "bg-surface-elevated border border-stroke text-ink" 
                    : "bg-surface/30 border border-stroke/50 text-ink-muted group-hover/msg:border-stroke group-hover/msg:bg-surface/50"
            )}>
                <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-surface-muted/50 prose-pre:border prose-pre:border-stroke hover:prose-pre:border-stroke-emphasis transition-colors">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content || (isStreaming ? '' : '...')}
                    </ReactMarkdown>
                </div>

                {/* Cursor & Streaming Status */}
                {isStreaming && (
                    <div className="flex items-center gap-2 mt-4 text-status-ready animate-reveal">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-glow" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Procesando</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};