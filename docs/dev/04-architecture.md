# 4. 系统架构

## 4.1 Electron 三进程架构

```
┌─────────────────────────────────────────────────────────┐
│                Renderer Process (渲染进程)               │
│  React UI (App.tsx → 13 Views + Components)             │
│  Zustand Store (全局状态)                                │
│  Tailwind CSS (样式) + Motion (动画)                    │
├─────────────────────────────────────────────────────────┤
│                Preload Script (预加载脚本)                │
│  contextBridge.exposeInMainWorld('api', { ... })       │
│  类型安全的 IPC 桥接                                     │
├─────────────────────────────────────────────────────────┤
│                  Main Process (主进程)                   │
│  Window Management (BrowserWindow)                      │
│  Git Handlers (git CLI via child_process.execFile)     │
│  Settings Persistence (JSON file I/O)                   │
│  File Watcher (fs.watch recursive)                      │
│  IPC Handlers (ipcMain.handle)                          │
└─────────────────────────────────────────────────────────┘
```

## 4.2 核心模块职责

| 模块 | 位置 | 职责 |
|------|------|------|
| **Window & App** | `src/main/index.ts` | BrowserWindow 创建、生命周期、IPC 注册、窗口状态保存 |
| **Git Operations** | `src/main/git-handlers.ts` | 所有 Git 操作，通过 `child_process.execFile` 调用系统 git，解析输出 |
| **Settings** | `src/main/settings.ts` | JSON 配置文件读写、损坏恢复、主题发现 |
| **File Watcher** | `src/main/file-watcher.ts` | 递归监听文件变更，500ms 防抖，忽略 .git 内部噪音，通知渲染进程刷新 |
| **Preload API** | `src/preload/index.ts` | contextBridge 暴露类型化 window.api，隔离 Node.js 环境 |
| **UI Store** | `src/renderer/store/index.ts` | Zustand Store，管理全部 UI 状态和 50+ Action 方法 |
| **UI Views** | `src/renderer/views/` | 13 个功能视图组件 |
| **UI Components** | `src/renderer/components/` | 标题栏、状态栏、侧边栏、Toast 等共享组件 |
| **Shared Types** | `src/shared/types.ts` | 所有 TypeScript 接口定义 |
| **IPC Channels** | `src/shared/ipc.ts` | IPC 通道名称常量 |

## 4.3 模块依赖关系

```
                    ┌──────────────────┐
                    │  renderer/App.tsx │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  components/  │  │   views/     │  │  store/      │
   │  TitleBar     │  │  CommitView  │  │  Zustand     │
   │  StatusBar    │  │  HistoryView │  │  Store       │
   │  Sidebar      │  │  GraphView   │  │              │
   │  ToastContainer│ │  ... (13)    │  │              │
   └──────────────┘  └──────┬───────┘  └──────┬───────┘
                             │                 │
                             ▼                 ▼
                     window.api.xxx()    preload/index.ts
                             │                 │
                             ▼                 ▼
                   ┌──────────────────────────────────┐
                   │    Main Process (ipcMain)         │
                   │    git-handlers / settings /      │
                   │    file-watcher                   │
                   │    child_process.execFile(git)    │
                   └──────────────────────────────────┘
```

## 4.4 状态管理模型

### Zustand Store 结构

```typescript
interface AppStore {
  // 仓库状态
  repoPath: string | null
  repoName: string
  repoStatus: RepositoryStatus

  // 当前视图
  currentView: ViewType

  // 提交相关
  stagedFiles: FileEntry[]
  unstagedFiles: FileEntry[]
  commitMessage: string

  // 历史相关
  commits: Commit[]
  commitPage: number
  historySearch: string
  historyFilter: { author?: string; file?: string }

  // 分支
  branches: Branch[]
  currentBranch: string

  // 远端 / Tag / Stash
  remotes: Remote[]
  tags: Tag[]
  stashes: Stash[]

  // Diff
  diff: FileDiff | null

  // Graph
  graphData: GraphData

  // 搜索结果
  fileSearchResults: FileEntry[]

  // Blame / Reflog
  blameLines: BlameLine[]
  reflogEntries: ReflogEntry[]

  // Toast 通知
  toasts: Toast[]

  // 设置
  settings: AppSettings

  // 50+ Action 方法
  openRepo(path: string): Promise<void>
  refreshStatus(): Promise<void>
  stageFiles(paths: string[]): Promise<void>
  commit(message: string): Promise<void>
  // ...
}
```

### 数据流

```
用户操作 (Click/Input)
    │
    ▼
React 事件处理函数 (View 组件)
    │
    ▼
Store Action 方法 (Zustand)
    │
    ├── 同步操作 → 更新 Store State → React 自动重渲染
    │
    └── 异步操作 → window.api.xxx()
                         │
                         ▼
                    IPC invoke (preload)
                         │
                         ▼
                    ipcMain.handle (main process)
                         │
                         ▼
                    Git CLI 调用 / 文件 I/O
                         │
                         ▼
                    返回结果 → Store 更新 → React 重渲染
```

## 4.5 文件监听与自动刷新

```
fs.watch (recursive, main process)
    │
    ▼ 忽略 .git/ 内部文件 (HEAD、refs/ 除外)
    │
    ▼ 500ms 防抖
    │
    ▼
main process → webContents.send('repo-changed')
    │
    ▼
preload → window.api.onRepoChanged(callback)
    │
    ▼
App.tsx 订阅 → store.refreshStatus()
    │
    ▼
React 重渲染所有视图
```
