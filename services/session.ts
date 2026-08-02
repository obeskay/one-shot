// Persistencia local de la sesion: al reabrir la app recuperas el proyecto,
// la seleccion y las opciones donde las dejaste.
import type { PayloadOptions } from '../types';
import { DEFAULT_PAYLOAD_OPTIONS } from '../constants';

const STORAGE_KEY = 'one-shot:session:v1';
const MAX_SELECTION = 5000;

export interface PersistedSession {
    projectPath: string;
    selectedFileIds: string[];
    options: PayloadOptions;
}

export function loadSession(): PersistedSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<PersistedSession>;
        if (typeof parsed.projectPath !== 'string' || !parsed.projectPath) return null;

        return {
            projectPath: parsed.projectPath,
            selectedFileIds: Array.isArray(parsed.selectedFileIds)
                ? parsed.selectedFileIds.filter((id): id is string => typeof id === 'string')
                : [],
            // Fusionamos con los defaults por si la forma de las opciones cambio
            options: { ...DEFAULT_PAYLOAD_OPTIONS, ...(parsed.options || {}) },
        };
    } catch {
        return null;
    }
}

export function saveSession(session: PersistedSession): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...session,
            selectedFileIds: session.selectedFileIds.slice(0, MAX_SELECTION),
        }));
    } catch {
        // Cuota llena o storage bloqueado: la app sigue funcionando sin persistencia
    }
}

export function clearSession(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // sin efecto
    }
}
