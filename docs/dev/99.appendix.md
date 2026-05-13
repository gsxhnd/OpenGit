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
| [WinSCP](https://winscp.net/) | Windows 上常用的 SFTP/SCP 客户端，交互与传输队列可参考 |
| [FileZilla](https://filezilla-project.org/) | 跨平台 FTP/SFTP 客户端，站点管理与传输可参考 |
| [Cyberduck](https://cyberduck.io/) | 多协议文件浏览器（含 SFTP、S3 等），书签与云存储可参考 |
| [Termius](https://termius.com/) | 跨平台 SSH 客户端，主机分组与终端体验可参考 |
| [Zed Editor](https://github.com/zed-industries/zed) | GPUI 框架来源（若未来探索非 Electron 技术栈时的参考） |

## C. Electron 安全模型

项目遵循 Electron 安全最佳实践：

1. **Context Isolation**：`contextIsolation: true` — 渲染进程无法直接访问 Node.js
2. **Preload Bridge**：`contextBridge.exposeInMainWorld` 暴露最小化 API
3. **Node Integration OFF**：`nodeIntegration: false` — 渲染进程纯 Web 环境
4. **Sandbox**：按运行配置启用或分级收紧（以仓库内 `BrowserWindow` 实际配置为准）
5. **无 Remote Module**：禁用 `@electron/remote`，全部通过 IPC 通信

## D. 许可证

MIT License — Copyright (c) 2026 伍轻鸣

详见项目根目录 `LICENSE` 文件。
