import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { Button } from '../../ui/Button';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { formatBytes } from '../../../utils/cn';
import { Bridge, WailsExtras } from '../../../services/bridge';
import type { FileNode } from '../../../types';

// Heuristica: ~4 caracteres = 1 token (aproximacion para modelos modernos)
const estimateTokens = (bytes: number): number => Math.ceil(bytes / 4);

// Encontrar nodos por ID en el arbol
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

export const ContextPanel: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedFiles: string[] = useMemo(
    () => Array.from(state.selectedFileIds),
    [state.selectedFileIds]
  );

  // Calcular tamano real desde el arbol
  const { totalSize, fileDetails } = useMemo(() => {
    if (!state.tree?.root) {
      return { totalSize: 0, fileDetails: [] as { id: string; name: string; size: number }[] };
    }

    const details: { id: string; name: string; size: number }[] = [];
    let size = 0;

    for (const id of selectedFiles) {
      const node = findNodeById(state.tree.root, id);
      if (node && !node.isDir) {
        details.push({ id: node.id, name: node.name, size: node.size });
        size += node.size;
      }
    }

    return { totalSize: size, fileDetails: details };
  }, [selectedFiles, state.tree]);

  const estimatedTokens = estimateTokens(totalSize);
  const budgetLimit = state.budgetTokens;
  const usagePercent = Math.min((estimatedTokens / budgetLimit) * 100, 100);
  const isOverBudget = estimatedTokens > budgetLimit;

  // Construir preview del payload
  const buildPreview = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      let content = '';
      for (const file of fileDetails) {
        const fileContent = await Bridge.GetFileContent(file.id);
        content += `<file path="${file.id}">\n${fileContent}\n</file>\n\n`;
      }
      setPreviewContent(content);
      setShowPreview(true);
    } catch (err) {
      addToast('error', 'Error al cargar archivos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      let content = '';
      for (const file of fileDetails) {
        const fileContent = await Bridge.GetFileContent(file.id);
        content += `<file path="${file.id}">\n${fileContent}\n</file>\n\n`;
      }
      await navigator.clipboard.writeText(content);
      addToast('success', `${fileDetails.length} archivos copiados`);
    } catch (err) {
      addToast('error', 'Error al copiar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    const manifest = {
      files: fileDetails.map(f => ({ path: f.id, size: f.size, tokens: estimateTokens(f.size) })),
      totalSize,
      estimatedTokens,
      budget: budgetLimit,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'context-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Manifest exportado');
  };

  const handleBudgetChange = (newBudget: number) => {
    dispatch({ type: 'SET_BUDGET', payload: newBudget });
  };

  return (
    <div className="flex flex-col h-full bg-background animate-reveal">
      {/* Header con metricas */}
      <div className="p-12 border-b border-border">
        <h2 className="text-3xl font-light tracking-tight lowercase text-primary mb-8">
          Contexto
        </h2>

        <div className="grid grid-cols-3 gap-12 mb-8">
          <div>
            <span className="text-[10px] text-secondary uppercase tracking-widest block mb-2">
              Archivos
            </span>
            <span className="text-4xl font-mono text-primary">{fileDetails.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-secondary uppercase tracking-widest block mb-2">
              Tamano
            </span>
            <span className="text-4xl font-mono text-primary">{formatBytes(totalSize)}</span>
          </div>
          <div>
            <span className="text-[10px] text-secondary uppercase tracking-widest block mb-2">
              Tokens (est.)
            </span>
            <span className={`text-4xl font-mono ${isOverBudget ? 'text-red-400' : 'text-primary'}`}>
              {(estimatedTokens / 1000).toFixed(1)}k
            </span>
          </div>
        </div>

        {/* Budget selector */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] text-secondary uppercase tracking-widest">Presupuesto:</span>
          <select
            value={budgetLimit}
            onChange={(e) => handleBudgetChange(Number(e.target.value))}
            className="bg-surface border border-border rounded px-3 py-1 text-sm text-primary"
          >
            <option value={25000}>25k tokens</option>
            <option value={50000}>50k tokens</option>
            <option value={100000}>100k tokens</option>
            <option value={128000}>128k tokens</option>
            <option value={200000}>200k tokens</option>
          </select>
          <span className="text-[10px] text-secondary">
            {usagePercent.toFixed(0)}% usado
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="relative w-full bg-surface h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              isOverBudget ? 'bg-red-400' : usagePercent > 80 ? 'bg-yellow-400' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {isOverBudget && (
          <p className="text-xs text-red-400 mt-2">
            Excede el presupuesto por {((estimatedTokens - budgetLimit) / 1000).toFixed(1)}k tokens
          </p>
        )}
      </div>

      {/* Lista de archivos */}
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        {fileDetails.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-secondary lowercase mb-6 border-b border-border pb-2 w-max">
              Archivos seleccionados
            </h3>
            {fileDetails.map((file) => (
              <div key={file.id} className="flex items-center justify-between group">
                <span className="text-sm text-secondary font-mono truncate flex-1">{file.id}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-border group-hover:text-secondary transition-colors">
                    {formatBytes(file.size)}
                  </span>
                  <span className="text-[10px] text-border">
                    ~{estimateTokens(file.size)} tok
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-secondary">
            <p className="text-sm">Selecciona archivos en el arbol</p>
          </div>
        )}

        {/* Preview panel */}
        {showPreview && previewContent && (
          <div className="mt-8 border border-border rounded-lg overflow-hidden">
            <div className="bg-surface px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-mono text-secondary">Preview del payload</span>
              <button onClick={() => setShowPreview(false)} className="text-secondary hover:text-primary">
                <EyeOff size={14} />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-secondary overflow-x-auto max-h-64 overflow-y-auto">
              {previewContent.slice(0, 5000)}
              {previewContent.length > 5000 && '\n... (truncado)'}
            </pre>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <div className="p-8 border-t border-border flex justify-between items-center bg-background">
        <Button
          variant="ghost"
          onClick={buildPreview}
          disabled={fileDetails.length === 0 || isLoading}
          icon={<Eye size={14} />}
        >
          {showPreview ? 'Actualizar' : 'Preview'}
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportJSON} disabled={fileDetails.length === 0}>
            <Download size={14} className="mr-2" />
            JSON
          </Button>
          <Button
            variant="primary"
            onClick={handleCopy}
            disabled={fileDetails.length === 0 || isLoading}
            isLoading={isLoading}
          >
            <Copy size={14} className="mr-2" />
            Copiar
          </Button>
        </div>
      </div>
    </div>
  );
};
