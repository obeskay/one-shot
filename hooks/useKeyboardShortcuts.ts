
import { useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';

export const useKeyboardShortcuts = () => {
    const { dispatch } = useStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K to Search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                // Focus search logic would go here via Ref
            }
            // Cmd+J to Toggle Panel (Example)
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);
};
