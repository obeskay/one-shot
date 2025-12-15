// Type guards y validadores para eventos Wails
import type { JobProgressDTO } from '../types/domain';

/**
 * Valida que un dato sea un string
 */
export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

/**
 * Valida que un dato sea un JobProgressDTO
 */
export function isJobProgressDTO(data: unknown): data is JobProgressDTO {
  if (!data || typeof data !== 'object') return false;

  const job = data as Partial<JobProgressDTO>;

  return (
    typeof job.jobId === 'string' &&
    typeof job.kind === 'string' &&
    typeof job.state === 'string' &&
    (job.stage === undefined || typeof job.stage === 'string') &&
    (job.current === undefined || typeof job.current === 'number') &&
    (job.total === undefined || typeof job.total === 'number') &&
    (job.message === undefined || typeof job.message === 'string')
  );
}

/**
 * Valida datos de error
 */
export interface ChatErrorEvent {
  message: string;
  jobId?: string;
}

export function isChatErrorEvent(data: unknown): data is ChatErrorEvent {
  if (!data || typeof data !== 'object') return false;
  const err = data as Partial<ChatErrorEvent>;
  return typeof err.message === 'string';
}

/**
 * Valida evento de completado
 */
export interface ChatCompleteEvent {
  jobId: string;
}

export function isChatCompleteEvent(data: unknown): data is ChatCompleteEvent {
  if (!data || typeof data !== 'object') return false;
  const evt = data as Partial<ChatCompleteEvent>;
  return typeof evt.jobId === 'string';
}

/**
 * Helper para logs de validacion fallida
 */
export function logInvalidEvent(eventName: string, data: unknown): void {
  console.error(`[EventValidator] Evento "${eventName}" con datos invalidos:`, {
    type: typeof data,
    value: data,
  });
}
