import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'brand' | 'accent' | 'danger';
  className?: string;
  hoverable?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  hoverable = false
}) => {
  const variants = {
    default: "bg-surface text-ink-subtle border-stroke",
    outline: "bg-transparent text-ink-subtle border-stroke",
    brand: "bg-ink text-ink-inverted border-transparent",
    accent: "bg-status-active/10 text-status-active border-status-active/20",
    danger: "bg-status-error/10 text-status-error border-status-error/20"
  };

  const hoverVariants = {
    default: "hover:bg-surface-elevated hover:border-stroke-emphasis",
    outline: "hover:bg-surface hover:border-stroke-emphasis",
    brand: "hover:bg-ink/90",
    accent: "hover:bg-status-active/20 hover:border-status-active/30",
    danger: "hover:bg-status-error/20 hover:border-status-error/30"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-mono lowercase tracking-wide border rounded-full",
      "transition-all duration-200 ease-out",
      variants[variant],
      hoverable && hoverVariants[variant],
      className
    )}>
      {children}
    </span>
  );
};
