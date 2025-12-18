# one-shot

> Context builder for LLMs – generate structured prompts from your codebase in one shot

<div align="center">

![one-shot](https://img.shields.io/badge/one--shot-v0.1.0-black?style=flat-square)
![react](https://img.shields.io/badge/react-19-61dafb?style=flat-square)
![tailwind](https://img.shields.io/badge/tailwind-v4-38bdf8?style=flat-square)
![wails](https://img.shields.io/badge/wails-go-00add8?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

<div align="center">
  <strong>stop copy-pasting files manually. curate context visually.</strong>
</div>

---

## ✨ what it does

one-shot is a desktop app that lets developers build structured context payloads for large language models (LLMs). select files from your project, define your goal, and get an optimized prompt ready to paste.

### features

- 🗂️ **file explorer** – browse your project and pick relevant files
- 🎯 **strategy modes** – raw content or AI-powered summaries
- 👁️ **live preview** – see your payload before copying
- 💬 **integrated chat** – interact with LLMs using selected context
- 🔌 **multi-provider** – anthropic, google, openai, and local models

---

## 🛠️ stack

| layer    | tech                                     |
|----------|------------------------------------------|
| frontend | react 19, typescript, tailwind css v4    |
| backend  | go, wails v2                             |
| design   | custom monochromatic design system       |

---

## 🚀 quick start

### prerequisites

- [go](https://golang.org/) 1.21+
- [node.js](https://nodejs.org/) 20+
- [wails](https://wails.io/) v2

### development

```bash
# clone
git clone https://github.com/obeskay/one-shot.git
cd one-shot

# install frontend deps
npm install

# run dev mode
wails dev
```

### production build

```bash
# build for your platform
wails build

# binary output: build/bin/
```

---

## 🎨 design system

one-shot uses semantic design tokens built on tailwind v4:

### colors

```css
/* surfaces */
--color-canvas: #09090b      /* main bg */
--color-surface: #18181b     /* cards */
--color-surface-elevated: #27272a

/* text */
--color-ink: #fafafa         /* primary text */
--color-ink-muted: #a1a1aa   /* secondary */
--color-ink-subtle: #71717a  /* subtle */

/* status */
--color-status-ready: #10b981
--color-status-error: #ef4444
```

### typography

- display: `clamp(2.5rem, 6vw, 4.5rem)` – hero headlines
- micro: `0.625rem` with `letter-spacing: 0.1em` – labels
- monospace font stack for code

### motion

- expo-out easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- reveal animation: `translateY(20px) → 0` with staggered delays

---

## 📁 project structure

```
one-shot/
├── components/
│   ├── features/         # domain components
│   │   ├── Chat/
│   │   ├── Context/
│   │   ├── Settings/
│   │   └── Tree/
│   ├── Layout/           # main layout
│   ├── OneShot/          # core components
│   └── ui/               # design system primitives
├── contexts/             # react context providers
├── hooks/                # custom hooks
├── internal/             # go backend
│   ├── app/
│   ├── context/
│   ├── domain/
│   └── llm/
├── services/             # frontend-backend bridge
├── utils/                # utilities
├── index.css             # tailwind v4 tokens
└── App.tsx
```

---

## ⚙️ ai providers

| provider    | api key required | models                                |
|-------------|------------------|---------------------------------------|
| anthropic   | yes              | claude-3.5-sonnet, claude-3-opus      |
| google      | yes              | gemini-2.0-flash, gemini-1.5-pro      |
| openai      | yes              | gpt-4o, gpt-4-turbo                   |
| claude cli  | no               | local claude instance                 |

configure your provider in settings (⚙️) or via environment variables.

---

## 🤝 contributing

1. fork the repo
2. create a branch: `git checkout -b feature/amazing-feature`
3. commit changes: `git commit -am 'feat: add amazing feature'`
4. push: `git push origin feature/amazing-feature`
5. open a pull request

please follow [conventional commits](https://www.conventionalcommits.org/).

---

## 📄 license

[MIT](./LICENSE) © 2024

---

<div align="center">
<sub>made with 🖤 for developers who use AI</sub>
</div>
