# 4. 系统架构

> **OpenRemote** 采用 Electron 三进程模型。主进程承载**窗口、设置持久化、以及未来的远程协议适配**（SSH/SFTP、Docker/Kubernetes、WebDAV、S3 等）；渲染进程专注 React UI 与 Zustand 状态；预加载脚本提供类型安全的 `window.api` 桥接。

## 4.1 Electron 三进程架构

```
┌─────────────────────────────────────────────────────────┐
│                Renderer Process (渲染进程)               │
│  React UI（App、视图、共享组件；规划：xterm 终端、Monaco 远程编辑） │
│  Zustand Store (全局状态)                                │
│  Tailwind CSS + Motion                                   │
├─────────────────────────────────────────────────────────┤
│                Preload Script (预加载脚本)                │
│  contextBridge.exposeInMainWorld('api', { ... })       │
│  类型安全的 IPC 桥接                                     │
├─────────────────────────────────────────────────────────┤
│                  Main Process (主进程)                   │
│  Window Management (BrowserWindow)                      │
│  Remote / protocol handlers（规划中）                    │
│  Settings Persistence (JSON file I/O)                   │
│  IPC Handlers (ipcMain.handle / on)                     │
└─────────────────────────────────────────────────────────┘
```

## 4.2 核心模块职责

| 模块 | 位置 | 职责 |
|------|------|------|
| **Window & App** | `src/main/index.ts` | BrowserWindow、生命周期、窗口控制 IPC、对话框 |
| **Settings** | `src/main/settings.ts` | JSON 配置读写、损坏恢复、主题发现 |
| **Preload API** | `src/preload/index.ts` | contextBridge 暴露类型化 `window.api` |
| **UI Store** | `src/renderer/store/index.ts` | Zustand 全局状态与异步 Action |
| **UI Views** | `src/renderer/views/` | 各功能视图（随里程碑增减） |
| **UI Components** | `src/renderer/components/` | 标题栏、Toast 等共享组件 |
| **Shared Types** | `src/shared/types.ts` | 跨进程类型定义 |
| **IPC Channels** | `src/shared/ipc.ts` | IPC 通道名称常量 |

## 4.3 模块依赖关系（示意）

```
                    ┌──────────────────┐
                    │  renderer/App.tsx │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  components/  │  │   views/     │  │  store/      │
   │  TitleBar     │  │  Welcome…    │  │  Zustand     │
   │  Toast…       │  │  Settings…  │  │              │
   └──────────────┘  └──────┬───────┘  └──────┬───────┘
                             │                 │
                             ▼                 ▼
                     window.api.xxx()    preload/index.ts
                             │                 │
                             ▼                 ▼
                   ┌──────────────────────────────────┐
                   │    Main Process (ipcMain)       │
                   │    settings / 远程适配（规划）   │
                   └──────────────────────────────────┘
```

## 4.4 状态管理模型

### Zustand Store（示意）

```typescript
interface AppStore {
  // 当前视图、设置、Toast 等
  settings: AppSettings | null
  toasts: Toast[]
  // 未来：sessions、transferQueue、activeHostId …
}
```

### 数据流

```
用户操作 (Click/Input)
    │
    ▼
React 事件处理
    │
    ▼
Store Action（Zustand）
    │
    ├── 纯本地 → set() → 重渲染
    │
    └── 需系统能力 → window.api.xxx()
                         │
                         ▼
                    IPC invoke（preload）
                         │
                         ▼
                    ipcMain.handle（main）
                         │
                         ▼
                    子进程 / 网络 / 文件 I/O
                         │
                         ▼
                    结果 → Store 更新 → 重渲染
```

## 4.5 事件推送（规划）

主进程在**传输进度、会话输出流、连接状态变化**等场景下，通过 `webContents.send` 经 preload 转发到渲染进程；渲染进程在 Store 或专用 hook 中订阅并更新 UI。
