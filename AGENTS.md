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
                          sessions, session/:connectionId, files)
                          NOTE: Settings is no longer a route — it opens as a Dialog.
    views/                Feature views
    components/           Reusable UI (shadcn/ui + custom: XtermPane, SftpTreeView, ...)
    hooks/                Custom hooks (keyboard shortcuts, theme)
    i18n/                 Translation strings (en, zh)
    lib/utils.ts          shadcn/ui utility (cn, cva)
themes/                   Theme JSON files (loaded by main process)
```

## UI Layout

The shell uses a **3-column panel architecture**. Each panel is a full-height column with its own header:

```
macOS:
+---[Primary Panel]---+--------[Main Panel]--------+---[Second Panel]---+
| [🔴🟡🟢]       [◀] | [Title / user@host] [⌘K][⊞]| [✕]  Panel         |
| PrimaryPanelHeader  | MainHeader                  | SecondPanelHeader  |
+---------------------+-----------------------------+--------------------+
| [🏠]  |  Sidebar    |  SessionTabs (conditional)  | Tabs               |
| [🔌]  |  content    +-----------------------------+ Properties         |
| [▶️]  |             |  Main Content (<Outlet />)  | Transfers          |
| [📁]  |             |                             | Diagnostics        |
| [⚙️]  |             |                             |                    |
+---------------------+-----------------------------+--------------------+
|                            StatusBar                                    |
+-------------------------------------------------------------------------+

Windows / Linux:
+---[Primary Panel]---+--------[Main Panel]--------+---[Second Panel]---+
| [File|Edit|View][◀] | [Title]         [⌘K] [⊞]  | [✕] Panel [-][□][×]|
+---------------------+-----------------------------+--------------------+
| ...same body...                                                         |
+-------------------------------------------------------------------------+
```

Win/Linux window controls (minimize/maximize/close) live in the **rightmost visible panel's header**:
- SecondPanel open → controls in SecondPanel header
- SecondPanel closed → controls in MainHeader

### Shell Components

| Component | File | Description |
|-----------|------|-------------|
| `PrimaryPanelHeader` | `components/shell/PrimaryPanelHeader.tsx` | macOS: traffic-light space + collapse toggle. Win/Linux: AppMenubar + collapse toggle. Collapsed: just expand toggle centered. |
| `MainHeader` | `components/shell/MainHeader.tsx` | Title + command palette + SecondPanel toggle. Win/Linux: window controls when SecondPanel is closed. |
| `AppMenubar` | `components/shell/AppMenubar.tsx` | Win/Linux only. shadcn Menubar (File/Edit/View/Help). |
| `WinControlButtons` | `components/shell/WinControlButtons.tsx` | Shared minimize/maximize/close buttons for Win/Linux. Used by MainHeader and SecondPanel. |
| `ActivityBar` | `components/shell/ActivityBar.tsx` | Always icon-only mode (fixed narrow width). Settings gear at bottom opens SettingsDialog. |
| `PrimarySidebar` | `components/shell/PrimarySidebar.tsx` | 248px context-aware sidebar. Hidden when collapsed. |
| `SecondPanel` | `components/shell/SecondPanel.tsx` | Optional right panel (280px). Has its own header with close button + Win/Linux window controls. |
| `SecondPanelToggle` | `components/shell/SecondPanelToggle.tsx` | Button in MainHeader to toggle SecondPanel. |
| `SessionTabs` | `components/shell/SessionTabs.tsx` | Horizontal tab bar in Main Panel, shown on all routes except dashboard. |
| `PanelContainer` | `components/shell/PanelContainer.tsx` | Thin flex wrapper around the routed view. |
| `StatusBar` | `components/shell/StatusBar.tsx` | 28px footer spanning full width. |
| `SettingsDialog` | `components/settings/SettingsDialog.tsx` | Centered modal dialog wrapping SettingsView. |

### Primary Panel

- `ActivityBar` (always icon-only) + `PrimarySidebar` (hidden when collapsed)
- Wrapped in `.primaryPanel` container with unified background
- Dark mode: `backdrop-filter: blur(12px)` + semi-transparent background
- macOS: transparent background so Electron `vibrancy: 'sidebar'` shows through

### Settings

Settings is **not a route**. It opens as a centered `Dialog` modal (`SettingsDialog`) triggered by the gear icon at the bottom of `ActivityBar`. The `settingsOpen` boolean in the Zustand `UiSlice` controls visibility.

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
- **Routing**: `HashRouter` — routes defined in `src/renderer/routes.tsx`. Settings is a Dialog, not a route.
- **Path aliases**: `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/*` (vite configs + tsconfig).
- **Per-process tsconfig**: `tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json` all extend root `tsconfig.json`. `npm run typecheck` uses root and covers all three.
- **CJS output**: main and preload both build to CJS (`format: 'cjs'`). Renderer builds ESM.
- **`isDev` / `rendererUrl`**: read from `src/shared/build.ts` — values injected by Vite `define` in `vite.main.config.ts`. Dev renderer URL is `http://localhost:5173`.
- **React DevTools**: loaded automatically in dev mode from `extensions/react_dev_tool/7.0.1_0/` if the directory exists.
- **Header heights**: macOS 38px, Windows/Linux 32px. Both `PrimaryPanelHeader` and `MainHeader` use the same height on the same platform.
- **Platform detection**: `const isMac = (window.api as { platform?: string }).platform === 'darwin'` in renderer components.

## Conventions

- UI: shadcn/ui patterns + `@base-ui/react`, Tailwind CSS v4 (`@tailwindcss/vite`), SCSS modules (`sass` devDep)
- Icons: `lucide-react`; Animation: `motion/react` (Framer Motion v12)
- Terminal (renderer): `@xterm/xterm` + `@xterm/addon-fit` — main process streams PTY bytes over IPC
- Remote file editor: `monaco-editor` — load/save via IPC + SFTP handlers
- Config: `app.getPath('userData')/config.json` with `.bak` auto-backup on corruption
- Toast notifications via `sonner` wrapper component (`ToastContainer.tsx`)
- SSH host profiles stored in `AppSettings.hosts[]` (persisted in config.json); fingerprints stored separately via `known-hosts-manager.ts`
- `ssh2` and `node-pty` are externalized from the Vite bundle (native modules, loaded at runtime by Electron)
