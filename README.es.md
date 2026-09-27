<div align="center">
  <img src="build/appicon.png" width="128" alt="One-Shot" />

  # One-Shot

  **Arma contexto para LLMs desde tu escritorio — Wails, Go y React.**

  [English](README.md) · Español
</div>

Todo chatbot necesita contexto de tu código. One-Shot lo arma en tu máquina: sin API key, sin servidor remoto, sin depender de la nube.

One-Shot escanea tu repositorio, te deja elegir los archivos que importan y arma **un solo mensaje estructurado** con el árbol del proyecto, el grafo de dependencias y el código. Lo copias al portapapeles y lo pegas en ChatGPT, Claude, Kimi o cualquier otro chatbot.

Sin proveedores de IA integrados. Sin API keys. Sin telemetría. Solo empaqueta contexto.

La interfaz y el mensaje que genera están en español; este README cita las etiquetas tal como aparecen en la app.

---

## Qué genera

One-Shot convierte tu codebase en un solo mensaje jerárquico:

```markdown
# Codebase: mi-proyecto

53 archivos de texto · 176.3 KB · ~45.1k tokens aprox.
Contexto generado con One-Shot. Todo lo necesario esta en este mensaje.

## Objetivo                         ← lo que quieres que haga el modelo, si lo escribiste
## Estructura                       ← árbol ASCII de los archivos seleccionados
## Grafo de dependencias
   Puntos de entrada                ← archivos que nada más en la selección importa
   Dependencias externas mas usadas ← react (23), lucide-react (11)...
   Mapa modulo por modulo           ← por archivo: qué define, qué importa, quién lo usa
## Recursos binarios                ← imágenes y assets: ruta y peso, nunca sus bytes
## Archivos                         ← el código, en bloques por lenguaje
```

- **Los binarios se listan, nunca se transcriben**: cada archivo se clasifica por su contenido, al estilo de git: un byte NUL, o más de 10% de UTF-8 inválido, en los primeros 8 KB lo marca como binario (imágenes, fuentes, compilados). Los binarios aparecen en el árbol y en `Recursos binarios` con su peso, para que el modelo sepa que existen, pero sus bytes nunca llegan al portapapeles.
- **Grafo de dependencias por lenguaje**: los imports se extraen con patrones por lenguaje para TypeScript/JavaScript, Go, Python y CSS. Los imports relativos de TS/JS/CSS se resuelven a archivos del proyecto (incluidos `index.*` y `.js` → `.ts`), y los de Go a los archivos de la carpeta del paquete. Los imports de Python todavía no se resuelven a archivos: los absolutos se listan como nombres externos y los relativos se omiten. La biblioteca estándar de Go queda fuera del conteo de dependencias externas.

---

## Funciones principales

- **Dependencias transitivas**: selecciona archivos y presiona **+ Dependencias**. One-Shot recorre el grafo de imports de todo el proyecto y agrega cada archivo que tu selección importa, de forma transitiva.
- **Portapapeles nativo**: el copiado ocurre en Go (`runtime.ClipboardSetText`), no en el webview, donde `navigator.clipboard` falla con payloads grandes o sin un gesto directo del usuario.
- **Estimación de tokens en vivo**: más o menos un token por cada 4 bytes; se actualiza mientras seleccionas (sin contar binarios). Arriba de 200k tokens, donde la mayoría de los chats rechaza un pegado de una sola vez, el contador muestra una advertencia.
- **Secciones activables**: prende o apaga `Estructura`, `Grafo` y `Codigo` por separado. Con `Codigo` apagado obtienes un resumen arquitectónico que cuesta pocos tokens.
- **Cero nube**: corre solo en tu máquina. Tu código nunca pasa por un proxy ni por un servidor de terceros.
- **Sesión persistente**: vuelve a abrir tu último repositorio, tu selección y tus opciones. Los archivos que ya no existen se descartan al reescanear.

---

## Uso

1. Abre One-Shot, presiona **Abrir Repositorio** y elige la carpeta de tu repositorio.
2. Marca archivos o carpetas, o usa los filtros rápidos (`Todo` / `Fuente` / `Config`).
3. *(Opcional)* Escribe el objetivo que quieres que resuelva el modelo.
4. Presiona **copiar todo** (`⌘/Ctrl + Enter`) y pega el mensaje en tu chat.

