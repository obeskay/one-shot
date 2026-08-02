import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { usePayload } from '../../hooks/usePayload';
import { ArrowUpRight, Box } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = useStore();
  const { openProject } = usePayload();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-canvas relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-status-ready/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Espacio para los controles de ventana en macOS */}
      <div className="h-12 w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 z-10 max-w-4xl mx-auto w-full text-center">
        <div className="relative mb-8 animate-reveal">
          <div className="absolute inset-0 bg-status-ready/30 blur-[40px] rounded-3xl scale-125 opacity-60" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-surface-elevated/80 border border-stroke-emphasis flex items-center justify-center shadow-glow backdrop-blur-2xl group hover:border-status-ready/60 hover:scale-105 transition-all duration-500">
            <Box size={44} className="text-status-ready group-hover:rotate-6 transition-transform duration-500" strokeWidth={1.5} />
          </div>
        </div>

        <div className="animate-reveal delay-100 flex flex-col items-center max-w-xl">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-status-ready/10 border border-status-ready/30 text-status-ready text-[11px] font-mono tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-status-ready shadow-glow animate-pulse" />
            Copiado inteligente
          </span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-ink lowercase mb-4 leading-none">
            one<span className="text-status-ready">shot</span>
          </h1>

          <p className="text-sm md:text-base text-ink-muted leading-relaxed mb-8 max-w-md">
            Escoge tu repo, marca los archivos y copia todo — estructura, grafo de dependencias y codigo — en un solo mensaje listo para pegar en ChatGPT, Claude o Kimi.
          </p>

          <button
            onClick={openProject}
            disabled={state.isLoading}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-status-ready text-canvas font-semibold text-xs tracking-widest uppercase shadow-glow hover:bg-status-active hover:shadow-glow-active hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
          >
            <span>{state.isLoading ? 'Escaneando...' : 'Abrir Repositorio'}</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <footer className="w-full px-8 py-5 border-t border-stroke/60 bg-surface/30 backdrop-blur-md flex justify-between items-center z-10 shrink-0 text-[11px] font-mono text-ink-subtle">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-status-ready rounded-full shadow-glow" />
          <span>100% local · nada sale de tu maquina</span>
        </div>
        <div className="uppercase tracking-widest opacity-60">
          Esperando repositorio
        </div>
      </footer>
    </div>
  );
};
