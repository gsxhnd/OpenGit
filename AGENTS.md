# AGENTS.md

## Project

OpenGit — Electron + React desktop Git GUI. Three-process architecture: main, preload, renderer.

## Architecture

```
src/
  main/           Electron main process (Node.js, git CLI via child_process)
    index.ts        App lifecycle, window creation
    git-handlers.ts All git operations (IPC handlers)
    settings.ts     Config persistence (JSON in userData)
    file-watcher.ts fs.watch with 500ms debounce
  preload/
    index.ts        contextBridge API (type-safe IPC bridge)
  shared/
    types.ts        Shared type definitions (both processes)
    ipc.ts          IPC channel name constants
  renderer/         React UI (Vite dev server on :5173)
    store/index.ts  Zustand store (~900 lines, all state + actions)
    views/          One file per view (CommitView, DiffView, etc.)
    components/     Reusable UI components (shadcn/ui pattern)
    hooks/          Custom hooks (keyboard shortcuts, theme)
    i18n/           Translation strings (en, zh)
```

## Key Patterns

- **IPC flow**: Renderer → `window.api.*` → preload → `ipcMain.handle` → git CLI
- **Adding a feature** requires changes in 4 places:
  1. `src/shared/ipc.ts` — add channel constant
  2. `src/main/git-handlers.ts` — add handler
  3. `src/preload/index.ts` — expose API method
  4. `src/renderer/store/index.ts` — add action + state
- **Git operations** use `execFile('git', [...args])` — never shell strings
- **State management**: Single Zustand store, no Redux. Actions are async and call `window.api.*`
- **Path alias**: `@shared` → `src/shared`, `@renderer` → `src/renderer` (configured in all vite configs + tsconfig)

## Commands

```bash
npm run dev          # Dev mode: builds main+preload, starts Vite dev server, launches Electron
npm run build        # Production build (main → preload → renderer, sequential)
npm run build:main   # Build only main process
npm run build:renderer # Build only renderer
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

- UI components use shadcn/ui patterns with Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Animations via `motion/react` (Framer Motion)
- Icons from `lucide-react`
- Main process output format is CJS (`format: 'cjs'` in vite.main.config.ts)
- No ESLint config file exists yet — `npm run lint` will fail without one
- Config stored at `app.getPath('userData')/config.json` with `.bak` auto-backup on corruption
- Toast notifications for all user-facing operation feedback
- `ViewType` union in `types.ts` must be updated when adding new views
