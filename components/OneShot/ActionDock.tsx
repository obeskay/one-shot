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
            addToast('success', `${count} archivos copiados`);
        } catch (e) {
            addToast('error', 'Error al copiar');
        } finally {
            setTimeout(() => setIsCopying(false), 1000);
        }
    };

    return (
        <>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                <div className="flex items-center gap-2 px-3 py-2 rounded-pill border border-stroke bg-canvas/90 backdrop-medium shadow-float transition-all duration-slow hover:border-stroke-emphasis hover:shadow-prominent">

                    {/* Preview button */}
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-surface transition-all duration-normal active:scale-95"
                        title="Vista previa"
                        aria-label="Vista previa del payload"
                    >
                        <Eye size={18} strokeWidth={1.5} aria-hidden="true" />
                    </button>

                    <div className="w-px h-5 bg-stroke mx-1" />

                    {/* Copy button */}
                    <Button
                        variant="primary"
                        shape="pill"
                        size="md"
                        onClick={handleCopy}
                        isLoading={isCopying}
                        icon={isCopying ? <Check size={14} /> : <Copy size={14} />}
                        className="min-w-[140px] shadow-base hover:shadow-elevated"
                        aria-label={`Copiar ${count} archivos al portapapeles`}
                    >
                        {isCopying ? 'copiado' : 'copiar contexto'}
                        {!isCopying && (
                            <span className="ml-2 opacity-60 text-micro">{count}</span>
                        )}
                    </Button>

                    <div className="w-px h-5 bg-stroke mx-1" />

                    {/* Chat button */}
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_CHAT', payload: true })}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-surface transition-all duration-normal active:scale-95"
                        aria-label="Abrir chat de IA"
                    >
                        <Terminal size={18} strokeWidth={1.5} />
                    </button>
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
