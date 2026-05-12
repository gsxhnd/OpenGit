# 2. 技术栈

## 2.1 核心技术

| 技术 | 说明 | 版本 |
|------|------|------|
| **Electron** | 桌面应用运行时 | 42 |
| **React** | UI 框架 | 19 |
| **TypeScript** | 主语言 (全栈) | 6 |
| **Tailwind CSS** | 原子化 CSS 框架 | 4 |
| **Motion** | 动画库 (Framer Motion) | 12 |
| **Zustand** | 轻量级状态管理 | 5 |
| **Vite** | 构建工具 | 8 |
| **Electron Forge** | 打包与发布工具 | 7 |

## 2.2 核心框架特性

### Electron 三进程架构

- **Main Process (主进程)**：窗口管理、系统级 IPC、设置持久化；后续承载 SSH/SFTP、Docker/Kubernetes（优先于 WebDAV）、WebDAV、S3 等适配。运行在 Node.js 环境，可直接访问系统 API。
- **Renderer Process (渲染进程)**：React UI 渲染，运行在 Chromium 沙箱环境，通过 contextBridge 与主进程通信。
- **Preload Script (预加载脚本)**：contextBridge 暴露安全的类型化 API 给渲染进程，隔离 Node.js 环境。

### React 19 + Tailwind CSS 4

- 函数组件 + Hooks 模式
- 功能视图按里程碑扩展（欢迎页、设置、远程会话等）
- CSS 变量驱动主题系统 (Tokyo Night 深色主题)
- Tailwind v4 CSS-first 配置 (无需 tailwind.config.js)

### Zustand 5

- 单一 Store 管理全局应用状态（规模随功能增长）
- 内置 subscribe 机制支持视图自动刷新
- 无 Provider 包裹，组件直接引用

### Vite 8 + Electron Forge

- Vite 分别构建 main / preload / renderer 三个目标
- 开发模式：Vite dev server + Electron 热启动 + main/preload 监听重建
- 生产构建：Vite CJS/ESM 输出 + Electron Forge 打包 (ZIP/DMG/DEB/RPM/Squirrel)

## 2.3 终端与远程编辑（规划）

| 技术 | 用途 | 说明 |
|------|------|------|
| **[@xterm/xterm](https://github.com/xtermjs/xterm.js)** | SSH / 本地 PTY 终端 UI | 渲染进程内嵌终端模拟器；与主进程 **node-pty**（或等价）配合，经 IPC 转发标准输入输出 |
| **[monaco-editor](https://github.com/microsoft/monaco-editor)** | 远程文本编辑 | 在 SFTP/远程工作区内打开文本文件时提供语法高亮、多光标、主题与编辑器扩展能力；内容经 IPC 与远端读写衔接 |

依赖版本以根目录 `package.json` 为准；集成细节见 [03-features.md](03-features.md) 与 [09-roadmap.md](09-roadmap.md) Phase 10。
