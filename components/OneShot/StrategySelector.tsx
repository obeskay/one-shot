import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../utils/cn';

export const StrategySelector: React.FC = () => {
  const { state, dispatch } = useStore();

  const Option = ({ id, label, desc }: { id: 'precise' | 'conceptual', label: string, desc: string }) => (
      <div 
        onClick={() => dispatch({ type: 'SET_STRATEGY', payload: id })}
        className={cn(
            "cursor-pointer p-6 rounded-sm border transition-all duration-300 ease-expo group",
            state.strategy === id 
                ? "border-primary bg-white/5" 
                : "border-border hover:border-white/20"
        )}
      >
        <div className="flex justify-between items-start mb-4">
            <span className={cn(
                "text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border",
                state.strategy === id ? "border-primary text-primary" : "border-border text-secondary"
            )}>
                {id}
            </span>
            <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                state.strategy === id ? "bg-primary" : "bg-border"
            )} />
        </div>
        <h3 className="text-lg font-medium lowercase mb-1 text-primary">{label}</h3>
        <p className="text-xs text-secondary leading-relaxed max-w-[90%]">{desc}</p>
      </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Option 
        id="precise" 
        label="Exact Copy" 
        desc="Raw content preservation. Best for debugging, patching, and syntax-sensitive tasks." 
      />
      <Option 
        id="conceptual" 
        label="AI Summary" 
        desc="Distilled logic via Gemini. Best for high-level architecture queries and large codebases." 
      />
    </div>
  );
};