import { useEffect, useCallback } from 'react';
import { useStore } from '../contexts/StoreContext';

interface KeyboardShortcutsOptions {
  onGenerate?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = (options?: KeyboardShortcutsOptions) => {
    const { dispatch } = useStore();

    const handleGenerate = useCallback(() => {
        if (options?.onGenerate) {
            options.onGenerate();
        }
    }, [options]);

    const handleEscape = useCallback(() => {
        if (options?.onEscape) {
            options.onEscape();
        }
    }, [options]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar eventos cuando estamos escribiendo en un input/textarea
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                            target.tagName === 'TEXTAREA' ||
                            target.isContentEditable;

            // Cmd/Ctrl+Enter para generar One-Shot
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
                return;
            }

            // Escape para cerrar modales/paneles (solo cuando no estamos escribiendo)
            if (e.key === 'Escape' && !isTyping) {
                handleEscape();
                return;
            }

            // Cmd+K para buscar - focus en input de búsqueda
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Cmd+J para toggle de panel
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_CHAT', payload: true });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, handleGenerate, handleEscape]);
};
