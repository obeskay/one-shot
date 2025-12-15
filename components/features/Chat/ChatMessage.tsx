import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as IChatMessage } from '../../../types';
import { cn } from '../../../utils/cn';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      {/* Avatar */}
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
        isUser
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-surface border-border"
      )}>
        {isUser ? (
          <User size={16} className="text-blue-400" />
        ) : (
          <Bot size={16} className="text-secondary" />
        )}
      </div>

      {/* Content Bubble */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Timestamp */}
        <span className="text-[10px] text-secondary font-mono lowercase px-1">
          {isUser ? 'usuario' : 'asistente'} :: {new Date(message.timestamp).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}
        </span>

        {/* Message Bubble */}
        <div className={cn(
          "rounded-lg px-4 py-3 text-sm leading-relaxed",
          "prose prose-invert prose-sm max-w-none",
          "prose-pre:bg-black/50 prose-pre:border prose-pre:border-border",
          "prose-code:text-accent prose-code:bg-surface/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          isUser
            ? "bg-blue-500/10 border border-blue-500/30 text-primary ml-auto max-w-[85%]"
            : "bg-surface/50 border border-border text-secondary max-w-[90%]"
        )}>
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const hasLanguage = /language-(\w+)/.test(className || '');
                  const isInline = !hasLanguage && typeof children === 'string' && !children.includes('\n');

                  if (isInline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <pre className={cn("rounded p-2 overflow-x-auto", className)}>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="text-secondary/50 italic">...</span>
          )}

          {/* Streaming Cursor */}
          {isStreaming && !isUser && (
            <span
              className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse"
              style={{
                animation: 'blink 1s infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};