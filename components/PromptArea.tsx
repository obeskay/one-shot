import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Button } from './ui/Button';
import { Bridge } from '../services/bridge';
import { PromptRunResult } from '../types';
import { Play, StopCircle, Cpu } from 'lucide-react';

export const PromptArea: React.FC = () => {
    const { state } = useStore();
    const [prompt, setPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<PromptRunResult | null>(null);

    const selectedCount = state.selectedFileIds.size;

    const handleRun = async () => {
        if (!prompt.trim()) return;
        
        setIsRunning(true);
        setResult(null);

        try {
            const res = await Bridge.RunPrompt({
                provider: 'openai',
                model: 'gpt-4o',
                system: 'You are a coding assistant.',
                userPrompt: prompt,
                contextFiles: Array.from(state.selectedFileIds)
            });
            setResult(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header / Config */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Cpu size={16} />
                    <span>Model:</span>
                    <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                        <option>gpt-4o</option>
                        <option>gemini-1.5-pro</option>
                        <option>claude-3-opus</option>
                    </select>
                </div>
                <div className="text-xs font-mono text-gray-500">
                    Context: {selectedCount} files
                </div>
            </div>

            {/* Chat Output Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {result ? (
                    <div className="space-y-2">
                         <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                             <span className="font-mono">ID: {result.id}</span>
                             <span>{result.duration}ms</span>
                         </div>
                         <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-300">
                             {result.content}
                         </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                        <Cpu size={48} />
                        <p>Ready to generate. Select files and type a prompt.</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-800/30">
                <div className="relative">
                    <textarea
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-4 pr-32 text-gray-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none resize-none font-mono text-sm shadow-inner"
                        rows={4}
                        placeholder="Ask about your code (Cmd+Enter to run)..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRun();
                        }}
                    />
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                        {isRunning ? (
                            <Button variant="danger" size="sm" onClick={() => setIsRunning(false)}>
                                <StopCircle size={14} className="mr-1" /> Stop
                            </Button>
                        ) : (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleRun}
                                disabled={selectedCount === 0 || !prompt}
                            >
                                <Play size={14} className="mr-1" /> Run
                            </Button>
                        )}
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 flex justify-between">
                    <span>Includes {selectedCount} files in context window</span>
                    <span>Markdown supported</span>
                </div>
            </div>
        </div>
    );
};