# 附录

## A. 技术参考

### shadcn/ui 组件开发

项目 `.agents/skills/shadcn/` 目录下包含 shadcn/ui 组件开发参考，涵盖组件的添加、搜索、调试和样式组合。

shadcn/ui 配置 (`components.json`)：
- 风格：base-nova
- 基础颜色：slate
- Tailwind CSS 变量模式
- 组件路径：`src/renderer/components/ui/`

### 当前使用的 UI 组件 (src/renderer/components/ui/)

| 组件 | 说明 |
|------|------|
| Button | base-nova 变体，支持 variant/size |
| Dialog | Base UI Dialog 封装 |
| Input | Base UI Input 封装 |
| Select | Base UI Select 封装 |

## B. 参考项目

| 项目 | 说明 |
|------|------|
| [GitHub Desktop](https://desktop.github.com/) | Electron 架构 Git GUI 参考 |
| [GitButler](https://github.com/gitbutlerapp/gitbutler) | Rust + Tauri Git 客户端，参考虚拟分支设计 |
| [Lazygit](https://github.com/jesseduffield/lazygit) | TUI Git 客户端，参考功能设计 |
| [Sourcetree](https://www.sourcetreeapp.com/) | 商业 Git GUI，参考交互设计 |
| [GitKraken](https://www.gitkraken.com/) | 商业 Git GUI，参考 Graph 可视化 |
| [Zed Editor](https://github.com/zed-industries/zed) | GPUI 框架来源 (未来可能的 Rust 重写参考) |

## C. Electron 安全模型

项目遵循 Electron 安全最佳实践：

1. **Context Isolation**：`contextIsolation: true` — 渲染进程无法直接访问 Node.js
2. **Preload Bridge**：`contextBridge.exposeInMainWorld` 暴露最小化 API
3. **Node Integration OFF**：`nodeIntegration: false` — 渲染进程纯 Web 环境
4. **Sandbox ON**：`sandbox: true` — 渲染进程沙箱隔离
5. **无 Remote Module**：禁用 `@electron/remote`，全部通过 IPC 通信

## D. 许可证

MIT License — Copyright (c) 2026 伍轻鸣

详见项目根目录 `LICENSE` 文件。
