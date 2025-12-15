import React from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { ModelSelector } from './ModelSelector';
import { Button } from '../../ui/Button';

export const PromptView: React.FC = () => {
    const { state } = useStore();
    return (
        <div className="flex flex-col h-full bg-background animate-reveal">
            <div className="p-8 border-b border-border flex justify-between items-center">
                <h2 className="text-2xl font-light lowercase text-primary">LLM Interface</h2>
                <ModelSelector />
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-50">
                <span className="text-xs font-mono lowercase">Select 'Prompt' in sidebar or use the dock.</span>
            </div>
        </div>
    );
};