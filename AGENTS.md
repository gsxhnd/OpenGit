# AGENTS.md

## Project

**Puck** — Electron + React cross-platform desktop app. Product focus: **SSH & SFTP** remote access; **Docker** and **Kubernetes** are planned with **milestone priority before WebDAV**; **WebDAV** and **S3-compatible** storage follow. The codebase centers on the **app shell** (window, settings, themes, i18n) while remote protocol features are added over time. Three-process architecture: main, preload, renderer.

## Architecture

```
src/
  main/                 Electron main process (Node.js CJS)
    index.ts              App lifecycle, window, IPC registration, menu
    config-manager.ts     Config read/write (userData/config.json, .bak on corruption)
    handlers/             IPC handler modules (settings, pty, ssh, sftp)
  preload/
    index.ts              contextBridge entry — exposes `window.api`
    api/                  Modular API impl — one module per domain (settings, window, ssh, sftp, pty, ...)
  shared/
    types.ts              Shared type definitions (both processes)
    ipc.ts                IPC channel name constants
  renderer/               React UI (Vite dev server on :5173)
    store/index.ts        Zustand store (global state + actions)
    views/                Feature views (welcome, local-terminal, session, settings)
    components/           Reusable UI (shadcn/ui + custom: XtermPane, SftpTreeView, ...)
    hooks/                Custom hooks (keyboard shortcuts, theme)
    i18n/                 Translation strings (en, zh)
    lib/utils.ts          shadcn/ui utility (cn, cva)
themes/                   Theme JSON files (loaded by main process)
```

## Key Patterns

- **IPC flow**: Renderer calls `window.api.*` → preload `api/` → `ipcMain.handle` → main process handlers.
- **Adding a feature** requires:
  1. `src/shared/ipc.ts` — add channel constant
  2. `src/main/handlers/` — add handler module and register in `src/main/index.ts`
  3. `src/preload/api/` — add API module and wire into `src/preload/api/index.ts`
  4. `src/renderer/store/index.ts` — add state/action as needed
- **State management**: Zustand store; actions call `window.api.*`.
- **Routing**: `HashRouter` from `react-router` — routes defined in `src/renderer/routes.tsx`.
- **Path aliases**: `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/*` (configured in vite configs + tsconfig).
- **Per-process tsconfig**: each process extends `tsconfig.json` (`tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json`) — `npm run typecheck` uses the root tsconfig which includes all processes plus config files.

## Commands

```bash
npm run dev            # Builds main+preload (Vite programmatic), starts Vite renderer dev server, launches Electron
npm run build          # Production build: main → preload → renderer (sequential)
npm run build:main     # Build only main process
npm run build:preload  # Build only preload script
npm run build:renderer # Build only renderer process
npm run make           # Build + package with electron-forge
npm run publish        # Build + publish GitHub release (draft)
npm run typecheck      # tsc --noEmit (root tsconfig.json — covers all processes)
npm run lint           # eslint — FAILS (no ESLint config exists)
```

## Build Verification

Always run `npm run build` after changes — it catches type errors, import issues, and bundling failures across all three processes. `npm run typecheck` for strict type checks. No test suite exists yet.

## Dev Server Quirk

`scripts/dev.mjs` temporarily renames `node_modules/electron` to `electron.bak` during dev to avoid `require('electron')` shim conflicts. If the process crashes without restoring:

```bash
mv node_modules/electron.bak node_modules/electron
```

## Conventions

- UI: shadcn/ui patterns + `@base-ui/react`, Tailwind CSS v4 (`@tailwindcss/vite`), SCSS modules (`sass` devDep)
- Icons: `lucide-react`; Animation: `motion/react` (Framer Motion)
- Terminal (renderer): `@xterm/xterm` + `@xterm/addon-fit` — main process streams PTY bytes over IPC
- Remote file editor: `monaco-editor` — load/save via IPC + SFTP handlers
- Main process output is CJS (`format: 'cjs'` in both vite.main.config.ts and vite.preload.config.ts)
- Config: `app.getPath('userData')/config.json` with `.bak` auto-backup on corruption
- Toast notifications via `sonner` wrapper component (`ToastContainer.tsx`)
