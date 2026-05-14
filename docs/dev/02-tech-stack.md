# 2. 技术栈

## 2.1 核心技术

| 技术 | 用途 | 版本 |
|------|------|------|
| **Electron** | 桌面应用运行时 | 42 |
| **React** | UI 框架 | 19 |
| **TypeScript** | 主语言（全栈） | 6 |
| **Tailwind CSS** | 原子化样式 | 4 |
| **Motion** | 动画（Framer Motion） | 12 |
| **Zustand** | 状态管理 | 5 |
| **Vite** | 构建工具 | 8 |
| **Electron Forge** | 打包与发布 | 7 |

## 2.2 终端与编辑器

| 技术 | 用途 | 说明 |
|------|------|------|
| **@xterm/xterm** | 终端 UI | 渲染进程内嵌终端模拟器，配合主进程 PTY / SSH 通道 |
| **@xterm/addon-fit** | 终端自适应 | 自动适配容器尺寸 |
| **monaco-editor** | 远程文本编辑 | 语法高亮、多光标、主题，经 IPC 与远端读写衔接 |

## 2.3 协议与系统

| 技术 | 用途 |
|------|------|
| **ssh2** | SSH/SFTP 协议实现 |
| **node-pty** | 本地终端 PTY 创建 |

## 2.4 UI 组件与样式

| 技术 | 用途 |
|------|------|
| **shadcn/ui** | 基础 UI 组件模式 |
| **@base-ui/react** | 无头组件基础 |
| **lucide-react** | 图标库 |
| **SCSS Modules** | 局部样式（配合 Tailwind） |
| **CSS Variables** | 主题系统驱动 |

## 2.5 三进程架构

### Main Process（主进程）

- 运行在 Node.js 环境，可直接访问系统 API
- 职责：窗口管理、设置持久化、SSH/SFTP 连接、PTY 创建、协议适配
- 输出格式：CJS（`format: 'cjs'`）

### Renderer Process（渲染进程）

- 运行在 Chromium 沙箱环境
- 职责：React UI 渲染、Zustand 状态、xterm.js 终端、Monaco 编辑器
- 通过 `contextBridge` 与主进程通信

### Preload Script（预加载脚本）

- `contextBridge.exposeInMainWorld('api', { ... })`
- 暴露类型安全的白名单 API，隔离 Node.js 环境
- 输出格式：CJS

## 2.6 构建与开发

### Vite 多目标构建

- 分别构建 main / preload / renderer 三个目标
- 开发模式：Vite dev server（:5173）+ Electron 热启动 + main/preload 监听重建
- 生产构建：Vite CJS/ESM 输出 + Electron Forge 打包

### 打包产物

| 平台 | 格式 |
|------|------|
| macOS | DMG / ZIP |
| Windows | Squirrel |
| Linux | DEB / RPM |

## 2.7 React 19 + Tailwind CSS 4

- 函数组件 + Hooks 模式
- CSS 变量驱动主题系统（深色主题默认）
- Tailwind v4 CSS-first 配置（无需 `tailwind.config.js`）
- 功能视图按里程碑扩展

## 2.8 Zustand 5

- 单一 Store 管理全局应用状态（按 slice 拆分）
- 内置 subscribe 机制支持视图自动刷新
- 无 Provider 包裹，组件直接 `useStore()` 引用
- 规模随功能增长，可按领域拆分为多个 slice
