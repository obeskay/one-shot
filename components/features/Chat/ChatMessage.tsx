import React from 'react';
import { ChatMessage as IChatMessage } from '../../../types';
import { cn } from '../../../utils/cn';

export const ChatMessage: React.FC<{ message: IChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
        "flex flex-col gap-2 animate-reveal",
        isUser ? "items-end" : "items-start"
    )}>
        <span className="text-[10px] text-secondary font-mono lowercase mb-1">
            {isUser ? 'user' : 'system'} :: {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
        
        <div className={cn(
            "max-w-[85%] text-sm leading-relaxed font-sans",
            isUser ? "text-primary text-right" : "text-secondary text-left"
        )}>
            {message.content.split('\n').map((line, i) => (
                <p key={i} className="min-h-[1em] mb-1">{line}</p>
            ))}
        </div>
        
        {!isUser && (
            <div className="w-4 h-px bg-border mt-4"></div>
        )}
    </div>
  );
};