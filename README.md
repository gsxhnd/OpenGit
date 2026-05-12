# OpenGit

A modern Git GUI built with Electron, React, and TypeScript.

## Tech Stack

- **Runtime**: Electron
- **UI**: React 19+ TypeScript + Tailwind CSS 4
- **Components**: shadcn/ui patterns + Base UI
- **Animation**: Motion (Framer Motion)
- **State**: Zustand
- **Git**:   system git CLI
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
│   ├── git-handlers.ts # IPC handlers for all git operations
│   ├── settings.ts     # Settings persistence
│   └── file-watcher.ts # FS watcher for auto-refresh
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

## Features

- Commit staging/unstaging with per-file diff
- Commit history with search and filters (author, file)
- Branch management (create, delete, checkout)
- Remote management (add, remove, fetch, pull, push)
- Tag management (lightweight and annotated)
- Stash management (create, apply, pop, delete)
- Commit graph visualization
- File search with blame and per-file history
- Reflog viewer
- Commit detail with full diff
- Toast notifications
- Custom title bar with traffic light support
- File system watcher for auto-refresh
- Settings persistence (window state, theme, workspace)
