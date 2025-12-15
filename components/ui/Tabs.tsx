import React from 'react';
import { cn } from '../../utils/cn';

interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  value: string;
  onChange: (val: string) => void;
  options: TabOption[];
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  options,
  className
}) => {
  return (
    <div role="tablist" className={cn(
      "flex p-1 bg-surface rounded-base border border-stroke",
      className
    )}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        const isDisabled = opt.disabled || false;

        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${opt.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !isDisabled && onChange(opt.value)}
            disabled={isDisabled}
            onKeyDown={(e) => {
              if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !isDisabled) {
                e.preventDefault();
                const currentIndex = options.findIndex(o => o.value === value);
                const nextIndex = e.key === 'ArrowRight'
                  ? (currentIndex + 1) % options.length
                  : (currentIndex - 1 + options.length) % options.length;
                onChange(options[nextIndex].value);
              }
            }}
            className={cn(
              "flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-medium rounded-base",
              "transition-all duration-normal ease-expo-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              isActive && "bg-ink text-ink-inverted shadow-subtle",
              !isActive && !isDisabled && "text-ink-subtle hover:text-ink hover:bg-surface-elevated",
              isDisabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {opt.icon && <span className="mr-2" aria-hidden="true">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
