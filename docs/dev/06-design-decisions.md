# 6. 关键设计决策

## 6.1 远程能力与安全执行

Puck 中涉及 **SSH / SFTP / 本地 CLI（如 Docker、kubectl）** 的能力，在主进程侧通过 **子进程或经审计的原生模块** 调用实现；**禁止**将未校验的用户输入拼进 shell 字符串执行。

**原则：**

- 优先使用参数数组形式调用（如 `execFile` + argv），避免 `exec` 式拼接
- 凭据与私钥不落盘明文；优先系统钥匙串 / OS 凭据 API（随里程碑接入）
- 网络超时、并发连接数与传输队列需可配置，避免拖垮本机
- **终端 UI**：渲染进程使用 **xterm.js**（`@xterm/xterm`），与主进程 PTY / SSH 通道经 IPC 双向转发字节流
- **远程文本编辑**：使用 **Monaco Editor** 打开与保存远端文本文件（与 SFTP 或等价协议对接）；大文件采用分块读取、防抖保存等策略（里程碑细化）

## 6.2 状态管理：单一 Zustand Store

```typescript
// src/renderer/store/index.ts — 单一 Store（规模随功能增长）
const useStore = create<AppStore>()((set, get) => ({
  // 会话、传输队列、UI 布局等
  // Action：通过 window.api.* 与主进程交互
}))
```

**单 Store 模式的理由：**

- 远程会话与传输队列存在大量跨视图共享状态
- 避免 Provider 嵌套，组件直接 `useStore()` 引用
- 后续若子域膨胀，可按「会话 / 传输 / 设置」拆分为多个 slice 或 store

## 6.3 IPC 通信模式

```
Renderer (React)          Preload                 Main (Node.js)
     │                       │                        │
     ├─ window.api.xxx() ──→ ├─ ipcRenderer.invoke ─→ ├─ ipcMain.handle ──→ 远程适配层 / 子进程
     │                       │                        │        │
     │  ←─ Promise<T> ────── ├─  ←─────────── ────── ├─  ←─── result
```

**设计要点：**

- **Invoke 模式**（请求-响应）：用于打开连接、列出目录、发起传输等
- **Send / on 模式**（事件推送）：用于进度、日志流、会话状态变更
- **Type Safety**：`src/shared/types.ts` 与 `src/shared/ipc.ts` 约束载荷形状与通道名
- **Security**：`contextBridge.exposeInMainWorld` 仅暴露白名单 API，不暴露原始 `ipcRenderer`

## 6.4 远程文件列表与传输队列（规划）

- **列表层**：分页或惰性加载目录，避免一次拉取超大目录树阻塞 UI
- **传输层**：队列、并发上限、覆盖策略、断点续传（协议能力允许时）
- **反馈层**：Toast + 可展开的详细错误（含底层错误码翻译）

## 6.5 架构决策：为什么不使用 MVC

项目采用适合 Electron 的分层，而非经典 MVC：

| 层级 | 技术 | 角色 |
|------|------|------|
| **数据与系统层** | Main Process + 子进程 / 原生模块 | 连接、鉴权、IO、与 OS 交互 |
| **业务与状态层** | Zustand Store（renderer） | 会话状态、队列、与 UI 编排 |
| **UI 层** | React 视图与组件 | 展示与交互 |

优点：三进程边界清晰、状态集中、视图保持轻薄。

## 6.6 持久化策略

配置文件位置：

- **Linux**：`~/.config/puck/`
- **macOS**：`~/Library/Application Support/puck/`
- **Windows**：`%APPDATA%/puck/`

```
userData/
├── config.json          # 窗口状态、主题、语言等
└── config.json.bak      # 配置文件损坏时自动备份
```

## 6.7 主题系统

当前使用 CSS 变量驱动的主题方案；可通过 `themes/` 目录下 JSON 扩展预设主题，运行时写入 CSS 变量。
