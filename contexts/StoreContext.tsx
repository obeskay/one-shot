import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, TreeSnapshot, ContextStrategy, FileSummary, ChatMessage, AIConfig } from '../types';
import { DEFAULT_AI_CONFIG } from '../constants';
import { Bridge } from '../services/bridge';

const initialState: AppState = {
  projectPath: null,
  tree: null,
  isLoading: false,
  strategy: 'precise',
  aiConfig: DEFAULT_AI_CONFIG,
  selectedFileIds: new Set(),
  expandedFolderIds: new Set(['root', 'src']),
  searchQuery: '',
  summaries: {},
  processingFiles: new Set(),
  
  // Default view is now Studio
  activeTab: 'studio',

  isChatOpen: false,
  chatMessages: [],
  isChatGenerating: false,

  intent: '',
  budgetTokens: 50000,
  currentJobId: null,
  providers: [],
};

type Action =
  | { type: 'SET_PROJECT'; payload: { path: string; tree: TreeSnapshot } }
  | { type: 'SET_STRATEGY'; payload: ContextStrategy }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'SELECT_BATCH'; payload: { ids: string[]; selected: boolean } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'CACHE_SUMMARY'; payload: FileSummary }
  | { type: 'SET_PROCESSING'; payload: { id: string; processing: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_CHAT'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_CHAT_MESSAGE'; payload: string }
  | { type: 'SET_CHAT_GENERATING'; payload: boolean }
  | { type: 'CLEAR_CHAT' }
  | { type: 'UPDATE_AI_CONFIG'; payload: Partial<AIConfig> }
  | { type: 'SET_TAB'; payload: string }
  | { type: 'SET_INTENT'; payload: string }
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'SET_CURRENT_JOB'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROVIDERS'; payload: any[] };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_PROJECT':
            return {
                ...state,
                projectPath: action.payload.path,
                tree: action.payload.tree,
                selectedFileIds: new Set(),
                isLoading: false,
            };
        case 'SET_STRATEGY':
            return { ...state, strategy: action.payload };
        case 'TOGGLE_SELECT': {
            const newSet = new Set(state.selectedFileIds);
            if (newSet.has(action.payload)) newSet.delete(action.payload);
            else newSet.add(action.payload);
            return { ...state, selectedFileIds: newSet };
        }
        case 'SELECT_BATCH': {
            const newSet = new Set(state.selectedFileIds);
            action.payload.ids.forEach(id => {
                if (action.payload.selected) newSet.add(id);
                else newSet.delete(id);
            });
            return { ...state, selectedFileIds: newSet };
        }
        case 'TOGGLE_EXPAND': {
            const newSet = new Set(state.expandedFolderIds);
            if (newSet.has(action.payload)) newSet.delete(action.payload);
            else newSet.add(action.payload);
            return { ...state, expandedFolderIds: newSet };
        }
        case 'CACHE_SUMMARY':
            return { ...state, summaries: { ...state.summaries, [action.payload.fileId]: action.payload } };
        case 'SET_PROCESSING': {
            const newSet = new Set(state.processingFiles);
            if (action.payload.processing) newSet.add(action.payload.id);
            else newSet.delete(action.payload.id);
            return { ...state, processingFiles: newSet };
        }
        case 'CLEAR_SELECTION':
            return { ...state, selectedFileIds: new Set() };
        case 'SET_SEARCH':
            return { ...state, searchQuery: action.payload };
        case 'TOGGLE_CHAT':
            return { ...state, isChatOpen: action.payload };
        case 'ADD_CHAT_MESSAGE':
            return { ...state, chatMessages: [...state.chatMessages, action.payload] };
        case 'UPDATE_LAST_CHAT_MESSAGE': {
            const msgs = [...state.chatMessages];
            if (msgs.length === 0) return state;
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + action.payload };
            return { ...state, chatMessages: msgs };
        }
        case 'SET_CHAT_GENERATING':
            return { ...state, isChatGenerating: action.payload };
        case 'CLEAR_CHAT':
            return { ...state, chatMessages: [] };
        case 'UPDATE_AI_CONFIG':
            return { ...state, aiConfig: { ...state.aiConfig, ...action.payload } };
        case 'SET_TAB':
            return { ...state, activeTab: action.payload };
        case 'SET_INTENT':
            return { ...state, intent: action.payload };
        case 'SET_BUDGET':
            return { ...state, budgetTokens: action.payload };
        case 'SET_CURRENT_JOB':
            return { ...state, currentJobId: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_PROVIDERS':
            return { ...state, providers: action.payload };
        default:
            return state;
    }
}

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Bridge.GetProviders().then(providers => {
      const mappedProviders = providers.map(p => ({
        id: p.id,
        name: p.name,
        description: p.name,
        requiresApiKey: p.id !== 'local-cli',
        icon: p.icon,
        baseURL: p.baseUrl,
        models: p.models.map(m => ({
          id: m.id,
          name: m.name,
          canThink: m.capabilities.canThink,
          canSearch: m.capabilities.canSearch
        }))
      }));
      dispatch({ type: 'SET_PROVIDERS', payload: mappedProviders });
    }).catch(err => console.error("Failed to fetch providers", err));
  }, []);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
