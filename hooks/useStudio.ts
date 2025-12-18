import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Bridge } from '../services/bridge';
import { findNodeById } from '../utils/tree-utils';
import { estimateTokens } from '../utils/cn';
import { ChatMessage } from '../types';

export const useStudio = () => {
    const { state, dispatch } = useStore();
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<{ stop: () => void } | null>(null);

    // Calcular tokens del contexto seleccionado en tiempo real
    const selectedFiles = useMemo(() => Array.from(state.selectedFileIds), [state.selectedFileIds]);

    const totalTokens = useMemo(() => {
        if (!state.tree?.root) return 0;
        let size = 0;
        for (const id of selectedFiles) {
            const node = findNodeById(state.tree.root, id);
            if (node && !node.isDir) size += node.size;
        }
        return estimateTokens(size);
    }, [selectedFiles, state.tree]);

    // Auto-scroll inteligente
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollHeight - scrollTop - clientHeight < 150) {
                scrollRef.current.scrollTop = scrollHeight;
            }
        }
    }, [state.chatMessages, isStreaming]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });
        setInput('');

        // Assistant placeholder
        const aiMsgId = 'temp-ai-' + Date.now();
        dispatch({
            type: 'ADD_CHAT_MESSAGE',
            payload: { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() }
        });

        setIsStreaming(true);

        streamRef.current = Bridge.StreamChat(
            state.aiConfig,
            selectedFiles,
            [...state.chatMessages, userMsg],
            (token) => dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: token }),
            () => setIsStreaming(false),
            (err) => {
                setIsStreaming(false);
                dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: `\n\n**Error:** ${err}` });
            }
        );
    };

    const handleStop = () => {
        streamRef.current?.stop();
        setIsStreaming(false);
    };

    const toggleFile = (id: string) => {
        dispatch({ type: 'TOGGLE_SELECT', payload: id });
    };

    return {
        state,
        input,
        setInput,
        isStreaming,
        handleSend,
        handleStop,
        scrollRef,
        totalTokens,
        selectedFiles,
        toggleFile
    };
};
