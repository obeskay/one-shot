import React from 'react';
import { usePayload } from '../../../hooks/usePayload';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { openExternal } from '../../../services/bridge';
import { PASTE_TARGETS } from '../../../constants';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/Switch';
import { Copy, Check, Download, RefreshCw, Layers, ExternalLink } from 'lucide-react';
import { cn, formatBytes, formatNumber } from '../../../utils/cn';

// Cuanto texto mostramos en la vista previa (el payload completo puede ser enorme)
const PREVIEW_LIMIT = 20000;

export const PayloadView: React.FC = () => {
    const {
        state,
        dispatch,
        selectedFiles,
        estimate,
        isCopying,
        build,
        copy,
        save,
    } = usePayload();

    const { options, payload, isBuilding } = state;
    const hasSelection = selectedFiles.length > 0;

    useKeyboardShortcuts({ onCopy: copy });

    const preview = payload
        ? payload.text.slice(0, PREVIEW_LIMIT)
        : '';
    const previewTruncated = !!payload && payload.text.length > PREVIEW_LIMIT;

    return (
        <div className="flex flex-col h-full bg-canvas overflow-hidden">
            {/* Header */}
            <header className="h-12 border-b border-stroke flex items-center justify-between px-4 bg-glass backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 text-ink-subtle px-2 py-1 rounded bg-surface-muted border border-stroke/50">
                        <Layers size={12} className="text-status-ready" />
                        <span className="text-[10px] font-mono tracking-wider uppercase">Contexto</span>
                    </div>
                    <div className="h-4 w-px bg-stroke" />
                    <span className="text-[11px] font-mono text-ink-muted truncate" title={state.projectPath || ''}>
                        {state.projectPath?.split('/').pop()}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono text-ink-subtle shrink-0">
                    <span>{selectedFiles.length} archivos</span>
                    <span>{formatBytes(payload?.stats.bytes ?? estimate.bytes)}</span>
                    <span className="text-status-ready">
                        ~{formatNumber(payload?.stats.tokens ?? estimate.tokens)} tokens
                    </span>
                </div>
            </header>

            {/* Opciones */}
            <section className="px-5 py-4 border-b border-stroke bg-surface/20 shrink-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <OptionToggle
                        label="Estructura"
                        hint="Arbol de carpetas"
                        checked={options.includeTree}
                        onChange={(v) => dispatch({ type: 'SET_OPTIONS', payload: { includeTree: v } })}
                    />
                    <OptionToggle
                        label="Grafo"
                        hint="Imports, quien usa que, deps externas"
                        checked={options.includeGraph}
                        onChange={(v) => dispatch({ type: 'SET_OPTIONS', payload: { includeGraph: v } })}
                    />
                    <OptionToggle
                        label="Codigo"
                        hint="Contenido completo de los archivos"
                        checked={options.includeContents}
                        onChange={(v) => dispatch({ type: 'SET_OPTIONS', payload: { includeContents: v } })}
                    />
                </div>

                <textarea
                    value={options.instruction}
                    onChange={(e) => dispatch({ type: 'SET_OPTIONS', payload: { instruction: e.target.value } })}
                    placeholder="Objetivo para el chatbot (opcional): que quieres que haga con este contexto..."
                    className="w-full h-16 bg-surface-elevated/50 border border-stroke rounded-lg px-3 py-2 text-[12px] text-ink placeholder:text-ink-subtle/40 outline-none focus:border-status-ready/40 focus:ring-2 focus:ring-status-ready/10 transition-colors resize-none custom-scrollbar font-sans"
                />
            </section>

            {/* Vista previa */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {!hasSelection ? (
                    <EmptyState
                        title="Sin archivos seleccionados"
                        detail="Marca archivos o carpetas en el panel izquierdo. Todo se copia en un solo mensaje."
                    />
                ) : !payload ? (
                    <EmptyState
                        title={`${selectedFiles.length} archivos listos`}
                        detail="Genera la vista previa o copia directo: el contexto se arma al vuelo."
                    />
                ) : (
                    <>
                        <pre className="flex-1 overflow-auto custom-scrollbar px-5 py-4 text-[10.5px] leading-relaxed font-mono text-ink-muted whitespace-pre-wrap break-words">
                            {preview}
                        </pre>
                        {previewTruncated && (
                            <div className="px-5 py-2 text-[10px] font-mono text-ink-subtle border-t border-stroke/50 bg-surface/30 shrink-0">
                                Vista previa recortada · se copian {formatNumber(payload.text.length)} caracteres completos
                            </div>
                        )}
                    </>
                )}

                {payload?.warnings?.length ? (
                    <div className="px-5 py-2 text-[10px] font-mono text-status-error/80 border-t border-stroke/50 shrink-0 max-h-20 overflow-y-auto custom-scrollbar">
                        {payload.warnings.map((w, i) => <div key={i}>· {w}</div>)}
                    </div>
                ) : null}
            </div>

            {/* Acciones */}
            <footer className="border-t border-stroke bg-surface/30 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={build}
                        disabled={!hasSelection || isBuilding}
                        className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-stroke text-[11px] text-ink-muted hover:text-ink hover:border-stroke-emphasis hover:bg-surface transition-all disabled:opacity-40"
                    >
                        <RefreshCw size={13} className={cn(isBuilding && 'animate-spin')} />
                        <span>{payload ? 'Regenerar' : 'Vista previa'}</span>
                    </button>

                    <button
                        onClick={save}
                        disabled={!hasSelection}
                        className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-stroke text-[11px] text-ink-muted hover:text-ink hover:border-stroke-emphasis hover:bg-surface transition-all disabled:opacity-40"
                    >
                        <Download size={13} />
                        <span>Guardar .md</span>
                    </button>

                    <div className="h-5 w-px bg-stroke mx-1" />

                    {PASTE_TARGETS.map(target => (
                        <button
                            key={target.id}
                            onClick={() => openExternal(target.url)}
                            className="flex items-center gap-1 px-2.5 h-9 rounded-lg text-[11px] text-ink-subtle hover:text-ink hover:bg-surface transition-all"
                            title={`Abrir ${target.label} para pegar el contexto`}
                        >
                            <span>{target.label}</span>
                            <ExternalLink size={11} className="opacity-50" />
                        </button>
                    ))}
                </div>

                <Button
                    variant="primary"
                    shape="pill"
                    size="md"
                    onClick={copy}
                    isLoading={isCopying || isBuilding}
                    disabled={!hasSelection}
                    icon={isCopying ? <Check size={14} /> : <Copy size={14} />}
                    className="min-w-[190px] shadow-base hover:shadow-elevated"
                >
                    {isCopying ? 'copiado' : 'copiar todo'}
                    {!isCopying && hasSelection && (
                        <span className="ml-2 opacity-60 text-micro">{selectedFiles.length}</span>
                    )}
                </Button>
            </footer>
        </div>
    );
};

const OptionToggle: React.FC<{
    label: string;
    hint: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-stroke bg-surface/40">
        <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-ink">{label}</span>
            <span className="text-[9.5px] text-ink-subtle truncate">{hint}</span>
        </div>
        <Switch checked={checked} onChange={onChange} />
    </div>
);

const EmptyState: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
    <div className="flex-1 flex flex-col items-center justify-center select-none px-8 text-center">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-status-ready/20 blur-[40px] rounded-full" />
            <div className="relative w-14 h-14 rounded-2xl bg-surface-elevated border border-stroke-emphasis flex items-center justify-center shadow-glow-subtle">
                <Copy size={24} strokeWidth={1.5} className="text-status-ready" />
            </div>
        </div>
        <h2 className="text-base font-medium tracking-tight text-ink mb-2">{title}</h2>
        <p className="text-xs font-mono text-ink-subtle max-w-[320px] leading-relaxed">{detail}</p>
    </div>
);
