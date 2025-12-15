import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

type CardVariant = 'default' | 'organic' | 'elevated' | 'ghost';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  focusable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: 'bg-surface border border-stroke rounded-medium',
  organic: 'bg-surface border border-stroke rounded-organic-card',
  elevated: 'bg-surface-elevated border border-stroke rounded-large shadow-base',
  ghost: 'bg-transparent border border-stroke-subtle rounded-medium',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable,
  focusable = false,
  selectable = false,
  selected = false,
  variant = 'default',
  ...props
}) => {
  const isInteractive = onClick !== undefined || hoverable;

  return (
    <div
      onClick={onClick}
      tabIndex={focusable || isInteractive ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      className={cn(
        'relative p-6 transition-all duration-normal ease-expo-out',
        variants[variant],
        isInteractive && [
          'cursor-pointer',
          'hover:border-stroke-emphasis hover:shadow-elevated hover:scale-[1.01]',
          'active:scale-[0.98]',
        ],
        focusable && [
          'focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        ],
        selectable && selected && 'border-ink bg-surface-muted',
        className
      )}
      {...props}
    >
      {selectable && selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ink flex items-center justify-center animate-fade-in">
          <Check className="w-3 h-3 text-ink-inverted" strokeWidth={3} />
        </div>
      )}
      {children}
    </div>
  );
};
