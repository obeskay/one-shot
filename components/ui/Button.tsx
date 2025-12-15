import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', isLoading, icon, className = '', ...props 
}) => {
  
  const variants = {
    primary: "bg-primary text-black hover:bg-white/90 border border-transparent",
    secondary: "bg-surface text-primary border border-border hover:border-secondary",
    outline: "bg-transparent text-primary border border-border hover:bg-white/5",
    ghost: "bg-transparent text-secondary hover:text-primary",
    danger: "bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/30",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2 text-xs uppercase tracking-wider font-medium",
    lg: "px-6 py-3 text-sm uppercase tracking-widest font-medium",
    icon: "p-2 aspect-square flex items-center justify-center",
  };

  return (
    <button 
      className={cn(
        "relative inline-flex items-center justify-center rounded-sm transition-all duration-200 ease-expo focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
          <Loader2 className="animate-spin mr-2 h-3 w-3" />
      ) : icon ? (
          <span className={cn(children ? "mr-2" : "")}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};