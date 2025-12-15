import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Bridge } from '../../services/bridge';
import { Button } from '../ui/Button';
import { Copy, Terminal, Eye, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../../contexts/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';
import { PreviewModal } from '../features/Preview/PreviewModal';

export const ActionDock: React.FC = () => {
    const { state, dispatch } = useStore();
    const { addToast } = useToast();
    const count = state.selectedFileIds.size;
    const [isCopying, setIsCopying] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    if (count === 0) return null;

    const buildPayload = async () => {
        const files: string[] = Array.from(state.selectedFileIds);
        let payload = "";
        const contents = await Promise.all(files.map(async (id: string) => {
            const summary = state.summaries[id];
            if (state.strategy === 'conceptual' && summary) return summary.content;
            return await Bridge.GetFileContent(id);
        }));
        files.forEach((id, idx) => { payload += `\n// FILE: ${id}\n${contents[idx]}\n`; });
        return payload;
    };

    const handleCopy = async () => {
        setIsCopying(true);
        try {
            const payload = await buildPayload();
            await copyToClipboard(payload);
            addToast('success', `Copied ${count} files`);
        } catch (e) {
            addToast('error', 'Failed to copy');
        } finally {
            setTimeout(() => setIsCopying(false), 1000);
        }
    };

    return (
        <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-reveal">
                <div className="glass-panel p-1.5 rounded-full flex items-center gap-2 shadow-2xl">
                    
                    <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-white/10 transition-colors"
                        title="Preview"
                    >
                        <Eye size={18} strokeWidth={1.5} />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1"></div>

                    <Button 
                        variant="primary"
                        onClick={handleCopy}
                        className="rounded-full px-6 h-10 min-w-[140px]"
                        isLoading={isCopying}
                        icon={!isCopying && <Copy size={14} />}
                    >
                        {isCopying ? "Done" : "Copy"}
                        {!isCopying && <span className="ml-2 opacity-50 text-[10px]">{count}</span>}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => dispatch({ type: 'TOGGLE_CHAT', payload: true })}
                        className="rounded-full w-10 h-10 p-0 border-transparent bg-white/5 hover:bg-white/10 text-primary"
                        icon={<Terminal size={16} />}
                    />
                </div>
            </div>

            <PreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                buildPayload={buildPayload} 
            />
        </>
    );
};