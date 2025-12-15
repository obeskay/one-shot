import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({ className, containerClassName, children, ...props }) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <select
        className={cn(
          "appearance-none w-full bg-transparent border-b border-border text-primary py-2 pr-8 text-xs font-mono uppercase focus:outline-none focus:border-primary transition-colors cursor-pointer rounded-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none text-secondary">
        <ChevronDown size={12} />
      </div>
    </div>
  );
};