import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if(e.key === 'Escape') onClose(); };
    if(isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      window.addEventListener('keydown', handleEsc);

      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (!isOpen && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-reveal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
    >
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm transition-all duration-slow" />
      <div
        ref={modalRef}
        className={cn(
            "relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-canvas border border-stroke shadow-prominent rounded-large",
            "animate-slide-up"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-stroke">
          <h3 id={titleId.current} className="text-lg font-medium tracking-tight lowercase text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors duration-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-base p-1"
            aria-label="cerrar modal"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
