# Integración Robusta Go ↔ TypeScript (Wails)

## Resumen Ejecutivo

Integración completa entre backend Go y frontend TypeScript con manejo robusto de errores, logging estructurado y comunicación bidireccional via eventos Wails.

---

## 1. Backend (Go) - `/internal/app/app.go`

### Métodos Wails Bound

#### Project Management
- `SelectProject() (string, error)` - Dialogo de selección de directorio
- `ScanProject(path string) (*TreeSnapshotDTO, error)` - Escaneo básico de proyecto
- `ScanProjectWithOptions(...)` - Escaneo con opciones personalizadas
- `ReadFile(relPath, projectPath string) (string, error)` - Lectura de archivo
- `ReadFileWithLimit(...) (string, bool, error)` - Lectura con límite de bytes
- `GetPlatform() string` - Información de plataforma

#### Job Management
- `CancelJob(jobId string) error` - Cancelar trabajo en ejecución
- `GetJobStatus(jobId string) (*JobProgressDTO, error)` - Estado de un job

#### Context Building
- `BuildContext(selection, options, projectPath) (*ContextPayloadDTO, error)` - Construir contexto para prompt
- `FormatContext(payload) string` - Formatear contexto

#### LLM Integration
- `ConfigureLLM(provider, apiKey, baseURL string) error` - Configurar provider de LLM
- `RunPrompt(spec PromptRunSpecDTO) (*PromptRunResultDTO, error)` - Ejecutar prompt sincrono
- `StreamPrompt(spec PromptRunSpecDTO) (string, error)` - **Streaming con eventos** (retorna jobId)
- `StopStream(jobId string) error` - Detener streaming activo

### Eventos Emitidos (Backend → Frontend)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `chat:token` | `string` | Token individual del streaming de LLM |
| `chat:error` | `string` | Error durante streaming (mensaje de error) |
| `chat:complete` | `string` | Streaming completado (jobId) |
| ~~`job:progress`~~ | ~~`JobProgressDTO`~~ | **NO IMPLEMENTADO** (usar `GetJobStatus` polling) |

### Logging Estructurado (`log/slog`)

```go
a.logger.Info("Mensaje", "key", value)
a.logger.Error("Error", "error", err, "context", data)
a.logger.Warn("Advertencia", "jobId", id)
```

**Formato**: JSON a stdout con nivel `INFO` por defecto.

---

## 2. Frontend (TypeScript) - `/services/bridge.ts`

### Interface Bridge (Auto-detecta Wails vs Mock)

```typescript
// Uso básico
import { Bridge, WailsExtras } from './services/bridge';

// Project management
const path = await Bridge.SelectProject();
const tree = await Bridge.ScanProject(path);

// File operations
const content = await Bridge.GetFileContent(fileId);

// LLM streaming
const streamControl = Bridge.StreamChat(
  config,
  selectedFileIds,
  messages,
  (token) => console.log(token),      // onToken
  () => console.log('Complete'),       // onComplete
  (error) => console.error(error)      // onError
);

// Cancelar streaming
streamControl.stop();
```

### WailsExtras (Solo en entorno Wails)

```typescript
if (WailsExtras) {
  await WailsExtras.ConfigureLLM('openai', apiKey, baseURL);
  const status = await WailsExtras.GetJobStatus(jobId);
  const { content, truncated } = await WailsExtras.GetFileContentWithLimit(fileId, 1000000);
  const context = await WailsExtras.BuildContext(selectedIds, options);
}
```

### Manejo de Eventos con Type Safety

```typescript
import { createEventListener, isString } from './services/event-validators';

// Listener tipado con validación automática
const cleanup = createEventListener<string>(
  'chat:token',
  (token) => console.log('Token:', token),
  isString // Validator opcional
);

// Cleanup
cleanup();
```

---

## 3. DTOs (Alineación Go ↔ TypeScript)

### Archivo: `/types/domain.ts` ↔ `/internal/domain/types.go`

**Coherencia 100%**: Nombres de campos en camelCase (TS) coinciden con JSON tags de Go.

| DTO | Go | TypeScript | Uso |
|-----|-----|------------|-----|
| `TreeSnapshotDTO` | ✅ | ✅ | Snapshot de árbol de archivos |
| `FileNodeDTO` | ✅ | ✅ | Nodo individual del árbol |
| `SelectionDTO` | ✅ | ✅ | Estado de selección de archivos |
| `ContextPayloadDTO` | ✅ | ✅ | Payload de contexto para LLM |
| `PromptRunSpecDTO` | ✅ | ✅ | Especificación para ejecutar prompt |
| `PromptRunResultDTO` | ✅ | ✅ | Resultado de prompt |
| `JobProgressDTO` | ✅ | ✅ | Estado de trabajo asíncrono |

**Conversión Legacy**:
```typescript
import { treeDTOToLegacy } from './types/domain';

const legacyTree = treeDTOToLegacy(treeSnapshotDTO);
```

---

## 4. Manejo de Errores

### Backend (Go)

```go
// Wrapped errors para trazabilidad
if err != nil {
    a.logger.Error("Operación fallida", "error", err, "path", path)
    return nil, fmt.Errorf("scan failed: %w", err)
}
```

### Frontend (TypeScript)

