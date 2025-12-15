# one-shot

> constructor de contexto para llms - genera payloads optimizados para modelos de lenguaje

<div align="center">

![one-shot](https://img.shields.io/badge/one--shot-v0.1.0-black?style=flat-square)
![react](https://img.shields.io/badge/react-19-61dafb?style=flat-square)
![tailwind](https://img.shields.io/badge/tailwind-v4-38bdf8?style=flat-square)
![wails](https://img.shields.io/badge/wails-go-00add8?style=flat-square)

</div>

## qué es

one-shot es una aplicación de escritorio que permite a desarrolladores construir contexto estructurado para modelos de lenguaje (llms) de manera visual e intuitiva.

### características

- **explorador de archivos** - navega tu proyecto y selecciona archivos relevantes
- **estrategias de contexto** - elige entre contenido raw o resúmenes ia
- **vista previa** - previsualiza el payload antes de copiarlo
- **chat integrado** - interactúa con llms usando el contexto seleccionado
- **multi-proveedor** - soporta anthropic, google, openai y modelos locales

## stack técnico

| capa | tecnología |
|------|------------|
| frontend | react 19, typescript, tailwind css v4 |
| backend | go, wails v2 |
| ui | sistema de diseño minimalista monocromático |

## instalación

### prerrequisitos

- [go](https://golang.org/) 1.21+
- [node.js](https://nodejs.org/) 20+
- [wails](https://wails.io/) v2

### desarrollo

```bash
# clonar repositorio
git clone https://github.com/tu-usuario/one-shot.git
cd one-shot

# instalar dependencias frontend
npm install

# ejecutar en modo desarrollo
wails dev
```

### build

```bash
# compilar para tu plataforma
wails build

# el ejecutable estará en build/bin/
```

## sistema de diseño

one-shot usa un sistema de tokens semánticos basado en tailwind v4:

### colores

```css
/* superficies */
--color-canvas: #fcfbf9      /* fondo principal */
--color-surface: #f5f5f5     /* cards/panels */
--color-surface-elevated: #ffffff

/* texto */
--color-ink: #171717         /* texto principal */
--color-ink-subtle: #a3a3a3  /* texto secundario */
--color-ink-inverted: #fcfbf9

/* bordes */
--color-stroke: #e5e5e5
--color-stroke-emphasis: #d4d4d4

/* estados */
--color-status-ready: #10b981
--color-status-error: #ef4444
```

### tipografía

- display: clamp(2.5rem, 6vw, 4.5rem)
- micro: 0.625rem con tracking-widest
- fuente mono para código

### patrones

- **border-radius orgánico** - corners asimétricos (40px/8px)
- **animaciones expo-out** - cubic-bezier(0.16, 1, 0.3, 1)
- **lowercase dominante** - toda la ui en minúsculas

## estructura del proyecto

```
one-shot/
├── components/
│   ├── features/         # componentes de dominio
│   │   ├── Chat/
│   │   ├── Context/
│   │   ├── Settings/
│   │   └── Tree/
│   ├── Layout/           # layout principal
│   ├── OneShot/          # componentes core
│   └── ui/               # sistema de diseño
├── contexts/             # react context providers
├── hooks/                # custom hooks
├── internal/             # backend go
│   ├── app/
│   ├── context/
│   ├── domain/
│   └── llm/
├── services/             # bridge frontend-backend
├── utils/                # utilidades
├── index.css             # design tokens (tailwind v4)
└── App.tsx
```

## configuración

### proveedores de ia

one-shot soporta múltiples proveedores:

| proveedor | requiere api key | modelos |
|-----------|------------------|---------|
| anthropic | sí | claude-3.5-sonnet, claude-3-opus |
| google | sí | gemini-2.0-flash, gemini-1.5-pro |
| openai | sí | gpt-4o, gpt-4-turbo |
| claude cli | no | claude local |

configura tu proveedor en ajustes (⚙️) o define la variable de entorno correspondiente.

## licencia

mit

## contribuir

1. fork el repositorio
2. crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. commit tus cambios (`git commit -am 'feat: agregar nueva característica'`)
4. push a la rama (`git push origin feature/nueva-caracteristica`)
5. abre un pull request

---

<div align="center">
<sub>hecho con 🖤 para desarrolladores que usan ia</sub>
</div>
