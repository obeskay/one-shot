import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ className, icon, ...props }) => {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-subtle group-focus-within:text-ink transition-colors duration-300">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "block w-full bg-surface-elevated/50 border border-stroke rounded-lg py-2.5 text-ink placeholder:text-ink-subtle/50 font-sans text-sm transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-status-ready/20 focus:border-status-ready/50 focus:bg-surface-elevated",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          icon ? "pl-9" : "px-3",
          className
        )}
        {...props}
      />
    </div>
  );
};