`Vista previa` muestra el mensaje antes de copiarlo, `Guardar .md` lo guarda en disco y los botones de ChatGPT, Claude y Kimi abren esos chats en tu navegador. `⌘/Ctrl + K` te lleva al filtro de archivos.

### Contexto transitivo (`+ Dependencias`)

Selecciona el archivo que te interesa y presiona **+ Dependencias**. One-Shot sigue la cadena completa de imports en todo el proyecto (TS/JS/CSS y Go) y selecciona cada archivo del que depende, para que no tengas que perseguir imports a mano.

---

## Instalación y arranque rápido

### Requisitos

- [Go](https://go.dev/) 1.24 o superior
- [Node.js](https://nodejs.org/) 20.19+ o 22.12+
- CLI de [Wails](https://wails.io/) v2 (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Compilar desde el código fuente

```bash
# Clona el repositorio
git clone https://github.com/obeskay/one-shot.git
cd one-shot

# Instala las dependencias del frontend
npm install

# Modo de desarrollo en vivo
wails dev

# Binario de producción (queda en build/bin)
wails build
```

---

## Arquitectura y stack

- **Backend**: Go 1.24 (escáner de directorios, grafo de imports por patrones, armado del payload, portapapeles nativo del sistema)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Runtime de escritorio**: Wails v2

```
one-shot/
├── main.go               Punto de entrada y arranque de Wails
├── internal/
│   ├── app/              Ciclo de vida de Wails, estado del proyecto, puente al portapapeles
│   ├── domain/           Tipos base (Project, FileNode, TreeSnapshot) y sus DTOs
│   ├── fs/               Escáner del sistema de archivos y detección de binarios
│   ├── graph/            Extracción de imports por lenguaje (Go, TS/JS, Python, CSS)
│   ├── ignore/           Reglas de .gitignore y exclusiones por defecto
│   └── payload/          Armado del payload y estimación de tokens
├── components/           Componentes y layout de React
└── services/             Puente con Wails y persistencia de la sesión
```

---

## Verificación y pruebas

```bash
# Pruebas unitarias de Go
go test ./internal/...

# Typecheck del frontend
npm run typecheck
```

---

## Por qué quedó así de simple

One-Shot nació como un constructor de contexto enfocado. Iteración tras iteración se le fueron injertando funciones: clientes de API para OpenAI, Anthropic y Gemini, un chat con streaming, un wizard para administrar API keys y detectores de CLIs de agentes instalados.

El punto de quiebre llegó cuando la app terminó lanzándole al usuario `provider not registered: agy`: un id de proveedor que la UI ofrecía y que el backend nunca registró. Mientras tanto, el botón de copiar, que era todo el producto, vivía en un componente que nunca se montaba.

La corrección no fue arreglar el registro de proveedores. Fue borrarlo: `internal/llm`, `internal/secrets`, `internal/jobs`, el wizard y el chat. **24 mil líneas borradas de un solo corte.**

Una herramienta con una sola responsabilidad (convertir una selección de archivos en un bloque de contexto) no tiene dónde esconder errores. Si falla, lo ves en el portapapeles de inmediato. Cuando esa misma herramienta además habla con cuatro APIs externas, guarda llaves en el keyring del sistema, hace streaming de respuestas y revisa tu `$PATH`, el fallo aparece a tres capas de abstracción de su causa.

En los flujos actuales con agentes, el valor está en **maquinitas aisladas**: checkpoints chicos y verificables que encadena quien desarrolla. Entra una selección de archivos, sale un bloque de contexto estructurado. Lo pegas donde quieras y ese pegado funciona o no. La inferencia que sigue le toca a las herramientas hechas para eso (ChatGPT, Claude, Kimi).

One-Shot no tiene proveedores de IA a propósito. Ese límite hace que las fronteras de la herramienta coincidan con las fronteras donde puedes verificar su trabajo.

---

## Licencia

MIT. Ver [LICENSE](LICENSE).
