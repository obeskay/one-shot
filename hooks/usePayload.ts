import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { Bridge } from '../services/bridge';
import { findNodeById } from '../utils/tree-utils';
import { estimateTokens } from '../utils/cn';
import { PayloadResult } from '../types';
import { loadSession } from '../services/session';
import { isLikelyBinary } from '../utils/binary-ext';

export const usePayload = () => {
    const { state, dispatch } = useStore();
    const { addToast } = useToast();
    const [isCopying, setIsCopying] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const restored = useRef(false);

    // Al arrancar, reabrimos el ultimo proyecto y su seleccion
    useEffect(() => {
        if (restored.current) return;
        restored.current = true;

        const session = loadSession();
        if (!session) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        Bridge.ScanProject(session.projectPath)
            .then(tree => {
                dispatch({
                    type: 'RESTORE_SESSION',
                    payload: {
                        path: session.projectPath,
                        tree,
                        selectedFileIds: session.selectedFileIds,
                        options: session.options,
                    },
                });
            })
            .catch(() => {
                // El proyecto se movio o se borro: arrancamos limpio
                dispatch({ type: 'SET_LOADING', payload: false });
            });
    }, [dispatch]);

    const selectedFiles = useMemo(
        () => Array.from(state.selectedFileIds).sort(),
        [state.selectedFileIds]
    );

    // Estimacion barata mientras el usuario selecciona (sin leer archivos).
    // Los binarios no aportan tokens: solo se listan con su ruta.
    const estimate = useMemo(() => {
        if (!state.tree?.root) return { bytes: 0, tokens: 0, files: 0, binary: 0 };
        let bytes = 0;
        let files = 0;
        let binary = 0;

        for (const id of selectedFiles) {
            const node = findNodeById(state.tree.root, id);
            if (!node || node.isDir) continue;

            if (isLikelyBinary(id)) {
                binary++;
                continue;
            }
            bytes += node.size;
            files++;
        }
        return { bytes, tokens: estimateTokens(bytes), files, binary };
    }, [selectedFiles, state.tree]);

    const openProject = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const path = await Bridge.SelectProject();
            if (path) {
                const tree = await Bridge.ScanProject(path);
                dispatch({ type: 'SET_PROJECT', payload: { path, tree } });
            }
        } catch (err) {
            console.error(err);
            addToast('error', 'No se pudo abrir el proyecto');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dispatch, addToast]);

    // Agrega a la seleccion todo lo que los archivos elegidos importan
    const expandByGraph = useCallback(async (depth = 0) => {
        if (!state.projectPath || selectedFiles.length === 0) {
            addToast('error', 'Selecciona al menos un archivo');
            return;
        }

        setIsExpanding(true);
        try {
            const expanded = await Bridge.ExpandSelection(state.projectPath, selectedFiles, depth);
            const added = expanded.length - selectedFiles.length;

            if (added <= 0) {
                addToast('info', 'La seleccion ya incluye todas sus dependencias');
                return;
            }

            dispatch({ type: 'SELECT_BATCH', payload: { ids: expanded, selected: true } });
            addToast('success', `+${added} archivos que tu seleccion importa`);
        } catch (err) {
            console.error(err);
            addToast('error', 'No se pudo expandir por el grafo');
        } finally {
            setIsExpanding(false);
        }
    }, [state.projectPath, selectedFiles, dispatch, addToast]);

    // Arma el payload en Go y lo deja en el store
    const build = useCallback(async (): Promise<PayloadResult | null> => {
        if (!state.projectPath || selectedFiles.length === 0) {
            addToast('error', 'Selecciona al menos un archivo');
            return null;
        }

        dispatch({ type: 'SET_BUILDING', payload: true });
        try {
            const result = await Bridge.BuildPayload(state.projectPath, selectedFiles, state.options);
            dispatch({ type: 'SET_PAYLOAD', payload: result });
            return result;
        } catch (err) {
            console.error(err);
            addToast('error', typeof err === 'string' ? err : 'No se pudo armar el contexto');
            return null;
        } finally {
            dispatch({ type: 'SET_BUILDING', payload: false });
        }
    }, [state.projectPath, state.options, selectedFiles, dispatch, addToast]);

    // Accion principal: arma (si hace falta) y copia
    const copy = useCallback(async () => {
        setIsCopying(true);
        try {
            const result = state.payload ?? await build();
            if (!result) return;

            await Bridge.CopyToClipboard(result.text);
            addToast('success', `${result.stats.files} archivos copiados · ~${Math.round(result.stats.tokens / 1000)}k tokens`);
        } catch (err) {
            console.error(err);
            addToast('error', 'No se pudo copiar al portapapeles');
        } finally {
            setTimeout(() => setIsCopying(false), 900);
        }
    }, [state.payload, build, addToast]);

    const save = useCallback(async () => {
        try {
            const result = state.payload ?? await build();
            if (!result) return;

            const name = `${state.projectPath?.split('/').pop() || 'context'}-context.md`;
            const target = await Bridge.SavePayload(result.text, name);
            if (target) addToast('success', 'Contexto guardado');
        } catch (err) {
            console.error(err);
            addToast('error', 'No se pudo guardar el archivo');
        }
    }, [state.payload, state.projectPath, build, addToast]);

    return {
        state,
        dispatch,
        selectedFiles,
        estimate,
        isCopying,
        isExpanding,
        expandByGraph,
        openProject,
        build,
        copy,
        save,
    };
};
