import { useState, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { Bridge } from '../services/bridge';
import { estimateTokens } from '../utils/cn';
import { findNodeById } from '../utils/tree-utils';

export const useOneShotGenerator = () => {
    const { state, dispatch } = useStore();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedFiles = useMemo(
        () => Array.from(state.selectedFileIds),
        [state.selectedFileIds]
    );

    const stats = useMemo(() => {
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
        return {
            totalSize: size,
            totalTokens: estimateTokens(size),
            fileCount: count
        };
    }, [selectedFiles, state.tree]);

    const usagePercent = Math.min((stats.totalTokens / state.budgetTokens) * 100, 100);
    const isOverBudget = stats.totalTokens > state.budgetTokens;

    const handleOpenProject = async () => {
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

    const generatePrompt = async () => {
        if (stats.fileCount === 0) {
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
            // Optimización: Promise.all para lectura paralela si el backend lo soporta, 
            // o secuencial para evitar saturación. Mantenemos secuencial por seguridad de I/O.
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
            console.error(err);
            addToast('error', 'Error al generar prompt');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        selectedFiles,
        stats,
        usagePercent,
        isOverBudget,
        isGenerating,
        handleOpenProject,
        generatePrompt
    };
};
