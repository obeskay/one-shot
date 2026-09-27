import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 5000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  return (
    <div className={cn(
      "relative flex flex-col w-80 overflow-hidden border pointer-events-auto backdrop-blur-md rounded-sm",
      type === 'success' && "bg-surface-elevated/90 border-status-ready/30",
      type === 'error' && "bg-surface-elevated/90 border-red-500/20",
      type === 'info' && "bg-surface-elevated/90 border-stroke"
    )}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            type === 'success' && "bg-green-500",
            type === 'error' && "bg-red-500",
            type === 'info' && "bg-blue-500"
          )} />
          <span className="text-xs font-mono text-ink lowercase">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink transition-colors duration-150 hover:scale-110 active:scale-95"
        >
          <X size={12} />
        </button>
      </div>
      <div className="h-0.5 bg-stroke">
        <div
          className={cn(
            "h-full transition-all duration-75 ease-linear",
            type === 'success' && "bg-green-500",
            type === 'error' && "bg-red-500",
            type === 'info' && "bg-blue-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};