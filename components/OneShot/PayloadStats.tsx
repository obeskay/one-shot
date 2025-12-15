import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Zap } from 'lucide-react';
import { formatBytes, cn } from '../../utils/cn';

export const PayloadStats: React.FC = () => {
  const { state } = useStore();
  const files = Array.from(state.selectedFileIds);
  
  const rawSize = files.length * 5000;
  const compressedSize = state.strategy === 'conceptual' ? rawSize * 0.3 : rawSize;
  const savings = rawSize - compressedSize;
  const percentage = Math.round((savings / rawSize) * 100) || 0;

  if (files.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-5 border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="flex justify-between items-end mb-3 relative z-10">
            <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Weight</span>
                <div className="text-2xl font-mono text-white font-bold flex items-baseline gap-2">
                    {formatBytes(compressedSize)}
                    {state.strategy === 'conceptual' && <span className="text-sm text-gray-600 line-through decoration-gray-600">{formatBytes(rawSize)}</span>}
                </div>
            </div>
            {state.strategy === 'conceptual' && (
                <div className="text-right">
                    <span className="flex items-center text-[10px] text-brand-300 font-bold bg-brand-500/10 border border-brand-500/20 px-2 py-1 rounded-full animate-in fade-in">
                        <Zap size={10} className="mr-1 fill-current" />
                        SAVED {percentage}%
                    </span>
                </div>
            )}
        </div>
        
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex relative z-10">
            <div className={cn("h-full transition-all duration-500", state.strategy === 'conceptual' ? "bg-gray-600 w-[30%]" : "bg-accent-500 w-full")}></div>
            {state.strategy === 'conceptual' && (
                 <div className="bg-brand-500/50 h-full w-[70%] animate-pulse"></div>
            )}
        </div>
    </div>
  );
};