# One-Shot

**Copia tu codebase completo, con grafo de dependencias, listo para pegar en cualquier chatbot.**

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

Botones extra: `Vista previa` para ver el resultado antes de copiar, `Guardar .md` para dejarlo en disco.

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

## Licencia

MIT. Ver `LICENSE`.
