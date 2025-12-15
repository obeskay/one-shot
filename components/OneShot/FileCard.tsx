import React, { useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Bridge } from '../../services/bridge';
import { Loader2, X, Sparkles } from 'lucide-react';
import { cn, formatBytes } from '../../utils/cn';

interface FileCardProps { fileId: string; }

export const FileCard: React.FC<FileCardProps> = ({ fileId }) => {
    const { state, dispatch } = useStore();
    const isSummarizing = state.processingFiles.has(fileId);
    const summary = state.summaries[fileId];
    const needsSummary = state.strategy === 'conceptual' && !summary && !isSummarizing;

    useEffect(() => {
        if (needsSummary) {
            dispatch({ type: 'SET_PROCESSING', payload: { id: fileId, processing: true } });
            Bridge.SummarizeFile(fileId, "raw").then(res => {
                dispatch({ type: 'CACHE_SUMMARY', payload: res });
                dispatch({ type: 'SET_PROCESSING', payload: { id: fileId, processing: false } });
            });
        }
    }, [needsSummary, fileId, dispatch]);

    return (
        <div className="group relative flex items-center justify-between p-3 border border-border bg-surface/30 rounded-sm hover:border-secondary transition-colors animate-fade-in">
            <div className="flex items-center min-w-0 gap-3">
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono text-primary truncate pr-4">{fileId.split('/').pop()}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-secondary truncate max-w-[100px] opacity-60">{fileId}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isSummarizing ? (
                    <Loader2 size={12} className="animate-spin text-secondary" />
                ) : (state.strategy === 'conceptual' && summary) && (
                    <div className="flex items-center gap-1 text-[10px] text-accent font-mono">
                        <Sparkles size={10} />
                        {formatBytes(summary.summarySize)}
                    </div>
                )}
                
                <button 
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_SELECT', payload: fileId }); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-red-400 transition-all"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};