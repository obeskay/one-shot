import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, TreeSnapshot, PayloadOptions, PayloadResult } from '../types';
import { DEFAULT_PAYLOAD_OPTIONS } from '../constants';
import { loadSession, saveSession } from '../services/session';

const initialState: AppState = {
  projectPath: null,
  tree: null,
  isLoading: false,

  selectedFileIds: new Set(),
  expandedFolderIds: new Set(['root', 'src']),
  searchQuery: '',

  options: DEFAULT_PAYLOAD_OPTIONS,

  payload: null,
  isBuilding: false,
};

type Action =
  | { type: 'SET_PROJECT'; payload: { path: string; tree: TreeSnapshot } }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'SELECT_BATCH'; payload: { ids: string[]; selected: boolean } }
  | { type: 'TOGGLE_EXPAND'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_OPTIONS'; payload: Partial<PayloadOptions> }
  | { type: 'SET_PAYLOAD'; payload: PayloadResult | null }
  | { type: 'SET_BUILDING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_SESSION'; payload: { path: string; tree: TreeSnapshot; selectedFileIds: string[]; options: PayloadOptions } };

// Cualquier cambio de seleccion u opciones invalida el payload ya construido
function invalidate(state: AppState): AppState {
  return state.payload === null ? state : { ...state, payload: null };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...invalidate(state),
        projectPath: action.payload.path,
        tree: action.payload.tree,
        selectedFileIds: new Set(),
        isLoading: false,
      };
    case 'RESTORE_SESSION': {
      // Solo recuperamos rutas que sigan existiendo en el arbol recien escaneado
      const alive = new Set(collectFileIds(action.payload.tree.root));
      return {
        ...state,
        projectPath: action.payload.path,
        tree: action.payload.tree,
        selectedFileIds: new Set(action.payload.selectedFileIds.filter(id => alive.has(id))),
        options: action.payload.options,
        payload: null,
        isLoading: false,
      };
    }
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedFileIds);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...invalidate(state), selectedFileIds: next };
    }
    case 'SELECT_BATCH': {
      const next = new Set(state.selectedFileIds);
      action.payload.ids.forEach(id => {
        if (action.payload.selected) next.add(id);
        else next.delete(id);
      });
      return { ...invalidate(state), selectedFileIds: next };
    }
    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedFolderIds);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, expandedFolderIds: next };
    }
    case 'CLEAR_SELECTION':
      return { ...invalidate(state), selectedFileIds: new Set() };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_OPTIONS':
      return { ...invalidate(state), options: { ...state.options, ...action.payload } };
    case 'SET_PAYLOAD':
      return { ...state, payload: action.payload };
    case 'SET_BUILDING':
      return { ...state, isBuilding: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// collectFileIds junta las rutas de todos los archivos del arbol
function collectFileIds(node: TreeSnapshot['root'], out: string[] = []): string[] {
  if (!node.isDir) out.push(node.id);
  node.children?.forEach(child => collectFileIds(child, out));
  return out;
}

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Guardamos la sesion en cuanto cambia algo que valga la pena recuperar
  useEffect(() => {
    if (!state.projectPath) return;
    saveSession({
      projectPath: state.projectPath,
      selectedFileIds: Array.from(state.selectedFileIds),
      options: state.options,
    });
  }, [state.projectPath, state.selectedFileIds, state.options]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export { loadSession };

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
