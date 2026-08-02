import { useCallback, useMemo, useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { Bridge } from '../services/bridge';
import { findNodeById } from '../utils/tree-utils';
import { estimateTokens } from '../utils/cn';
import { PayloadResult } from '../types';

export const usePayload = () => {
    const { state, dispatch } = useStore();
    const { addToast } = useToast();
    const [isCopying, setIsCopying] = useState(false);

    const selectedFiles = useMemo(
        () => Array.from(state.selectedFileIds).sort(),
        [state.selectedFileIds]
    );

    // Estimacion barata mientras el usuario selecciona (sin leer archivos)
    const estimate = useMemo(() => {
        if (!state.tree?.root) return { bytes: 0, tokens: 0, files: 0 };
        let bytes = 0;
        let files = 0;
        for (const id of selectedFiles) {
            const node = findNodeById(state.tree.root, id);
            if (node && !node.isDir) {
                bytes += node.size;
                files++;
            }
        }
        return { bytes, tokens: estimateTokens(bytes), files };
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
        openProject,
        build,
        copy,
        save,
    };
};
