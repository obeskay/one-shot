import React, { useMemo, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { StrategySelector } from './StrategySelector';
import { FileCard } from './FileCard';
import { ActionDock } from './ActionDock';
import { ArrowUpRight, Sparkles, Folder, FileText, Zap } from 'lucide-react';
import { Bridge } from '../../services/bridge';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import type { FileNode } from '../../types';

// Heuristica: ~4 caracteres = 1 token
const estimateTokens = (bytes: number): number => Math.ceil(bytes / 4);

const findNodeById = (node: FileNode, id: string): FileNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
};

export const Dashboard: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedFiles: string[] = useMemo(
    () => Array.from(state.selectedFileIds),
    [state.selectedFileIds]
  );

  // Calcular metricas reales
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
      // Construir payload de contexto
      let contextPayload = '';
      for (const id of selectedFiles) {
        const content = await Bridge.GetFileContent(id);
        contextPayload += `<file path="${id}">\n${content}\n</file>\n\n`;
      }

      // Construir prompt final
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

      // Copiar al clipboard
      await navigator.clipboard.writeText(`${systemPrompt}\n\n${fullPrompt}`);
      addToast('success', 'Prompt copiado al clipboard');

    } catch (err) {
      addToast('error', 'Error al generar prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!state.projectPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-reveal bg-background">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter lowercase mb-6 text-primary">
          contexto dev<br />simplificado.
        </h1>
        <p className="text-sm text-secondary max-w-sm mb-12 font-light tracking-wide lowercase">
          selecciona archivos. genera contexto. prompta tu llm.<br />
          workflow sin friccion para desarrolladores.
        </p>
        <button
          onClick={handleOpen}
          disabled={state.isLoading}
          className="group flex items-center gap-2 text-sm font-medium border-b border-primary pb-1 hover:opacity-50 transition-opacity disabled:opacity-50"
        >
          {state.isLoading ? 'cargando...' : 'abrir_repositorio'}
          <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32 custom-scrollbar">

        {/* Intent-First Hero Section */}
        <section className="mb-12 border border-border rounded-xl p-8 bg-surface/30">
          <label className="text-[10px] text-secondary uppercase tracking-widest block mb-3">
            Objetivo
          </label>
          <textarea
            value={state.intent}
            onChange={(e) => dispatch({ type: 'SET_INTENT', payload: e.target.value })}
            placeholder="Describe lo que quieres lograr con el codigo seleccionado..."
            className="w-full bg-transparent text-primary text-lg font-light placeholder:text-border resize-none border-none focus:outline-none focus:ring-0 min-h-[100px]"
          />

          {/* Budget + Generate Row */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-secondary uppercase tracking-widest">Presupuesto:</span>
              <select
                value={state.budgetTokens}
                onChange={(e) => dispatch({ type: 'SET_BUDGET', payload: Number(e.target.value) })}
                className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-primary"
              >
                <option value={25000}>25k tokens</option>
                <option value={50000}>50k tokens</option>
                <option value={100000}>100k tokens</option>
                <option value={128000}>128k tokens</option>
                <option value={200000}>200k tokens</option>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={fileCount === 0 || isGenerating}
              isLoading={isGenerating}
              className="px-8"
            >
              <Sparkles size={16} className="mr-2" />
              Generar One-Shot
            </Button>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface/50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText size={18} className="text-primary" />
              </div>
              <div>
                <span className="text-2xl font-mono text-primary">{fileCount}</span>
                <span className="text-xs text-secondary block">archivos</span>
              </div>
            </div>

            <div className="bg-surface/50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap size={18} className="text-primary" />
              </div>
              <div>
                <span className={`text-2xl font-mono ${isOverBudget ? 'text-red-400' : 'text-primary'}`}>
                  {formatNumber(totalTokens)}
                </span>
                <span className="text-xs text-secondary block">tokens (est.)</span>
              </div>
            </div>

            <div className="bg-surface/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-secondary">Uso del presupuesto</span>
                <span className={`text-xs font-mono ${isOverBudget ? 'text-red-400' : 'text-primary'}`}>
                  {usagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverBudget ? 'bg-red-400' : usagePercent > 80 ? 'bg-yellow-400' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Strategy Selector */}
        <section className="mb-8">
          <StrategySelector />
        </section>

        {/* Selected Files */}
        {fileCount > 0 && (
          <section className="animate-reveal">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-medium text-secondary uppercase tracking-widest">
                Archivos seleccionados
              </span>
              <button
                onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
                className="text-[10px] text-secondary hover:text-red-400 transition-colors uppercase tracking-widest border-b border-transparent hover:border-red-400"
              >
                limpiar
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
          <section className="text-center py-12 text-secondary">
            <Folder size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Selecciona archivos desde el arbol para comenzar</p>
          </section>
        )}
      </div>

      <ActionDock />
    </div>
  );
};
