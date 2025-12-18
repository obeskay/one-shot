import React, { useMemo, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { StrategySelector } from './StrategySelector';
import { FileCard } from './FileCard';
import { ActionDock } from './ActionDock';
import { ArrowDown, ArrowUpRight, Sparkles, Folder, FileText, Zap, ChevronDown } from 'lucide-react';
import { Bridge } from '../../services/bridge';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import type { FileNode } from '../../types';
import { estimateTokens, formatNumber, cn } from '../../utils/cn';
import { findNodeById } from '../../utils/tree-utils';

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedFiles: string[] = useMemo(
    () => Array.from(state.selectedFileIds),
    [state.selectedFileIds]
  );

  const { totalSize, totalTokens, fileCount } = useMemo(() => {
    if (!state.tree?.root) return { totalSize: 0, totalTokens: 0, fileCount: 0 };

    let size = 0;
    let count = 0;
    for (const id of selectedFiles) {
      const node = findNodeById(state.tree.root, id);
      if (node && !node.isDir) {
        size += node.size;
        count++;
      }
    }
    return { totalSize: size, totalTokens: estimateTokens(size), fileCount: count };
  }, [selectedFiles, state.tree]);

  const usagePercent = Math.min((totalTokens / state.budgetTokens) * 100, 100);
  const isOverBudget = totalTokens > state.budgetTokens;

  const handleOpen = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const path = await Bridge.SelectProject();
      if (path) {
        const tree = await Bridge.ScanProject(path);
        dispatch({ type: 'SET_PROJECT', payload: { path, tree } });
      }
    } catch (err) {
      addToast('error', 'Error al abrir proyecto');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleGenerate = async () => {
    if (fileCount === 0) {
      addToast('error', 'Selecciona al menos un archivo');
      return;
    }
    if (!state.intent.trim()) {
      addToast('error', 'Describe tu objetivo');
      return;
    }

    setIsGenerating(true);
    try {
      let contextPayload = '';
      for (const id of selectedFiles) {
        const content = await Bridge.GetFileContent(id);
        contextPayload += `<file path="${id}">\n${content}\n</file>\n\n`;
      }

      const systemPrompt = `Eres un asistente experto en desarrollo de software.
El usuario te proporciona archivos de codigo como contexto y un objetivo.
Analiza el contexto y genera una solucion completa.

CONTEXTO DEL PROYECTO:
${contextPayload}`;

      const fullPrompt = `OBJETIVO: ${state.intent}

Por favor, genera una solucion completa que incluya:
1. Analisis del codigo existente
2. Cambios propuestos (con diff cuando sea posible)
3. Nuevos archivos si son necesarios
4. Comandos de terminal si aplica`;

      await navigator.clipboard.writeText(`${systemPrompt}\n\n${fullPrompt}`);
      addToast('success', 'Prompt copiado al portapapeles');

    } catch (err) {
      addToast('error', 'Error al generar prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HERO STATE (Sin proyecto)
  // ═══════════════════════════════════════════════════════════
  if (!state.projectPath) {
    return (
      <div className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-surface rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 -z-10 opacity-40" />

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Main content */}
        <div className="flex flex-col md:flex-row justify-between items-end w-full px-8 md:px-12 pb-8 md:pb-12 border-b border-stroke">
          {/* Left: Description + CTA */}
          <div className="animate-reveal mb-8 md:mb-0 w-full md:w-auto">
            <p className="text-sm font-normal leading-relaxed text-ink-subtle lowercase max-w-xs tracking-wide mb-8">
              constructor de contexto para llms. selecciona archivos,
              define tu objetivo, genera prompts estructurados.
            </p>

            <button
              onClick={handleOpen}
              disabled={state.isLoading}
              className="group inline-flex items-center gap-2 text-micro font-medium uppercase tracking-widest border-b border-stroke pb-1 transition-all duration-normal hover:border-ink hover:text-ink-muted disabled:opacity-50"
            >
              {state.isLoading ? 'cargando...' : 'abrir repositorio'}
              <ArrowUpRight
                size={14}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-normal"
              />
            </button>
          </div>

          {/* Right: Headline */}
          <div className="text-left md:text-right animate-reveal delay-100">
            <h1 className="text-display lowercase leading-[0.85] font-semibold text-ink tracking-tighter">
              contexto<br />
              simplificado<br />
              <span className="text-ink-subtle">one-shot</span>
            </h1>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="w-full px-8 md:px-12 py-6 flex justify-between items-center animate-reveal delay-200">
          <div className="flex gap-8">
            <span className="text-xs font-medium lowercase flex items-center gap-2">
              <span className="w-2 h-2 bg-status-ready rounded-full animate-pulse" />
              listo para trabajar
            </span>
          </div>

          <div className="text-micro text-ink-subtle uppercase tracking-widest animate-pulse-subtle">
            selecciona un proyecto
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
      
      {/* Header */}
      <header className="px-10 pt-10 pb-6 flex justify-between items-center animate-reveal">
        <h1 className="text-h2 font-light lowercase text-ink tracking-tight">dashboard</h1>
        <button className="text-ink-subtle hover:text-ink transition-colors">
            <span className="sr-only">Settings</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </header>
      
      {/* SVG Defs for Graphs */}
      <svg className="absolute w-0 h-0">
        <defs>
            <linearGradient id="gradient-files" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
      </svg>

      <div className="flex-1 overflow-y-auto px-10 pb-32 scrollbar-hidden">

        {/* Separator */}
        <div className="w-full h-px bg-stroke mb-8 animate-reveal delay-100" />

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-reveal delay-200">
            {/* Files Card */}
            <div className="group relative p-6 bg-surface border border-stroke rounded-xl h-40 flex flex-col justify-between hover:border-stroke-emphasis hover:shadow-glow-subtle transition-all duration-300">
                <span className="text-sm text-ink-muted lowercase font-medium">files</span>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-light text-ink tracking-tighter">{formatNumber(fileCount)}</span>
                    {/* Tiny Graph Decoration */}
                    <svg className="w-16 h-8 text-ink-subtle opacity-50 group-hover:text-status-ready group-hover:opacity-100 transition-colors" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 28 C10 28, 15 15, 25 20 C35 25, 40 5, 50 10 C55 12, 60 0, 64 0" vectorEffect="non-scaling-stroke"/>
                        <path d="M0 28 L64 28" strokeWidth="0" fill="url(#gradient-files)" className="opacity-20"/>
                    </svg>
                </div>
            </div>

            {/* Tokens Card */}
            <div className="group relative p-6 bg-surface border border-stroke rounded-xl h-40 flex flex-col justify-between hover:border-stroke-emphasis hover:shadow-glow-subtle transition-all duration-300">
                <span className="text-sm text-ink-muted lowercase font-medium">tokens</span>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-light text-ink tracking-tighter">{totalTokens > 1000 ? `${(totalTokens/1000).toFixed(0)}k` : totalTokens}</span>
                    <svg className="w-16 h-8 text-ink-subtle opacity-50 group-hover:text-status-ready group-hover:opacity-100 transition-colors" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2">
                         <path d="M0 25 C10 25, 20 20, 30 22 C40 24, 50 10, 64 5" vectorEffect="non-scaling-stroke"/>
                    </svg>
                </div>
            </div>

            {/* Budget Card */}
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

        {/* Main Action - Centered Large Button */}
        <section className="flex justify-center items-center py-10 animate-reveal delay-300">
            <button
                onClick={handleGenerate}
                disabled={fileCount === 0 || isGenerating}
                className="group relative w-full max-w-lg h-20 rounded-pill bg-surface border border-stroke hover:border-status-ready hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
            >
                {/* Background Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <span className="text-xl font-light lowercase text-ink tracking-wide z-10">
                    {isGenerating ? 'generating...' : 'generate one-shot'}
                </span>
                
                {!isGenerating && <Sparkles className="w-5 h-5 text-status-ready z-10 animate-pulse-glow" />}
            </button>
        </section>

        {/* Selected Files List (Visible but subtle) */}
        {fileCount > 0 && (
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
