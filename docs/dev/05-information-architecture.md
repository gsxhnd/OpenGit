# 5. 信息架构

## 5.1 工作台布局

Puck 采用专业工作台结构，支持多协议、多会话、多文件任务同时运行：

```text
┌─────────────────────────────────────────────────────────┐
│                      Title Bar                           │
├────┬────────────┬──────────────────────┬────────────────┤
│    │            │                      │                │
│ A  │  Primary   │    Workbench Area    │   Inspector    │
│ c  │  Sidebar   │    (Session Tabs)    │   Panel        │
│ t  │            │                      │                │
│ i  │            │                      │                │
│ v  │            │                      │                │
│ i  │            │                      │                │
│ t  │            │                      │                │
│ y  │            │                      │                │
│    │            │                      │                │
│ B  │            │                      │                │
│ a  │            │                      │                │
│ r  │            │                      │                │
├────┴────────────┴──────────────────────┴────────────────┤
│                      Status Bar                          │
└─────────────────────────────────────────────────────────┘
```

| 区域 | 职责 |
|------|------|
| Title Bar | 窗口控制、macOS traffic light |
| Activity Bar | 一级功能域入口（垂直图标导航） |
| Primary Sidebar | 当前功能域的资源树或连接列表 |
| Workbench Area | 多 Tab 会话工作区（终端、文件、编辑器等） |
| Inspector Panel | 属性详情、任务信息、连接状态（可折叠） |
| Status Bar | 连接状态、传输速度、当前协议、错误提示 |

## 5.2 一级导航

| 导航项 | 用途 |
|--------|------|
| Home / Dashboard | 最近连接、快速连接、任务概览 |
| Connections | 管理 SSH、FTP/SFTP、WebDAV/S3 等连接配置 |
| Sessions | 查看当前活跃终端、文件、远程桌面会话 |
| Files | 本地与远程文件工作区、传输队列 |
| Settings | 外观、终端、编辑器、凭据、安全、快捷键 |

## 5.3 页面与视图

| 页面 | 核心内容 |
|------|----------|
| 欢迎/仪表盘 | 快速连接、最近会话、传输任务、常用主机 |
| 连接管理 | 连接列表、分组、标签、认证配置、测试连接 |
| 会话工作区 | 多 Tab，支持终端、文件、编辑器面板 |
| 文件管理 | 双栏浏览、本地/远程路径、操作工具栏、传输队列 |
| 远程编辑 | Monaco Editor、保存状态、远程路径、编码信息 |
| 设置 | 主题、语言、终端、编辑器、快捷键、凭据存储 |

## 5.4 会话模型

每个连接成功后创建一个会话 Tab：

```typescript
interface SessionTab {
  id: string
  connectionId: string
  connectionType: 'ssh' | 'local-terminal' | 'ftp' | 'sftp' | 'webdav' | 's3' | 'vnc' | 'rdp'
  title: string
  status: 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected'
  panels: PanelState[]
}
```

会话 Tab 可包含的面板类型：

- **终端面板**：xterm.js 渲染，连接 SSH Shell 或本地 PTY
- **文件面板**：本地/远程双栏、目录树、传输队列、上下文菜单
- **编辑器面板**：Monaco Editor 打开远程文本文件
- **监控面板**：远程服务器 CPU/内存/磁盘实时指标
- **远程桌面面板**：VNC/RDP 画布（远期）

## 5.5 状态反馈

| 层级 | 用途 | 示例 |
|------|------|------|
| 全局 Toast | 短期操作反馈 | 连接失败、保存成功 |
| Status Bar | 持续状态 | 当前连接、传输速度、任务数 |
| 任务中心 | 长任务详情 | 上传下载进度、批量操作 |
| 面板内错误 | 上下文错误 | 文件打开失败、权限不足、认证失败 |

## 5.6 UI 实施改造顺序

| 阶段 | 改造内容 |
|------|----------|
| 1 | 建立 Activity Bar、Primary Sidebar、Workbench、Status Bar 应用骨架 |
| 2 | 将快速连接和已保存主机迁移到 Connections / Dashboard |
| 3 | 将会话 Tab 抽象为通用 `SessionTab`，支持终端、文件等类型 |
| 4 | 重做文件面板为本地/远程双栏，接入传输队列和上下文操作 |
| 5 | 将 Monaco 编辑器作为工作区面板，而非临时嵌入文件列表 |
| 6 | 增加资源监控面板、任务中心和 Status Bar 反馈 |

## 5.7 推荐组件拆分

| 组件 | 职责 |
|------|------|
| `WorkbenchLayout` | 工作台总体布局 |
| `ActivityBar` | 一级功能域入口 |
| `PrimarySidebar` | 当前功能域资源列表 |
| `SessionTabs` | 活跃会话 Tab 管理 |
| `TerminalPanel` | 本地/SSH 终端面板 |
| `FileExplorerPanel` | 文件浏览与操作 |
| `RemoteEditorPanel` | Monaco 远程编辑 |
| `MonitorPanel` | 远程资源监控 |
| `TransferQueue` | 上传下载任务 |
| `StatusBar` | 全局连接和任务状态 |

## 5.8 视觉原则

- 信息密度高，但关键操作必须分组明确
- 深色主题优先，浅色主题必须可读
- 终端、文件、编辑器保持一致的标题栏、工具栏和状态反馈
- 协议类型用图标和短标签区分，不用大面积彩色卡片堆叠
- 传输任务必须持续可见，不依赖 Toast 作为唯一反馈

## 5.9 响应式策略

Puck 是桌面应用，主要优化窗口宽度 1024px 以上的工作台体验。窄窗口下：

- Activity Bar 保持可见
- Sidebar 可折叠
- Inspector 默认收起
- 文件双栏可切换为单栏 + 本地/远程切换器
- 会话 Tab 支持横向滚动
