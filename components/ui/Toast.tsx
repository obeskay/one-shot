import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  return (
    <div className={cn(
      "flex items-center justify-between w-80 p-4 border pointer-events-auto animate-reveal backdrop-blur-md",
      type === 'success' && "bg-background/90 border-primary/20",
      type === 'error' && "bg-background/90 border-red-500/20",
      type === 'info' && "bg-background/90 border-border"
    )}>
      <div className="flex items-center gap-3">
          <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              type === 'success' && "bg-green-500",
              type === 'error' && "bg-red-500",
              type === 'info' && "bg-blue-500"
          )} />
          <span className="text-xs font-mono text-primary lowercase">{message}</span>
      </div>
      <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
        <X size={12} />
      </button>
    </div>
  );
};