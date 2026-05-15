# AGENTS.md

## Project

**Puck** — Electron + React cross-platform desktop app. Product focus: **SSH & SFTP** remote access; **Docker** and **Kubernetes** are planned with **milestone priority before WebDAV**; **WebDAV** and **S3-compatible** storage follow. Three-process architecture: main, preload, renderer.

## Architecture

```
src/
  main/                 Electron main process (Node.js CJS)
    index.ts              App lifecycle, window, IPC registration, menu
    config-manager.ts     Config read/write (userData/config.json, .bak on corruption)
    pty-handlers.ts       Local PTY IPC handlers (lives directly in main/, not handlers/)
    ssh-handlers.ts       SSH IPC handlers (lives directly in main/, not handlers/)
    ssh-connection-manager.ts  SSH connection lifecycle
    known-hosts-manager.ts     Fingerprint store
    handlers/             Additional IPC handler modules
      settings-handler.ts
      ssh-sftp-handler.ts
      local-files-handler.ts
  preload/
    index.ts              contextBridge entry — exposes `window.api`
    api/                  One module per domain: settings, window, ssh, sftp, pty, dialogs,
                          hosts, known-hosts, local-files — aggregated in api/index.ts
  shared/
    types.ts              Shared type definitions (both processes)
    ipc.ts                IPC channel name constants
    build.ts              isDev / rendererUrl — injected by Vite `define` at build time
  renderer/               React UI (Vite dev server on :5173)
    store/index.ts        Zustand store (global state + actions)
    routes.tsx            HashRouter routes (dashboard, connections, local-terminal,
                          sessions, session/:connectionId, files, settings)
    views/                Feature views
    components/           Reusable UI (shadcn/ui + custom: XtermPane, SftpTreeView, ...)
    hooks/                Custom hooks (keyboard shortcuts, theme)
    i18n/                 Translation strings (en, zh)
    lib/utils.ts          shadcn/ui utility (cn, cva)
themes/                   Theme JSON files (loaded by main process)
```

## Commands

There is **no single `npm run dev` script**. Dev mode requires three terminals:

```bash
# Terminal 1 — renderer hot-reload
npm run dev:renderer

# Terminal 2 — main process watch build
npm run dev:main

# Terminal 3 — preload watch build
npm run dev:preload

# Terminal 4 (after builds settle) — launch Electron
npm run electron
```

```bash
npm run build          # Production build: main → preload → renderer (sequential)
npm run build:main     # Build only main process
npm run build:preload  # Build only preload script
npm run build:renderer # Build only renderer process
npm run make           # Build + package with electron-forge
npm run publish        # Build + publish GitHub release (draft)
npm run typecheck      # tsc --noEmit (root tsconfig.json — covers all processes)
npm run lint           # FAILS — no ESLint config exists in the repo
```

## Build Verification

Always run `npm run build` after changes — it catches type errors, import issues, and bundling failures across all three processes. `npm run typecheck` for strict type checks. No test suite exists.

## Key Patterns

- **IPC flow**: Renderer calls `window.api.*` → preload `api/` → `ipcMain.handle` → main process handlers.
- **Adding a feature** requires:
  1. `src/shared/ipc.ts` — add channel constant
  2. `src/main/handlers/` or `src/main/` — add handler and register in `src/main/index.ts`
  3. `src/preload/api/` — add API module and wire into `src/preload/api/index.ts`
  4. `src/renderer/store/index.ts` — add state/action as needed
- **State management**: Zustand store; actions call `window.api.*`.
- **Routing**: `HashRouter` — routes defined in `src/renderer/routes.tsx`.
- **Path aliases**: `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/*` (vite configs + tsconfig).
- **Per-process tsconfig**: `tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json` all extend root `tsconfig.json`. `npm run typecheck` uses root and covers all three.
- **CJS output**: main and preload both build to CJS (`format: 'cjs'`). Renderer builds ESM.
- **`isDev` / `rendererUrl`**: read from `src/shared/build.ts` — values injected by Vite `define` in `vite.main.config.ts`. Dev renderer URL is `http://localhost:5173`.
- **React DevTools**: loaded automatically in dev mode from `extensions/react_dev_tool/7.0.1_0/` if the directory exists.

## Conventions

- UI: shadcn/ui patterns + `@base-ui/react`, Tailwind CSS v4 (`@tailwindcss/vite`), SCSS modules (`sass` devDep)
- Icons: `lucide-react`; Animation: `motion/react` (Framer Motion v12)
- Terminal (renderer): `@xterm/xterm` + `@xterm/addon-fit` — main process streams PTY bytes over IPC
- Remote file editor: `monaco-editor` — load/save via IPC + SFTP handlers
- Config: `app.getPath('userData')/config.json` with `.bak` auto-backup on corruption
- Toast notifications via `sonner` wrapper component (`ToastContainer.tsx`)
- SSH host profiles stored in `AppSettings.hosts[]` (persisted in config.json); fingerprints stored separately via `known-hosts-manager.ts`
- `ssh2` and `node-pty` are externalized from the Vite bundle (native modules, loaded at runtime by Electron)