```typescript
// Try-catch con logging
try {
  const result = await Bridge.RunPrompt(spec);
} catch (err) {
  console.error('[Bridge] Error:', err);
  showToast('Error al ejecutar prompt', 'error');
}
```

### Streaming con Callbacks

```typescript
Bridge.StreamChat(
  config,
  fileIds,
  messages,
  (token) => appendToken(token),
  () => setComplete(true),
  (error) => {
    console.error('[Chat] Error:', error);
    showErrorMessage(error);
  }
);
```

---

## 5. Patrones de Uso

### Inicializar Proyecto

```typescript
// 1. Seleccionar proyecto
const path = await Bridge.SelectProject();
if (!path) return;

// 2. Escanear con gitignore
const tree = await Bridge.ScanProject(path);

// 3. Guardar en estado
dispatch({ type: 'SET_PROJECT', payload: { path, tree } });
```

### Streaming con Cleanup Automático

```typescript
const ChatComponent = () => {
  const streamRef = useRef<{ stop: () => void } | null>(null);

  const handleSend = () => {
    streamRef.current = Bridge.StreamChat(
      config,
      fileIds,
      messages,
      (token) => appendMessage(token),
      () => setGenerating(false),
      (error) => handleError(error)
    );
  };

  const handleStop = () => {
    streamRef.current?.stop();
    streamRef.current = null;
  };

  // Cleanup en unmount
  useEffect(() => {
    return () => streamRef.current?.stop();
  }, []);

  return <button onClick={handleStop}>Detener</button>;
};
```

### Configurar LLM Provider

```typescript
// Al iniciar sesión o cambiar API key
if (WailsExtras) {
  await WailsExtras.ConfigureLLM('openai', apiKey, 'https://api.openai.com/v1');
}

// Backend registra provider internamente
// Subsecuentes llamadas usan el provider configurado
```

---

## 6. Testing

### Mock Bridge (Desarrollo Web)

```typescript
// Automáticamente activo si window.go === undefined
const tree = await Bridge.ScanProject('/any/path');
// Retorna datos mock sin backend
```

### Wails Bridge (Producción)

```typescript
// Automáticamente activo si window.go está presente
const tree = await Bridge.ScanProject('/real/path');
// Conecta a backend Go real
```

---

## 7. Checklist de Integración

### Backend Go
- [x] Todos los métodos Wails bound tienen manejo de errores con `fmt.Errorf("...: %w", err)`
- [x] Logging estructurado con `log/slog` en operaciones críticas
- [x] Eventos emitidos: `chat:token`, `chat:error`, `chat:complete`
- [x] Métodos sincrónicos y asíncronos (jobs) claramente diferenciados

### Frontend TypeScript
- [x] Bridge expone todos los métodos del backend
- [x] Type safety en declaraciones `window.go.app.App`
- [x] Listeners de eventos con cleanup automático en callbacks
- [x] Type guards para validación de eventos (`event-validators.ts`)
- [x] Mock bridge para desarrollo sin backend

### DTOs
- [x] Todos los DTOs alineados Go ↔ TypeScript
- [x] Nombres de campos en camelCase consistentes
- [x] Conversión legacy disponible (`treeDTOToLegacy`)

### Manejo de Errores
- [x] Errores wrapeados en backend (`%w`)
- [x] Callbacks `onError` en operaciones asíncronas
- [x] Logging en desarrollo: `console.log('[Bridge]', ...)`
- [x] Try-catch en llamadas críticas del frontend

### Cleanup
- [x] EventsOff automático en callbacks de StreamChat
- [x] Refs para control de streaming (`streamControlRef`)
- [x] useEffect cleanup en componentes que usan streaming

---

## 8. Mejoras Futuras

### Backend
- [ ] Emitir evento `job:progress` para tracking de jobs de larga duración
- [ ] Configuración de nivel de logging (DEBUG, INFO, WARN, ERROR) via flag o env var
- [ ] Rate limiting para prevenir abuse de APIs de LLM
- [ ] Persistencia de configuración de LLM en disco (API keys encriptadas)

### Frontend
- [ ] Schema validation con Zod para todos los eventos
- [ ] Retry automático con backoff exponencial para operaciones fallidas
- [ ] Queue de requests para evitar sobrecarga del backend
- [ ] Indicadores de progreso para operaciones largas (BuildContext, ScanProject)

### Observabilidad
- [ ] Metrics: latencia de llamadas Wails, tasa de errores
- [ ] Tracing distribuido para seguir requests cross-boundary
- [ ] Dashboard de monitoreo de jobs activos

---

## 9. Debugging

### Backend
```bash
# Ver logs estructurados
wails dev 2>&1 | jq 'select(.level == "ERROR")'
```

### Frontend
```javascript
// Ver todos los eventos Wails
window.runtime.EventsOn('*', (event, ...args) => {
  console.log('[WailsEvent]', event, args);
});
```

### Validación de DTOs
```typescript
import { isJobProgressDTO } from './services/event-validators';

const data = await Bridge.GetJobStatus(jobId);
console.assert(isJobProgressDTO(data), 'Invalid DTO shape');
```

---

## 10. Recursos

- **Wails Docs**: https://wails.io/docs/reference/runtime/events
- **Go log/slog**: https://pkg.go.dev/log/slog
- **TypeScript Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

---

**Versión**: 1.0.0
**Última actualización**: 2025-12-15
**Autor**: OneShot Team
