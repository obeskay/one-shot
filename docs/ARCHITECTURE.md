# Arquitectura de Integración Go ↔ TypeScript

## Vista General

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (TypeScript)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  React Components│      │  Zustand Store   │                │
│  │  - ChatOverlay   │◄────►│  - AppState      │                │
│  │  - FileExplorer  │      │  - Dispatchers   │                │
│  └─────────┬────────┘      └──────────────────┘                │
│            │                                                     │
│            ▼                                                     │
│  ┌──────────────────────────────────────────┐                  │
│  │         services/bridge.ts                │                  │
│  │  - Auto-detects Wails/Mock                │                  │
│  │  - Type-safe bindings                     │                  │
│  │  - Event listeners management             │                  │
│  └───────────┬──────────────────────────────┘                  │
│              │                                                   │
└──────────────┼───────────────────────────────────────────────────┘
               │
               │ Wails IPC (JSON-RPC over WebSocket)
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                      Backend (Go)                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────┐                   │
│  │        internal/app/app.go                │                   │
│  │  - Wails Bound Methods (25 métodos)      │                   │
│  │  - Events Emitter (chat:*, job:*)        │                   │
│  │  - Structured Logging (slog)             │                   │
│  └───────┬──────────────────────────────────┘                   │
│          │                                                        │
│          ├─────► internal/fs/*        (File scanning)           │
│          ├─────► internal/jobs/*      (Job management)          │
│          ├─────► internal/llm/*       (LLM providers)           │
│          └─────► internal/context/*   (Context building)        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos: Streaming de LLM

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Usuario envía mensaje en ChatOverlay                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Bridge.StreamChat(config, fileIds, messages, callbacks)       │
│    - Registra listeners: chat:token, chat:complete, chat:error   │
│    - Llama window.go.app.App.StreamPrompt(spec)                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Backend: StreamPrompt(spec) → crea Job, inicia goroutine      │
│    - job, jobCtx := a.jobManager.CreateJob(JobKindRunPrompt)    │
│    - go func() { llmService.Stream(...) }()                      │
│    - Retorna jobId inmediatamente                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. LLM Provider streaming (OpenAI/OpenRouter)                    │
│    - Para cada token recibido:                                   │
│      wailsRuntime.EventsEmit(a.ctx, "chat:token", token)        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. Frontend: EventListener recibe "chat:token"                   │
│    - Valida tipo con isString(token)                            │
│    - Llama callback: onToken(token)                             │
│    - Actualiza UI con nuevo token                               │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. Streaming completa o falla                                    │
│    - Éxito: EventsEmit("chat:complete", jobId)                  │
│    - Error: EventsEmit("chat:error", err.Error())               │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. Frontend: Cleanup automático                                  │
│    - Ejecuta onComplete() o onError(msg)                        │
│    - Desmonta listeners (tokenCleanup, completeCleanup, etc)    │
│    - Actualiza estado de UI                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Gestión de Jobs Asíncronos

```
Backend (internal/jobs/manager.go)
┌─────────────────────────────────────────┐
│  JobManager                              │
│  - CreateJob(kind) → (Job, Context)     │
│  - UpdateJob(id, state, stage, ...)     │
│  - CompleteJob(id, error)                │
│  - CancelJob(id) → bool                  │
│  - GetJob(id) → *Job                     │
└─────────────────────────────────────────┘
         │                 ▲
         │ Create          │ Poll/Query
         ▼                 │
┌─────────────────────────────────────────┐
│  Frontend                                │
│  - jobId = await StreamPrompt(spec)     │
│  - status = await GetJobStatus(jobId)   │
│  - await CancelJob(jobId)                │
└─────────────────────────────────────────┘

Estados del Job:
  queued → running → [succeeded | failed | cancelled]
```

---

## DTOs: Alineación Go ↔ TypeScript

```go
// Go: internal/domain/types.go
type TreeSnapshotDTO struct {
    Project   ProjectDTO   `json:"project"`
    Root      FileNodeDTO  `json:"root"`
    Stats     TreeStatsDTO `json:"stats"`
    CreatedAt ISOTime      `json:"createdAt"`
    Version   int          `json:"version"`
}
```

```typescript
// TypeScript: types/domain.ts
export type TreeSnapshotDTO = {
  project: ProjectDTO;
  root: FileNodeDTO;
  stats: TreeStatsDTO;
  createdAt: ISOTime;
  version: number;
};
```

**JSON Serialization**:
- Go struct tags `json:"field"` → camelCase
- TypeScript interfaces match exactly
- Zero-copy deserialization en frontend

---

## Manejo de Errores: 3 Capas

### Capa 1: Backend (Go)

```go
func (a *App) ScanProject(path string) (*TreeSnapshotDTO, error) {
    snapshot, err := a.scanner.Scan(path, opts)
    if err != nil {
        a.logger.Error("Scan fallido", "path", path, "error", err)
        return nil, fmt.Errorf("scan failed: %w", err)
    }
    return &dto, nil
}
```

### Capa 2: Bridge (TypeScript)

```typescript
async ScanProject(path: string): Promise<TreeSnapshot> {
  try {
    const dto = await window.go.app.App.ScanProject(path);
    return convertTreeDTO(dto);
  } catch (err) {
    console.error('[Bridge] Error escaneando:', err);
    throw err; // Re-lanzar para que componente maneje
  }
}
```

### Capa 3: Componente (React)

```typescript
const handleScan = async () => {
  try {
    setLoading(true);
    const tree = await Bridge.ScanProject(path);
    dispatch({ type: 'SET_PROJECT', payload: tree });
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
};
```

---

## Eventos Wails: Publisher-Subscriber

```
Backend (Publisher)                   Frontend (Subscriber)
┌──────────────────────┐             ┌──────────────────────┐
│ wailsRuntime.EventsEmit             │ window.runtime.EventsOn│
│                      │  chat:token  │                      │
│  ───────────────────►│─────────────►│  (token: string)     │
│                      │              │  → onToken(token)    │
│                      │              └──────────────────────┘
│                      │              ┌──────────────────────┐
│                      │ chat:complete│                      │
│  ───────────────────►│─────────────►│  (jobId: string)     │
│                      │              │  → onComplete()      │
│                      │              └──────────────────────┘
│                      │              ┌──────────────────────┐
│                      │  chat:error  │                      │
│  ───────────────────►│─────────────►│  (error: string)     │
│                      │              │  → onError(error)    │
└──────────────────────┘              └──────────────────────┘

Cleanup:
  - Frontend llama EventsOff(eventName) en unmount
  - O usa función de cleanup retornada por EventsOn()
```

---

## Logging y Observabilidad

### Backend (Go): Structured Logging con slog

```go
a.logger.Info("Operación exitosa",
    "operation", "ScanProject",
    "path", path,
    "files", dto.Stats.Files,
    "duration_ms", elapsed.Milliseconds(),
)

a.logger.Error("Operación fallida",
    "operation", "StreamPrompt",
    "jobId", job.ID,
    "error", err,
    "provider", spec.Provider,
)
```

**Output (JSON)**:
```json
{"time":"2025-12-15T10:30:45Z","level":"INFO","msg":"Operación exitosa","operation":"ScanProject","path":"/Users/...","files":142,"duration_ms":234}
```

### Frontend (TypeScript): Console Logging

```typescript
console.log('[Bridge] Streaming iniciado', config.provider, config.model);
console.error('[Bridge] Error:', error);
```

**Prefijos**:
- `[Bridge]` - Operaciones de bridge
- `[EventValidator]` - Validación de eventos
- `[Chat]` - Componente de chat

---

## Type Safety: Validadores de Eventos

```typescript
// event-validators.ts
export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

// Uso en listener
tokenCleanup = window.runtime.EventsOn('chat:token', (token: unknown) => {
  if (!isString(token)) {
    logInvalidEvent('chat:token', token);
    return;
  }
  onToken(token); // token es string aquí
});
```

**Beneficios**:
- Runtime validation de datos
- Type narrowing automático
- Logging de datos inválidos
- Previene crashes por tipos incorrectos

---

## Patrones de Cleanup

### useEffect Cleanup Pattern

```typescript
useEffect(() => {
  const streamControl = Bridge.StreamChat(...);

  return () => {
    // Cleanup automático en unmount
    streamControl.stop();
  };
}, [dependencies]);
```

### Ref-based Manual Cleanup

```typescript
const streamRef = useRef<{ stop: () => void } | null>(null);

const start = () => {
  streamRef.current = Bridge.StreamChat(...);
};

const stop = () => {
  streamRef.current?.stop();
  streamRef.current = null;
};

useEffect(() => {
  return () => streamRef.current?.stop();
}, []);
```

---

## Resumen de Garantías

### Type Safety
- ✅ DTOs idénticos Go ↔ TypeScript
- ✅ Type guards para eventos
- ✅ Inferencia de tipos en callbacks
- ✅ No `any` en interfaces públicas

### Error Handling
- ✅ Wrapped errors en backend (`%w`)
- ✅ Try-catch en operaciones críticas
- ✅ Callbacks `onError` para async ops
- ✅ Logging en todas las capas

### Resource Management
- ✅ Cleanup automático de listeners
- ✅ Cancelación de jobs via `CancelJob()`
- ✅ Refs para control de streaming
- ✅ useEffect cleanup hooks

### Observability
- ✅ Structured logging (JSON) en backend
- ✅ Console logging con prefijos en frontend
- ✅ Eventos auditables
- ✅ Job status polling disponible

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-15
