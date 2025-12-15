import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ className, icon, ...props }) => {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "block w-full bg-transparent border-b border-border py-2 text-primary placeholder-zinc-700 focus:outline-none focus:border-primary transition-colors font-mono text-sm rounded-none",
          icon ? "pl-6" : "",
          className
        )}
        {...props}
      />
    </div>
  );
};