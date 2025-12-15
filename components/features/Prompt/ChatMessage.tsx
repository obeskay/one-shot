
import React from 'react';
import { ChatMessage as IChatMessage } from '../../../types';
import { cn } from '../../../utils/cn';
import { User, Bot, Terminal, AlertTriangle } from 'lucide-react';
import { Badge } from '../../ui/Badge';

export const ChatMessage: React.FC<{ message: IChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
        "flex gap-4 p-6 border-b border-gray-800/50 animate-in fade-in slide-in-from-bottom-2",
        isUser ? "bg-gray-900/30" : "bg-transparent"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg",
            isUser ? "bg-gray-800 text-gray-300" : "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
        )}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-200">
                {isUser ? 'You' : 'Shotgun AI'}
            </span>
            <span className="text-xs text-gray-600">
                {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {message.isError && <Badge variant="outline"><span className="text-red-400 flex items-center gap-1"><AlertTriangle size={10}/> Error</span></Badge>}
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-gray-300 font-sans">
            {/* Simple split for demonstration. In real app, use ReactMarkdown */}
            {message.content.split('\n').map((line, i) => (
                <p key={i} className="min-h-[1em]">{line}</p>
            ))}
        </div>
      </div>
    </div>
  );
};
