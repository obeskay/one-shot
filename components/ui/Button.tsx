import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type ButtonShape = 'default' | 'pill';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  isLoading?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-status-ready text-canvas border border-transparent',
    'hover:bg-status-active hover:shadow-glow',
    'active:scale-[0.98]',
    'shadow-sm'
  ),
  secondary: cn(
    'bg-surface-elevated text-ink border border-stroke',
    'hover:border-stroke-emphasis hover:bg-surface-elevated/80',
    'active:scale-[0.98]'
  ),
  ghost: cn(
    'bg-transparent text-ink-muted',
    'hover:text-ink hover:bg-surface-elevated/50',
    'active:scale-[0.98]'
  ),
  danger: cn(
    'bg-status-error/10 text-status-error border border-status-error/20',
    'hover:bg-status-error/20 hover:border-status-error/30',
    'active:scale-[0.98]'
  ),
  outline: cn(
    'bg-transparent text-ink border border-stroke',
    'hover:border-stroke-emphasis hover:bg-surface-elevated/50',
    'active:scale-[0.98]'
  ),
  link: cn(
    'bg-transparent text-ink border-b border-stroke pb-0.5 rounded-none',
    'hover:border-ink',
    'px-0 py-0'
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-micro',
  md: 'px-5 py-2.5 text-micro uppercase tracking-widest font-medium',
  lg: 'px-8 py-3.5 text-xs uppercase tracking-widest font-semibold',
  icon: 'p-2.5 aspect-square',
};

const shapes: Record<ButtonShape, string> = {
  default: 'rounded-base',
  pill: 'rounded-pill',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  isLoading,
  icon,
  className,
  disabled,
  ariaLabel,
  ...props
}) => {
  const isDisabled = isLoading || disabled;

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        'transition-all duration-normal ease-expo-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'font-mono',
        variants[variant],
        variant !== 'link' && sizes[size],
        variant !== 'link' && shapes[shape],
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel || (size === 'icon' && !children ? 'Botón' : undefined)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />
      ) : (
        <>
          {icon && (
            <span className={cn(children ? 'mr-2' : '')} aria-hidden="true">
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
};
