import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className
}) => {
  return (
    <label className={cn(
      "flex items-center gap-3 group",
      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      className
    )}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
        />
        <div className={cn(
          "w-9 h-5 rounded-full transition-all duration-normal ease-expo-out border",
          disabled
            ? "border-stroke bg-transparent"
            : checked
              ? "bg-ink border-ink"
              : "bg-transparent border-stroke group-hover:border-stroke-emphasis"
        )}></div>
        <div className={cn(
          "absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-normal ease-expo-out",
          disabled
            ? "bg-ink-muted"
            : checked
              ? "transform translate-x-4 bg-ink-inverted"
              : "bg-ink-subtle"
        )}></div>
      </div>
      {label && (
        <span className={cn(
          "text-xs font-medium lowercase transition-colors duration-normal",
          disabled
            ? "text-ink-muted"
            : "text-ink-subtle group-hover:text-ink"
        )}>
          {label}
        </span>
      )}
    </label>
  );
};
