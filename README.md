# OpenRemote

**Multi-platform SSH & SFTP client.** **Docker** and **Kubernetes** workflows are planned with **milestone priority before WebDAV**; WebDAV and S3-compatible cloud storage follow on the roadmap.

OpenRemote is built with Electron, React, and TypeScript. The app shell (window, settings, themes, i18n, welcome flow) is in place; **SSH, SFTP, and subsequent protocol work** land per the roadmap in `docs/dev/09-roadmap.md`.

## Tech Stack

- **Runtime**: Electron
- **UI**: React 19+ TypeScript + Tailwind CSS 4
- **Components**: shadcn/ui patterns + Base UI
- **Animation**: Motion (Framer Motion)
- **State**: Zustand
- **Terminal (planned)**: [xterm.js](https://xtermjs.org/) (`@xterm/xterm`) in the renderer for SSH/PTY sessions
- **Remote editing (planned)**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) for text files over SFTP (or equivalent remote I/O)
- **Build**: Vite + Electron Forge

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts        # Window creation, app lifecycle
│   └── settings.ts     # Settings persistence
├── preload/        # Context bridge (secure IPC)
│   └── index.ts
├── renderer/       # React UI
│   ├── App.tsx
│   ├── main.tsx
│   ├── assets/         # CSS
│   ├── components/     # Shared components
│   ├── views/          # View components
│   ├── store/          # Zustand store
│   └── lib/            # Utilities
├── shared/         # Types & IPC channels shared between processes
│   ├── types.ts
│   └── ipc.ts
themes/             # Theme JSON files
```

## Current capabilities (app shell)

- Toast notifications
- Custom title bar with traffic light support (macOS)
- Settings persistence (window state, theme, language)
- Welcome screen and product positioning copy

## Roadmap (remote & cloud)

- SSH sessions (**xterm.js** terminal UI) and SFTP file browsing (planned); **Monaco Editor** for remote text files (planned)
- **Docker** and **Kubernetes** (contexts, containers/pods, logs, port-forward/exec — **scheduled before WebDAV**)
- WebDAV support
- S3-compatible object storage (e.g. MinIO, R2)

Chinese-language developer docs live under `docs/dev/`.
