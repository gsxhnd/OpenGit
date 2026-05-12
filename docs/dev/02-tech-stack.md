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

- **Main Process (主进程)**：窗口管理、系统级 IPC、文件系统监听、Git CLI 调用。运行在 Node.js 环境，可直接访问系统 API。
- **Renderer Process (渲染进程)**：React UI 渲染，运行在 Chromium 沙箱环境，通过 contextBridge 与主进程通信。
- **Preload Script (预加载脚本)**：contextBridge 暴露安全的类型化 API 给渲染进程，隔离 Node.js 环境。

### React 19 + Tailwind CSS 4

- 函数组件 + Hooks 模式
- 13 个功能视图组件
- CSS 变量驱动主题系统 (Tokyo Night 深色主题)
- Tailwind v4 CSS-first 配置 (无需 tailwind.config.js)

### Zustand 5

- 单一 Store 管理全部应用状态 (~700 行)
- 内置 subscribe 机制支持视图自动刷新
- 无 Provider 包裹，组件直接引用

### 系统 Git CLI

- 通过 `child_process.execFile` 调用系统安装的 `git` 命令
- 解析 Git 输出 (使用 `\x1f`、`\0` 等分隔符)
- 完整支持所有 Git 功能（LFS、Hooks、签名等自动继承）

### Vite 8 + Electron Forge

- Vite 分别构建 main / preload / renderer 三个目标
- 开发模式：Vite dev server + Electron 热启动 + preload/main 构建监听
- 生产构建：Vite CJS/ESM 输出 + Electron Forge 打包 (ZIP/DMG/DEB/RPM/Squirrel)
