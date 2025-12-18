import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { useOneShotGenerator } from '../../hooks/useOneShotGenerator';
import { ArrowUpRight, Sparkles, FileText, Box } from 'lucide-react';
import { formatNumber } from '../../utils/cn';
import { findNodeById } from '../../utils/tree-utils';

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useStore();
  
  // Usamos el hook refactorizado
  const { 
      selectedFiles, 
      stats, 
      usagePercent, 
      isOverBudget, 
      isGenerating, 
      handleOpenProject, 
      generatePrompt 
  } = useOneShotGenerator();

  // ═══════════════════════════════════════════════════════════
  // HERO STATE (Sin proyecto)
  // ═══════════════════════════════════════════════════════════
  if (!state.projectPath) {
    return (
      <div className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-status-ready/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[100px]" />
        
        <div className="flex-grow flex items-center justify-center">
            <div className="relative animate-reveal">
                <div className="absolute inset-0 bg-status-ready/20 blur-[60px] rounded-full scale-150 opacity-50" />
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-surface-elevated/50 border border-stroke-emphasis flex items-center justify-center shadow-elevated backdrop-blur-xl group hover:border-status-ready/40 transition-all duration-700">
                    <Box size={56} className="text-status-ready group-hover:scale-110 transition-transform duration-700" strokeWidth={1.5} />
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end w-full px-8 md:px-16 pb-8 md:pb-16 border-b border-stroke/50 z-10">
          <div className="animate-reveal mb-8 md:mb-0 w-full md:w-auto">
            <p className="text-sm font-medium leading-relaxed text-ink-muted lowercase max-w-[280px] tracking-tight mb-10 opacity-70">
              The intelligent context engine for LLMs. Select your source, define your goal, build perfect prompts.
            </p>
            <button
              onClick={handleOpenProject}
              disabled={state.isLoading}
              className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink hover:text-status-ready transition-all duration-500"
            >
              <div className="w-8 h-8 rounded-full border border-stroke flex items-center justify-center group-hover:border-status-ready group-hover:bg-status-ready/5 transition-all duration-500">
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              {state.isLoading ? 'Cargando...' : 'Abrir repositorio'}
            </button>
          </div>
          <div className="text-left md:text-right animate-reveal delay-100">
            <h1 className="text-[12vw] md:text-[8vw] leading-[0.8] font-bold text-ink tracking-tighter lowercase select-none">
                One<br /><span className="text-status-ready">Shot</span>
            </h1>
          </div>
        </div>
        
        <div className="w-full px-8 md:px-16 py-8 flex justify-between items-center animate-reveal delay-200 bg-surface/20 backdrop-blur-sm">
          <div className="flex gap-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 text-ink-subtle">
              <span className="w-1.5 h-1.5 bg-status-ready rounded-full shadow-glow" />
              Engine v0.1.0 Ready
            </span>
          </div>
          <div className="text-[10px] font-mono text-ink-subtle uppercase tracking-[0.2em] opacity-40">
            Awaiting input
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // WORKSPACE STATE (Con proyecto)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-canvas relative font-sans selection:bg-status-ready selection:text-black">
      <header className="px-10 pt-10 pb-6 flex justify-between items-center animate-reveal">
        <h1 className="text-h2 font-light lowercase text-ink tracking-tight">dashboard</h1>
        <button className="text-ink-subtle hover:text-ink transition-colors">
            <span className="sr-only">Settings</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </header>
      
      <svg className="absolute w-0 h-0">
        <defs>
            <linearGradient id="gradient-files" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
      </svg>

      <div className="flex-1 overflow-y-auto px-10 pb-32 scrollbar-hidden">
        <div className="w-full h-px bg-stroke mb-8 animate-reveal delay-100" />

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-reveal delay-200">
            <div className="group relative p-6 bg-surface border border-stroke rounded-xl h-40 flex flex-col justify-between hover:border-stroke-emphasis hover:shadow-glow-subtle transition-all duration-300">
                <span className="text-sm text-ink-muted lowercase font-medium">files</span>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-light text-ink tracking-tighter">{formatNumber(stats.fileCount)}</span>
                    <svg className="w-16 h-8 text-ink-subtle opacity-50 group-hover:text-status-ready group-hover:opacity-100 transition-colors" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 28 C10 28, 15 15, 25 20 C35 25, 40 5, 50 10 C55 12, 60 0, 64 0" vectorEffect="non-scaling-stroke"/>
                        <path d="M0 28 L64 28" strokeWidth="0" fill="url(#gradient-files)" className="opacity-20"/>
                    </svg>
                </div>
            </div>

            <div className="group relative p-6 bg-surface border border-stroke rounded-xl h-40 flex flex-col justify-between hover:border-stroke-emphasis hover:shadow-glow-subtle transition-all duration-300">
                <span className="text-sm text-ink-muted lowercase font-medium">tokens</span>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-light text-ink tracking-tighter">{stats.totalTokens > 1000 ? `${(stats.totalTokens/1000).toFixed(0)}k` : stats.totalTokens}</span>
                    <svg className="w-16 h-8 text-ink-subtle opacity-50 group-hover:text-status-ready group-hover:opacity-100 transition-colors" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2">
                         <path d="M0 25 C10 25, 20 20, 30 22 C40 24, 50 10, 64 5" vectorEffect="non-scaling-stroke"/>
                    </svg>
                </div>
            </div>

            <div className="group relative p-6 bg-surface border border-stroke rounded-xl h-40 flex flex-col justify-between hover:border-stroke-emphasis hover:shadow-glow-subtle transition-all duration-300">
                <span className="text-sm text-ink-muted lowercase font-medium">budget</span>
                <div>
                     <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-light text-ink tracking-tighter">${(state.budgetTokens / 10000).toFixed(2)}</span>
                     </div>
                     <div className="w-full bg-surface-muted h-1 mt-4 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-status-error' : 'bg-status-ready'}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                     </div>
                </div>
            </div>
        </section>

        {/* Main Action */}
        <section className="flex justify-center items-center py-10 animate-reveal delay-300">
            <button
                onClick={generatePrompt}
                disabled={stats.fileCount === 0 || isGenerating}
                className="group relative w-full max-w-lg h-20 rounded-pill bg-surface border border-stroke hover:border-status-ready hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <span className="text-xl font-light lowercase text-ink tracking-wide z-10">
                    {isGenerating ? 'generating...' : 'generate one-shot'}
                </span>
                {!isGenerating && <Sparkles className="w-5 h-5 text-status-ready z-10 animate-pulse-glow" />}
            </button>
        </section>

        {/* Selected Files List */}
        {stats.fileCount > 0 && (
          <section className="animate-slide-up mt-12">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="text-micro font-mono text-ink-subtle uppercase tracking-widest">
                contexto seleccionado
              </span>
              <button
                onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                className="text-micro text-ink-subtle hover:text-status-error transition-colors uppercase tracking-widest"
              >
                clear
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {selectedFiles.map(id => (
                    <div key={id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-surface-elevated transition-colors border border-transparent hover:border-stroke">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileText size={16} className="text-ink-subtle group-hover:text-status-ready transition-colors" />
                            <span className="text-sm text-ink-muted truncate font-mono">{id.split('/').pop()}</span>
                        </div>
                        <span className="text-xs text-ink-subtle font-mono group-hover:text-ink transition-colors">
                            {formatNumber(findNodeById(state.tree?.root, id)?.size || 0)}b
                        </span>
                    </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
