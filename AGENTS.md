# AGENTS.md

## Project

**OpenRemote** — Electron + React cross-platform desktop app. Product focus: **SSH & SFTP** remote access; **Docker** and **Kubernetes** are planned with **milestone priority before WebDAV**; **WebDAV** and **S3-compatible** storage follow. The codebase centers on the **app shell** (window, settings, themes, i18n) while remote protocol features are added over time. Three-process architecture: main, preload, renderer.

## Architecture

```
src/
  main/           Electron main process (Node.js)
    index.ts        App lifecycle, window creation, IPC registration
    settings.ts     Config persistence (JSON in userData)
  preload/
    index.ts        contextBridge API (type-safe IPC bridge)
  shared/
    types.ts        Shared type definitions (both processes)
    ipc.ts          IPC channel name constants
  renderer/         React UI (Vite dev server on :5173)
    store/index.ts  Zustand store (global state + actions)
    views/          Feature views (grow with milestones)
    components/     Reusable UI components (shadcn/ui pattern)
    hooks/          Custom hooks (keyboard shortcuts, theme)
    i18n/           Translation strings (en, zh)
```

## Key Patterns

- **IPC flow**: Renderer → `window.api.*` → preload → `ipcMain.handle` → main-process adapters (settings today; SSH/SFTP and other backends as they ship).
- **Adding a feature** typically requires:
  1. `src/shared/ipc.ts` — add channel constant
  2. `src/main/` — add handler module and register it
  3. `src/preload/index.ts` — expose API method
  4. `src/renderer/store/index.ts` — add action + state as needed
- **State management**: Zustand store; actions call `window.api.*`
- **Path alias**: `@shared` → `src/shared`, `@renderer` → `src/renderer` (configured in all vite configs + tsconfig)

## Commands

```bash
npm run dev          # Dev mode: builds main+preload, starts Vite dev server, launches Electron
npm run build        # Production build (main → preload → renderer, sequential)
npm run build:main   # Build only main process
npm run build:preload # Build only preload script
npm run build:renderer # Build only renderer process
npm run make         # Build + package with electron-forge
npm run typecheck    # tsc --noEmit (all processes)
```

## Build Verification

Always run `npm run build` after changes — it catches type errors and import issues across all three processes. There is no test suite yet.

## Dev Server Quirk

`scripts/dev.mjs` temporarily renames `node_modules/electron` to `electron.bak` during dev to avoid require conflicts. If the process crashes, run manually:

```bash
mv node_modules/electron.bak node_modules/electron
```

## Conventions

- **Terminal**: Plan to embed **xterm.js** (`@xterm/xterm`) in the renderer for SSH/PTY output; main process owns the pty/socket and streams bytes over IPC (see `docs/dev/02-tech-stack.md`).
- **Remote file editor**: Plan to use **monaco-editor** for editing remote text files (load/save via IPC + SFTP or protocol-specific handlers).
- UI components use shadcn/ui patterns with Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Animations via `motion/react` (Framer Motion)
- Icons from `lucide-react`
- Main process output format is CJS (`format: 'cjs'` in vite.main.config.ts)
- No ESLint config file exists yet — `npm run lint` will fail without one
- Config stored at `app.getPath('userData')/config.json` with `.bak` auto-backup on corruption
- Toast notifications for user-facing operation feedback
