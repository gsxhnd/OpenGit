# 4. 系统架构

## 4.1 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (GPUI)                       │
│  视图 (Views)、自定义组件 (Components)、交互 (Events)     │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  业务逻辑、状态管理 (Entity)、命令调度                     │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                          │
│  Git 操作封装、平台 API Client、AI Provider               │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                            │
│  数据模型 (Model)、工具函数 (Utils)、配置 (Config)        │
└─────────────────────────────────────────────────────────┘
```

## 4.2 核心模块职责

| 模块 | 职责 | 关键类型 |
|------|------|----------|
| **app** | 应用入口、窗口管理、全局状态初始化 | `OpenGitApp` |
| **workspace** | 多项目工作区管理、Tab 切换、项目分组 | `Workspace`, `Project`, `ProjectList` |
| **git** | Git 操作抽象层 (git2 / system git 可选) | `Repository`, `GitOps` trait |
| **views** | 各功能视图的 GPUI 组件 | `CommitView`, `HistoryView`, `GraphView` ... |
| **ui** | 自定义 UI 组件 (文件树、Diff 编辑器、Graph 画布) | `FileTree`, `DiffEditor`, `GraphCanvas` |
| **platform** | 远程平台 API 集成 | `GitHubClient`, `GitLabClient`, `GiteaClient` |
| **terminal** | 内置终端模拟 | `Terminal`, `PtyProcess` |
| **ai** | AI commit message 生成 | `AiProvider`, `CommitMessageGenerator` |
| **i18n** | 国际化支持 | `t!()` 宏, `Locale` |
| **settings** | 配置管理和持久化 | `AppSettings`, `ProjectSettings` |

## 4.3 模块依赖关系

```
                    ┌──────────┐
                    │   app    │
                    └────┬─────┘
                         │
                 ┌───────┼───────┐
                 ▼       ▼       ▼
           ┌──────────┐ ┌────┐ ┌──────────┐
           │workspace │ │views│ │ settings │
           └────┬─────┘ └──┬─┘ └──────────┘
                │          │
        ┌───────┼──────┬───┘
        ▼       ▼      ▼
     ┌─────┐ ┌────┐ ┌────┐
     │ git │ │ ui │ │i18n│
     └──┬──┘ └────┘ └────┘
        │
   ┌────┼────┬──────────┐
   ▼    ▼    ▼          ▼
┌──────────┐┌────────┐┌────┐
│git2 / cmd││platform││ ai │
└──────────┘└────────┘└────┘
```

## 4.4 状态管理模型

基于 GPUI Entity 系统的状态树：

```rust
// 全局 App 状态
Entity<AppState>
├── settings: Entity<AppSettings>     // 全局设置
├── workspace: Entity<Workspace>      // 工作区
│   ├── projects: Vec<Entity<Project>> // 项目列表
│   │   ├── repository: Entity<Repository>  // Git 仓库状态
│   │   │   ├── status: WorkingTreeStatus
│   │   │   ├── branches: Vec<Branch>
│   │   │   ├── remotes: Vec<Remote>
│   │   │   ├── stashes: Vec<Stash>
│   │   │   └── head: Head
│   │   └── tab_state: TabState       // Tab UI 状态
│   ├── active_tab: Option<usize>     // 当前活跃 Tab
│   └── groups: Vec<ProjectGroup>     // 项目分组
├── notification: Entity<NotificationCenter>
└── command_palette: Entity<CommandPalette>
```

## 4.5 数据流

```
用户操作 (Click/KeyPress)
    │
    ▼
Event Handler (View 层)
    │
    ▼
Entity Update (Application 层)
    │
    ├── 同步操作 → 直接更新 Entity 状态 → cx.notify() → UI 重渲染
    │
    └── 异步操作 → cx.spawn() / cx.background_spawn()
                        │
                        ▼
                   Git 操作 / API 调用 (Service 层)
                        │
                        ▼
                   weak_entity.update() → cx.notify() → UI 重渲染
```
