import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onCopy?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (options?: KeyboardShortcutsOptions) => {
    const handleCopy = useCallback(() => {
        options?.onCopy?.();
    }, [options]);

    const handleEscape = useCallback(() => {
        options?.onEscape?.();
    }, [options]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable;

            // Cmd/Ctrl+Enter: copiar todo el contexto
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleCopy();
                return;
            }

            if (e.key === 'Escape' && !isTyping) {
                handleEscape();
                return;
            }

            // Cmd/Ctrl+K: enfocar el filtro de archivos
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement | null;
                searchInput?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCopy, handleEscape]);
};
