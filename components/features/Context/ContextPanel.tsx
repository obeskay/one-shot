import React, { useState, useMemo } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { Button } from '../../ui/Button';
import { Copy, Download, Eye, EyeOff, FileText, Code2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { formatBytes, estimateTokens } from '../../../utils/cn';
import { Bridge } from '../../../services/bridge';
import type { FileNode } from '../../../types';
import { findNodeById } from '../../../utils/tree-utils';

type OutputFormat = 'xml' | 'markdown';

export const ContextPanel: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('xml');

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

    // Ordenar por tamaño descendente
    details.sort((a, b) => b.size - a.size);

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
        if (outputFormat === 'xml') {
          content += `<file path="${file.id}">\n${fileContent}\n</file>\n\n`;
        } else {
          content += `## ${file.id}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
        }
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
        if (outputFormat === 'xml') {
          content += `<file path="${file.id}">\n${fileContent}\n</file>\n\n`;
        } else {
          content += `## ${file.id}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
        }
      }
      await navigator.clipboard.writeText(content);
      addToast('success', `${fileDetails.length} archivos copiados`);
    } catch (err) {
      addToast('error', 'Error al copiar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPreview = async () => {
      if (!previewContent) return;
      try {
          await navigator.clipboard.writeText(previewContent);
          addToast('success', 'Preview copiado al portapapeles');
      } catch (err) {
          addToast('error', 'Error al copiar preview');
      }
  };

  const handleExportJSON = async () => {
    if (selectedFiles.length === 0) return;
    
    const data = {
        project: state.projectPath,
        timestamp: new Date().toISOString(),
        files: fileDetails,
        stats: {
            totalSize,
            estimatedTokens
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `context-export-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', 'Exportación JSON generada');
  };

  return (
    <div className="flex flex-col h-full bg-canvas relative overflow-hidden font-sans">
       {/* Background Decoration */}
       <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-status-active/5 rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

      {/* Header */}
      <div className="h-14 px-6 border-b border-stroke flex justify-between items-center bg-glass z-20 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-stroke text-ink-subtle">
                  <div className="w-4 h-4" /> {/* Icon placeholder or import Layers */}
              </div>
              <h2 className="text-lg font-medium text-ink lowercase tracking-tight">contexto</h2>
          </div>
          
           {/* Budget Indicator (Small) */}
           <div className="flex items-center gap-2 text-xs text-ink-muted">
               <span>{usagePercent.toFixed(1)}%</span>
               <div className="w-20 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                   <div 
                       className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-status-error' : 'bg-status-ready'}`} 
                       style={{ width: `${usagePercent}%` }}
                   />
               </div>
           </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {fileDetails.length > 0 ? (
          <div className="space-y-6">

            {/* Header List */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-mono text-secondary lowercase">
                Archivos seleccionados
              </h3>
              <span className="text-[10px] text-border">
                {fileDetails.length} archivo{fileDetails.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* List */}
             <div className="space-y-2">
              {fileDetails.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded bg-surface/50 hover:bg-surface transition-colors group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm text-primary font-mono truncate">{file.name}</div>
                    <div className="text-[10px] text-border mt-1 truncate">{file.id}</div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-secondary font-mono">
                        {formatBytes(file.size)}
                      </div>
                      <div className="text-[10px] text-border">
                        {estimateTokens(file.size).toLocaleString('es-MX')} tok
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between p-3 rounded bg-primary/5">
                <span className="text-sm font-medium text-primary">Total</span>
                <div className="text-right">
                  <div className="text-sm text-primary font-mono font-medium">
                    {formatBytes(totalSize)}
                  </div>
                  <div className="text-xs text-secondary">
                    {estimatedTokens.toLocaleString('es-MX')} tokens
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-secondary">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Selecciona archivos en el árbol</p>
          </div>
        )}

        {/* Preview panel mejorado */}
        {showPreview && previewContent && (
          <div className="mt-8 border border-border rounded-lg overflow-hidden animate-reveal">
            <div className="bg-surface px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-secondary">Preview del contexto</span>
                <span className="text-[10px] text-border">
                  {previewContent.length.toLocaleString('es-MX')} caracteres
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPreview}
                  icon={<Copy size={12} />}
                >
                  Copiar
                </Button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-secondary hover:text-primary transition-colors p-1"
                >
                  <EyeOff size={14} />
                </button>
              </div>
            </div>
            <div className="relative">
              <pre className="p-4 text-xs font-mono text-secondary overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar bg-black/20">
{previewContent.slice(0, 8000)}
{previewContent.length > 8000 && '\n\n... (truncado para preview, copia el contenido completo)'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <div className="p-8 border-t border-border bg-background space-y-4">
        {/* Selector de formato */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-secondary uppercase tracking-widest">Formato:</span>
            <div className="flex gap-2 p-1 bg-surface rounded-lg border border-border">
              <button
                onClick={() => setOutputFormat('xml')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  outputFormat === 'xml'
                    ? 'bg-primary text-black'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <Code2 size={14} />
                XML-ish
              </button>
              <button
                onClick={() => setOutputFormat('markdown')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  outputFormat === 'markdown'
                    ? 'bg-primary text-black'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <FileText size={14} />
                Markdown
              </button>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center">
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
    </div>
  );
};
