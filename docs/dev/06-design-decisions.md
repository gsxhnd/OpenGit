# 6. 关键设计决策

## 6.1 Git 后端策略：纯系统 Git CLI

OpenGit **仅使用系统安装的 `git` CLI**，通过 Node.js `child_process.execFile` 调用。

**不引入 libgit2/isomorphic-git 的原因：**

- 系统 Git 是用户已安装且信任的工具，功能完整（LFS、Hooks、签名等自动继承）
- 复用系统 Git 的凭证管理（SSH Agent、credential.helper），无需额外处理认证
- 避免重复实现核心 Git 逻辑，降低维护成本
- 解析 Git 输出比直接操作 Git 对象数据库更安全（不会破坏 .git 目录）

**实现要点：**

- 所有 Git 操作在 `src/main/git-handlers.ts` 中统一实现（~710 行）
- 使用 `git status --porcelain`、`git log`、`git diff` 等标准命令
- 自定义分隔符（`\x1f`、`\0`）解析批量输出，防止文件名中包含空白等边界情况
- 异步操作使用 `child_process.execFile` 的 Promise 包装

## 6.2 状态管理：单一 Zustand Store

```typescript
// src/renderer/store/index.ts — 单一 Store (~700 行)
const useStore = create<AppStore>()((set, get) => ({
  // 50+ 状态字段
  repoPath: null, currentView: 'commit', stagedFiles: [], // ...
  // 50+ Action 方法
  openRepo: async (path) => { /* IPC 调用 → set() */ },
  stageFiles: async (paths) => { /* IPC 调用 → set() */ },
  // ...
}))
```

**单 Store 模式的理由：**

- 当前为单仓库应用，状态量适中（单 Store ~700 行可维护）
- 避免 Provider 嵌套，组件直接 `useStore()` 引用
- 状态变更自动触发所有订阅组件的重渲染
- 未来扩展多项目管理时，可能需要拆分为多个 Store

## 6.3 IPC 通信模式

```
Renderer (React)          Preload                 Main (Node.js)
     │                       │                        │
     ├─ window.api.xxx() ──→ ├─ ipcRenderer.invoke ─→ ├─ ipcMain.handle ──→ Git CLI
     │                       │                        │        │
     │  ←─ Promise<T> ────── ├─  ←─────────── ────── ├─  ←─── result
```

**设计要点：**

- **Invoke 模式**（请求-响应）：用于所有 Git 操作，渲染进程等待主进程执行完成
- **Send 模式**（事件推送）：用于文件监听通知，主进程推送给渲染进程
- **Type Safety**：`src/shared/types.ts` 定义所有共享类型，`src/shared/ipc.ts` 定义 IPC 通道名常量
- **Security**：`contextBridge.exposeInMainWorld` 严格限制暴露的 API，不暴露 `ipcRenderer` 直接访问

## 6.4 Git Graph 渲染：SVG 方案

```typescript
// src/renderer/views/GraphView.tsx
// 1. 主进程 git log --all 收集 DAG 数据，分配 lane
// 2. 渲染进程使用 SVG <circle>、<path> 绘制节点和连线
// 3. 列表区域使用 React 列表渲染 commit 信息
```

**实现方案：**

1. **数据层**（`git-handlers.ts:parseGraph`）：遍历 commit DAG，拓扑排序，为每个分支分配 lane（列），计算连线关系
2. **渲染层**（`GraphView.tsx`）：SVG 元素绘制节点（圆点）和连线（path），React 列表渲染 commit 信息行
3. **性能**：全量加载后一次性渲染，适用于中等规模仓库（~千级 commit）

## 6.5 架构决策：为什么不使用 MVC

项目没有使用传统的 MVC 架构，而是选择了更适合 Electron 的架构模式：

| 层级 | 技术 | 角色 |
|------|------|------|
| **数据获取层** | Main Process + system git CLI | 只负责数据获取和系统交互 |
| **业务逻辑层** | Zustand Store (renderer) | 单一 Store 承载所有业务逻辑和状态 |
| **UI 层** | React Views (renderer) | 纯展示和用户交互 |

这种架构的优点是：
- 清晰的三进程分离（安全边界明确）
- 状态管理集中（易于调试和追踪）
- UI 组件轻量（通过 Store Action 操作数据）

## 6.6 持久化策略

配置文件位置：
- **开发环境**：Electron `userData` 目录
- **Linux**：`~/.config/opengit/`
- **macOS**：`~/Library/Application Support/opengit/`
- **Windows**：`%APPDATA%/opengit/`

```
userData/
├── config.json          # 窗口状态、当前视图、主题设置
├── projects.json        # 最近打开的项目列表 (计划)
└── config.json.bak      # 配置文件损坏时自动备份
```

## 6.7 主题系统

当前使用 CSS 变量驱动的单主题方案：

```css
/* src/renderer/assets/index.css — Tokyo Night 深色主题 */
:root {
  --color-bg-primary: #1a1b26;
  --color-bg-secondary: #16161e;
  --color-bg-tertiary: #292e42;
  --color-border: #3b4261;
  --color-accent: #7aa2f7;
  /* ... 更多变量 */
}
```

计划支持多主题：通过加载 themes/ 目录下的 JSON 配置文件，动态设置 CSS 变量。
