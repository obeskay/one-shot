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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-canvas relative">
      <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32 scrollbar-hidden">

        {/* Objetivo Section */}
        <section className="mb-12 animate-reveal">
          <label className="text-micro text-ink-subtle uppercase tracking-widest block mb-4 font-mono">
            objetivo
          </label>
          <div className="group relative">
            <textarea
              value={state.intent}
              onChange={(e) => dispatch({ type: 'SET_INTENT', payload: e.target.value })}
              placeholder="¿Qué quieres lograr con el código seleccionado?"
              className="w-full bg-transparent text-ink text-lg font-light placeholder:text-ink-subtle/50 placeholder:font-light resize-none border border-stroke rounded-large focus:outline-none focus:border-ink p-6 min-h-[140px] leading-relaxed transition-all duration-normal"
            />
          </div>
        </section>

        {/* Stats Bar */}
        <section className="mb-12 animate-reveal delay-100">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {/* Files Card */}
            <Card variant="ghost" className="p-5 hover:border-stroke-emphasis group relative overflow-hidden transition-all duration-slow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-slow">
                  <FileText size={18} className="text-ink" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl md:text-3xl font-light text-ink tracking-tight">{fileCount}</div>
                  <div className="text-micro text-ink-subtle uppercase tracking-widest font-mono">archivos</div>
                </div>
              </div>
            </Card>

            {/* Tokens Card */}
            <Card variant="ghost" className="p-5 hover:border-stroke-emphasis group relative overflow-hidden transition-all duration-slow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-slow">
                  <Zap size={18} className="text-ink" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className={`text-2xl md:text-3xl font-light tracking-tight ${isOverBudget ? 'text-status-error' : 'text-ink'}`}>
                    {formatNumber(totalTokens)}
                  </div>
                  <div className="text-micro text-ink-subtle uppercase tracking-widest font-mono">tokens</div>
                </div>
              </div>
            </Card>

            {/* Budget Card */}
            <Card variant="ghost" className="p-5 hover:border-stroke-emphasis group relative overflow-hidden transition-all duration-slow flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <span className="text-micro text-ink-subtle uppercase tracking-widest font-mono">presupuesto</span>
                <span className={`text-xs font-mono ${isOverBudget ? 'text-status-error' : 'text-ink'}`}>
                  {usagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-reveal ease-expo-out ${
                    isOverBudget ? 'bg-status-error' : usagePercent > 80 ? 'bg-status-warning' : 'bg-ink'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Budget Selector + Generate Button */}
        <section className="mb-12 animate-reveal delay-200">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <label className="text-micro text-ink-subtle uppercase tracking-widest font-mono">
                límite:
              </label>
              <div className="relative min-w-[120px]">
                <Select
                  value={state.budgetTokens}
                  onChange={(e) => dispatch({ type: 'SET_BUDGET', payload: Number(e.target.value) })}
                  className="pl-2"
                >
                  <option value={25000}>25k</option>
                  <option value={50000}>50k</option>
                  <option value={100000}>100k</option>
                  <option value={128000}>128k</option>
                  <option value={200000}>200k</option>
                </Select>
              </div>
            </div>

            <Button
              variant="primary"
              shape="pill"
              size="lg"
              onClick={handleGenerate}
              disabled={fileCount === 0 || isGenerating}
              isLoading={isGenerating}
              icon={!isGenerating ? <Sparkles size={16} /> : undefined}
              className="shadow-elevated hover:shadow-prominent"
            >
              generar one-shot
            </Button>
          </div>
        </section>

        {/* Strategy Selector */}
        <section className="mb-12 animate-reveal delay-300">
          <StrategySelector />
        </section>

        {/* Selected Files Grid */}
        {fileCount > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <span className="text-micro font-mono text-ink-subtle uppercase tracking-widest">
                contexto seleccionado
              </span>
              <button
                onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                className="text-micro text-ink-subtle hover:text-status-error transition-colors duration-normal uppercase tracking-widest pb-0.5 border-b border-transparent hover:border-status-error/50 font-mono"
              >
                limpiar todo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedFiles.map(id => (
                <FileCard key={id} fileId={id} />
              ))}
            </div>
          </section>
        )}

        {fileCount === 0 && (
          <section className="text-center py-20 animate-fade-in">
            <Folder size={56} className="mx-auto mb-6 text-stroke" strokeWidth={1} />
            <p className="text-lg font-light text-ink-subtle lowercase tracking-tight">
              selecciona archivos del explorador
            </p>
            <p className="text-sm text-ink-subtle/60 mt-2 lowercase">
              usa el panel izquierdo para navegar tu proyecto
            </p>
          </section>
        )}
      </div>

      <ActionDock />
    </div>
  );
};
