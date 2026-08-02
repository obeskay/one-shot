<div align="center">
  <img src="build/appicon.png" width="128" alt="One-Shot" />
</div>

# One-Shot

**Lightning-fast desktop context builder for LLMs — Wails, Go y React.**

Copia tu codebase completo, con grafo de dependencias, listo para pegar en cualquier chatbot.

One-Shot escanea tu repositorio, te deja marcar los archivos que importan y arma **un solo mensaje** con la estructura del proyecto, el grafo de imports y el código. Lo copias al portapapeles y lo pegas en ChatGPT, Claude, Kimi o donde sea.

No tiene proveedores de IA integrados, no pide API keys, no manda nada a ningún servidor. Solo copia — bien.

## Qué genera

```markdown
# Codebase: mi-proyecto
53 archivos · 176.3 KB · ~45.1k tokens aprox.

## Estructura          ← árbol ASCII de lo seleccionado
## Grafo de dependencias
   Puntos de entrada   ← qué archivos nadie importa
   Deps externas       ← react (23), lucide-react (11)...
   Mapa módulo a módulo ← qué define, qué importa, quién lo usa
## Recursos binarios   ← imágenes y assets: ruta y peso, nunca sus bytes
## Archivos            ← el código, en bloques por lenguaje
```

Los archivos no textuales (PNG, fuentes, binarios) se detectan con la heurística de git
(byte NUL o UTF-8 inválido) y se listan con su peso: aparecen en el árbol para que el
chatbot sepa que existen, pero su contenido nunca entra al portapapeles.

El grafo se calcula por lenguaje (TypeScript/JavaScript, Go, Python, CSS): resuelve imports relativos,
`index.*`, paquetes de Go por carpeta, e ignora la stdlib para que la lista de dependencias externas
sea útil de verdad.

## Uso

1. Abre One-Shot y elige tu repositorio.
2. Marca archivos o carpetas (`Todo` / `Fuente` / `Config` para selección rápida).
3. Opcional: escribe el objetivo que quieres que el chatbot resuelva.
4. **Copiar todo** (`⌘/Ctrl + Enter`) y pega en tu chat.

### + Dependencias

Marca el archivo que te importa y pulsa **+ Dependencias**: One-Shot recorre el grafo
del proyecto completo y añade todo lo que ese archivo importa, transitivamente. Es la
forma rápida de armar un contexto que se sostiene solo, sin cazar imports a mano.

### Sesión

Al cerrar y volver a abrir recuperas el último proyecto, la selección y las opciones.
Las rutas que ya no existan se descartan al reescanear.

Botones extra: `Vista previa` para ver el resultado antes de copiar, `Guardar .md` para dejarlo en disco.
El contador de tokens se pone en rojo arriba de 200k, donde la mayoría de los chats
rechazan un pegado de una sola vez.

## Opciones

| Sección | Qué incluye |
| --- | --- |
| Estructura | Árbol de carpetas de lo seleccionado |
| Grafo | Imports, quién usa qué, dependencias externas |
| Código | Contenido completo de cada archivo |

Apagar `Código` y dejar solo `Estructura` + `Grafo` da un resumen arquitectónico muy barato en tokens.

## Instalación

Requisitos: [Go](https://go.dev/) 1.24+, [Node.js](https://nodejs.org/) 20+, [Wails](https://wails.io/) v2.

```bash
git clone https://github.com/obeskay/one-shot.git
cd one-shot
npm install
wails dev      # desarrollo
wails build    # binario en build/bin
```

## Stack

- **Backend**: Go (escaneo, grafo, armado del payload, portapapeles nativo)
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Shell**: Wails v2

El copiado ocurre en Go (`runtime.ClipboardSetText`), no en el webview: `navigator.clipboard` falla con
payloads de cientos de miles de caracteres.

## Tests

```bash
go test ./internal/...
npm run typecheck
```

## Por que quedo asi de simple

Este repo nacio como un constructor de contexto y, commit a commit, se le fueron
injertando proveedores de IA: OpenAI, Anthropic, Gemini, un chat con streaming, un
wizard de API keys, deteccion de CLIs de agentes instalados. La app termino
lanzando `provider not registered: agy` en la cara del usuario — un id de proveedor
que la UI ofrecia y el backend nunca habia registrado. Mientras tanto el boton de
copiar, que era el producto entero, estaba en un componente que ni siquiera se
montaba en el layout.

La correccion no fue arreglar el registro de proveedores. Fue borrarlos: `internal/llm`,
`internal/secrets`, `internal/jobs`, el wizard, el chat. Menos 24 mil lineas.

La leccion es de arquitectura, no de estilo. Una herramienta con **una sola
responsabilidad** — aqui: convertir una seleccion de archivos en un bloque de texto —
tiene una superficie donde el error es imposible de esconder. Si copia mal, lo ves
en el portapapeles. Cuando esa misma herramienta ademas habla con cuatro APIs,
guarda llaves en el keyring, mantiene un chat con streaming y detecta binarios en tu
PATH, el fallo aparece a tres saltos de donde lo causaste.

Vale la pena decirlo en terminos de como se trabaja hoy con agentes: **maquinitas
aisladas**, cada una con un contrato chico y verificable, encadenadas por el humano.
No un organismo que lo hace todo y en el que la IA tiene que salir a *descubrir* que
esta roto. Una maquinita que copia bien es un **checkpoint**: entra una seleccion,
sale un texto, lo pegas donde quieras y ese pegado o funciona o no. Lo que sigue —
el modelo, el prompt, la conversacion — es problema de otra maquinita, la que ya
existe y se llama ChatGPT, Claude o Kimi.

Por eso One-Shot no tiene proveedores de IA. No es minimalismo estetico: es que el
limite de la herramienta sea el mismo limite donde puedes verificar que hizo su
trabajo.

## Licencia

MIT. Ver `LICENSE`.
