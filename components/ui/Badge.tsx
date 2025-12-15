import React from 'react';
import { cn } from '../../utils/cn';

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'default' | 'outline' | 'brand' | 'accent', className?: string }> = ({ 
  children, variant = 'default', className 
}) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-mono lowercase tracking-wide border rounded-full",
      variant === 'default' && "bg-surface text-secondary border-border",
      variant === 'outline' && "bg-transparent text-secondary border-border",
      variant === 'brand' && "bg-white text-black border-transparent",
      variant === 'accent' && "bg-accent/10 text-accent border-accent/20",
      className
    )}>
      {children}
    </span>
  );
};