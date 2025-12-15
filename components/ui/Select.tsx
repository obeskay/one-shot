import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  className,
  containerClassName,
  children,
  disabled,
  ...props
}) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <select
        className={cn(
          "appearance-none w-full bg-transparent border-b text-ink py-2 pr-8 text-xs font-mono uppercase",
          "transition-all duration-normal cursor-pointer rounded-none",
          "focus:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          disabled
            ? "border-stroke"
            : "border-stroke hover:border-stroke-emphasis",
          className
        )}
        disabled={disabled}
        aria-expanded="false"
        {...props}
      >
        {children}
      </select>
      <div className={cn(
        "absolute inset-y-0 right-0 flex items-center pointer-events-none transition-colors duration-normal",
        disabled ? "text-ink-muted" : "text-ink-subtle"
      )} aria-hidden="true">
        <ChevronDown size={12} />
      </div>
    </div>
  );
};
