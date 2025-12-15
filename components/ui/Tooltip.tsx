import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  delay = 300,
  className,
  disabled = false
}) => {
  const [visible, setVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<TooltipPosition>(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible && position === 'auto' && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Determinar la mejor posición
      const spaceTop = containerRect.top;
      const spaceBottom = viewportHeight - containerRect.bottom;
      const spaceLeft = containerRect.left;
      const spaceRight = viewportWidth - containerRect.right;

      if (spaceTop > tooltipRect.height + 10) {
        setActualPosition('top');
      } else if (spaceBottom > tooltipRect.height + 10) {
        setActualPosition('bottom');
      } else if (spaceRight > tooltipRect.width + 10) {
        setActualPosition('right');
      } else if (spaceLeft > tooltipRect.width + 10) {
        setActualPosition('left');
      } else {
        setActualPosition('top');
      }
    } else if (position !== 'auto') {
      setActualPosition(position);
    }
  }, [visible, position]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    auto: "bottom-full left-1/2 -translate-x-1/2 mb-2"
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && !disabled && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            "absolute z-50 px-3 py-1.5 whitespace-nowrap",
            "bg-dark-surface border border-stroke-dark text-ink-inverted text-[10px] font-medium tracking-wide",
            "shadow-elevated rounded-base pointer-events-none",
            "animate-fade-in",
            positionClasses[actualPosition],
            className
          )}
        >
          {text}
        </div>
      )}
    </div>
  );
};
