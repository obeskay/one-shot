import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "bg-surface/20 border border-white/5 p-6 rounded-sm transition-all duration-500 ease-expo",
            onClick && "cursor-pointer hover:bg-surface/50 hover:border-white/10",
            className
        )}
    >
      {children}
    </div>
  );
};