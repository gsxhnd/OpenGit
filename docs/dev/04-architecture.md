# 4. 系统架构

## 4.1 三进程模型

```text
┌─────────────────────────────────────────────────────────┐
│              Renderer Process（渲染进程）                  │
│  React UI、Zustand Store、xterm.js、Monaco Editor        │
│  Tailwind CSS + Motion 动画                              │
├─────────────────────────────────────────────────────────┤
│              Preload Script（预加载脚本）                  │
│  contextBridge.exposeInMainWorld('api', { ... })         │
│  类型安全的 IPC 桥接、事件订阅封装                         │
├─────────────────────────────────────────────────────────┤
│              Main Process（主进程）                        │
│  BrowserWindow、Settings、SSH/SFTP、PTY                   │
│  协议适配层、文件 I/O、IPC Handlers                       │
└─────────────────────────────────────────────────────────┘
```

## 4.2 核心模块职责

| 模块 | 位置 | 职责 |
|------|------|------|
| Window & App | `src/main/index.ts` | BrowserWindow、生命周期、窗口控制、菜单 |
| Config Manager | `src/main/config-manager.ts` | JSON 配置读写、损坏恢复（.bak）、主题发现 |
| IPC Handlers | `src/main/handlers/` | 按功能域拆分的 IPC 处理模块 |
| Preload API | `src/preload/index.ts` + `src/preload/api/` | contextBridge 暴露 `window.api` |
| UI Store | `src/renderer/store/index.ts` | Zustand 全局状态与 Actions |
| UI Views | `src/renderer/views/` | 功能视图组件 |
| UI Components | `src/renderer/components/` | 共享 UI 组件 |
| Shared Types | `src/shared/types.ts` | 跨进程类型定义 |
| IPC Channels | `src/shared/ipc.ts` | IPC 通道名称常量 |

## 4.3 IPC 设计

### 通信模式

```text
Renderer (React)          Preload                 Main (Node.js)
     │                       │                        │
     ├─ window.api.xxx() ──→ ├─ ipcRenderer.invoke ─→ ├─ ipcMain.handle ──→ 协议适配 / 子进程
     │                       │                        │
     │  ←── Promise<T> ──── ├── ←── result ────────── ├── ←── result
     │                       │                        │
     │  ←── event ───────── ├── webContents.send ──── ├── 进度/状态推送
```

### 两种模式

| 模式 | 用途 | 示例 |
|------|------|------|
| **Invoke**（请求-响应） | 打开连接、列出目录、发起传输 | `window.api.sftp.list(path)` |
| **Send/on**（事件推送） | 传输进度、日志流、连接状态变更 | `window.api.onTransferProgress(cb)` |

### 通道命名规范

按功能域前缀拆分，定义在 `src/shared/ipc.ts`：

- `settings:*` — 设置读取、保存、主题发现
- `window:*` — 窗口控制
- `pty:*` — 本地终端创建、输入、输出、销毁
- `ssh:*` — 连接、断开、Shell、端口转发
- `sftp:*` — 目录、文件、上传下载、属性、编辑
- `storage:*` — WebDAV/S3 连接与对象操作（远期）
- `remote-desktop:*` — VNC/RDP 生命周期（远期）

### 安全约束

- `contextBridge.exposeInMainWorld` 仅暴露白名单 API
- 不暴露原始 `ipcRenderer`
- 载荷形状由 `src/shared/types.ts` 约束

## 4.4 协议适配层

主进程应形成统一的协议适配层，向渲染进程提供一致的文件操作能力，屏蔽底层协议差异：

```typescript
interface RemoteFileProvider {
  list(path: string): Promise<RemoteEntry[]>
  readText(path: string): Promise<string>
  writeText(path: string, content: string): Promise<void>
  upload(localPath: string, remotePath: string, options?: TransferOptions): Promise<void>
  download(remotePath: string, localPath: string, options?: TransferOptions): Promise<void>
  stat(path: string): Promise<RemoteEntry>
  mkdir(path: string): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  remove(path: string): Promise<void>
}
```

该接口可由 SFTP、FTP、WebDAV 和 S3 分别实现。S3 的目录语义通过 Bucket + Prefix 模拟。

## 4.5 状态管理

### Zustand Store Slice 设计

```typescript
// 建议按领域拆分 slice，单 Store 导出
interface AppStore {
  // settingsSlice
  settings: AppSettings | null

  // connectionSlice
  connections: ConnectionConfig[]
  recentConnections: string[]

  // sessionSlice
  sessions: Session[]
  activeSessionId: string | null

  // transferSlice
  transferQueue: TransferTask[]

  // toastSlice
  toasts: Toast[]
}
```

### 数据流

```text
用户操作 (Click / Input)
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
                    IPC invoke（preload → main）
                         │
                         ▼
                    协议适配 / 子进程 / 文件 I/O
                         │
                         ▼
                    结果 → Store 更新 → 重渲染
```

### 事件推送

主进程在传输进度、会话输出流、连接状态变化等场景下，通过 `webContents.send` 经 preload 转发到渲染进程；渲染进程在 Store 或专用 hook 中订阅并更新 UI。

## 4.6 安全原则

| 原则 | 说明 |
|------|------|
| 进程隔离 | 渲染进程不直接访问 Node.js API |
| 参数数组调用 | 子进程调用优先 `execFile` + argv，禁止 shell 拼接 |
| 凭据保护 | 密码和私钥口令不长期明文保存在配置文件中 |
| 主机指纹 | SSH 主机指纹必须可见、可确认、可持久化 |
| 白名单 API | preload 仅暴露经审计的 API 集合 |
| 资源限制 | 网络超时、并发连接数、传输队列可配置 |
