import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { FileCode, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StrategySelector: React.FC = () => {
  const { state, dispatch } = useStore();

  const strategies = [
    {
      id: 'files' as const,
      label: 'archivos raw',
      desc: 'contexto completo sin procesar',
      icon: <FileCode size={18} strokeWidth={1.5} />
    },
    {
      id: 'conceptual' as const,
      label: 'resumen ia',
      desc: 'resúmenes conceptuales (ahorra tokens)',
      icon: <Sparkles size={18} strokeWidth={1.5} />
    }
  ];

  return (
    <div>
      <label className="text-micro text-ink-subtle uppercase tracking-widest block mb-4 font-mono">
        estrategia de contexto
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s) => {
          const isActive = state.strategy === s.id;
          return (
            <button
              key={s.id}
              onClick={() => dispatch({ type: 'SET_STRATEGY', payload: s.id })}
              className={cn(
                'relative flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-normal group',
                isActive
                  ? 'bg-ink border-ink text-ink-inverted shadow-elevated'
                  : 'bg-transparent border-stroke text-ink-muted hover:border-stroke-emphasis hover:bg-surface/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-normal',
                isActive
                  ? 'bg-ink-inverted/20 text-ink-inverted'
                  : 'bg-surface text-ink-subtle group-hover:text-ink'
              )}>
                {s.icon}
              </div>
              <div className="flex-1">
                <div className={cn(
                  'text-micro font-semibold uppercase tracking-widest mb-1 transition-colors',
                  isActive ? 'text-ink-inverted' : 'text-ink'
                )}>
                  {s.label}
                </div>
                <div className={cn(
                  'text-xs font-light leading-snug lowercase',
                  isActive ? 'text-ink-inverted/70' : 'text-ink-subtle'
                )}>
                  {s.desc}
                </div>
              </div>

              {isActive && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-status-ready shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
