import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ className, icon, ...props }) => {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-ash group-focus-within:text-ink transition-colors duration-300">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "block w-full bg-transparent border-b border-smoke py-2 text-ink placeholder-ash/50 placeholder:font-light focus:outline-none focus:border-ink transition-all duration-300 font-mono text-sm rounded-none",
          icon ? "pl-8" : "",
          className
        )}
        {...props}
      />
    </div>
  );
};