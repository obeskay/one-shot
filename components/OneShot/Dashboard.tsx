import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { useOneShotGenerator } from '../../hooks/useOneShotGenerator';
import { ArrowUpRight, Sparkles, FileText, Box } from 'lucide-react';
import { formatNumber } from '../../utils/cn';
import { findNodeById } from '../../utils/tree-utils';

import { BrandIcon } from '../ui/BrandIcons';

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
      <div className="min-h-screen w-full flex flex-col justify-between bg-canvas relative overflow-hidden select-none">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-status-ready/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Spacer for macOS Window Controls */}
        <div className="h-12 w-full shrink-0" />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 z-10 max-w-4xl mx-auto w-full text-center">
          {/* Logo Card */}
          <div className="relative mb-8 animate-reveal">
            <div className="absolute inset-0 bg-status-ready/30 blur-[40px] rounded-3xl scale-125 opacity-60" />
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-surface-elevated/80 border border-stroke-emphasis flex items-center justify-center shadow-glow backdrop-blur-2xl group hover:border-status-ready/60 hover:scale-105 transition-all duration-500">
              <Box size={44} className="text-status-ready group-hover:rotate-6 transition-transform duration-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="animate-reveal delay-100 flex flex-col items-center max-w-xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-status-ready/10 border border-status-ready/30 text-status-ready text-[11px] font-mono tracking-widest uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-status-ready shadow-glow animate-pulse" />
              Engine v0.1.0 Ready
            </span>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-ink lowercase mb-4 leading-none">
              one<span className="text-status-ready">shot</span>
            </h1>

            <p className="text-sm md:text-base text-ink-muted leading-relaxed font-normal mb-6 max-w-md">
              Context engine for LLMs. Select your repository, pick key modules, and build deterministic context payloads.
            </p>

            {/* Detected Installed Agent CLIs */}
            {state.detectedCLIs.filter(c => c.isInstalled).length > 0 && (
              <div className="mb-8 p-3 rounded-2xl bg-surface-elevated/40 border border-stroke-emphasis/50 backdrop-blur-xl flex flex-col items-center gap-2.5 w-full max-w-lg">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-subtle flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-ready shadow-glow" />
                  Agentes autónomos detectados en tu Mac
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {state.detectedCLIs.filter(c => c.isInstalled).map(cli => (
                    <span 
                      key={cli.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/90 border border-stroke text-ink text-[11px] font-mono shadow-sm hover:border-status-ready/60 transition-colors cursor-default"
                      title={`Ubicación: ${cli.path}`}
                    >
                      <BrandIcon id={cli.id} className="w-3.5 h-3.5 text-status-ready shrink-0" />
                      <span className="font-semibold text-status-ready">{cli.command}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleOpenProject}
              disabled={state.isLoading}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-status-ready text-canvas font-semibold text-xs tracking-widest uppercase shadow-glow hover:bg-status-active hover:shadow-glow-active hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            >
              <span>{state.isLoading ? 'Cargando repositorio...' : 'Abrir Repositorio'}</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer Status Bar */}
        <footer className="w-full px-8 py-5 border-t border-stroke/60 bg-surface/30 backdrop-blur-md flex justify-between items-center z-10 shrink-0 text-[11px] font-mono text-ink-subtle">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-status-ready rounded-full shadow-glow" />
            <span>Local Codebase Explorer</span>
          </div>
          <div className="uppercase tracking-widest opacity-60">
            Awaiting Repository Selection
          </div>
        </footer>
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
