# 9. 开发路线图

## Phase 1: 基础框架 (MVP)

> 目标: 可用的单项目 Git 客户端

| 任务 | 说明 | 预估 |
|------|------|------|
| 应用骨架 | 窗口、主布局 (侧边栏 + 内容区)、主题加载 | 1 周 |
| Git 后端基础 | Repository 抽象、status / stage / unstage / commit | 1 周 |
| Commit 视图 | Staging area (文件列表) + commit message 输入 + 提交 | 1 周 |
| Diff 视图 (Inline) | 基础 inline diff 展示 | 1 周 |
| 分支管理基础 | 分支列表、切换分支 | 0.5 周 |
| Commit 历史 | 分页加载的 commit 列表 | 0.5 周 |
| Push / Pull / Fetch | 远程操作基础支持 | 0.5 周 |
| 状态栏 | 当前分支、变更数、领先/落后 | 0.5 周 |

**交付物**: 可 clone/commit/push/pull 的基础 Git GUI

## Phase 2: 多项目 & 核心增强

> 目标: 核心差异化功能上线

| 任务 | 说明 | 预估 |
|------|------|------|
| 多项目管理 | 侧边栏项目列表 + Tab 切换 + 项目持久化 | 1.5 周 |
| 项目分组 | 自定义分组管理 | 0.5 周 |
| Side-by-side Diff | 双栏 diff 视图 | 1 周 |
| Stash 管理 | 完整的 stash 操作 UI | 0.5 周 |
| Tag 管理 | Tag 列表 + 创建/删除/推送 | 0.5 周 |
| Remote 管理 | Remote 列表 + 添加/删除/编辑 | 0.5 周 |
| 冲突解决基础 | 冲突文件标记 + 基础合并视图 | 1 周 |
| 通知系统 | 操作反馈 toast + 错误通知 | 0.5 周 |
| 文件系统监听 | 自动刷新状态 | 0.5 周 |

**交付物**: 多项目管理功能可用，核心 Git 操作完善

## Phase 3: 高级功能

> 目标: 专业级 Git 客户端功能

| 任务 | 说明 | 预估 |
|------|------|------|
| Git Graph 可视化 | 自定义 Element 绘制 commit 拓扑图 | 2 周 |
| Blame 视图 | 逐行归属展示 | 0.5 周 |
| File History | 单文件修改历史 | 0.5 周 |
| 交互式 Rebase | 可视化 rebase 操作 | 1 周 |
| 搜索功能 | commit / 文件 / 内容搜索 | 1 周 |
| 快捷键系统 | 全局快捷键 + 自定义绑定 | 0.5 周 |
| 命令面板 | Ctrl+Shift+P 模糊搜索命令 | 0.5 周 |
| Reflog | 操作历史查看与恢复 | 0.5 周 |
| 设置面板 | 通用设置、Git 设置、快捷键设置 | 1 周 |
| 三方冲突解决 | 完整的 Base/Ours/Theirs 合并视图 | 1 周 |

**交付物**: 功能完善的专业 Git GUI

## Phase 4: 扩展生态

> 目标: 全功能 + 生态集成

| 任务 | 说明 | 预估 |
|------|------|------|
| 内置终端 | PTY 终端嵌入 | 1.5 周 |
| AI Commit Message | 多 Provider 支持 + Conventional Commits | 1 周 |
| Git Hooks 管理 | 可视化编辑/启用/禁用 | 0.5 周 |
| Submodule 管理 | 完整 submodule 操作 UI | 0.5 周 |
| Worktree 管理 | Worktree 列表 + 创建/删除/切换 | 0.5 周 |
| Commit 签名 | GPG / SSH 签名 + 验证展示 | 0.5 周 |
| LFS 支持 | Track / Pull / Push / Prune | 0.5 周 |
| GitHub 集成 | PR 列表 + 创建 PR + CI 状态 | 1.5 周 |
| GitLab 集成 | MR 列表 + 创建 MR + Pipeline | 1 周 |
| Gitea 集成 | PR 列表 + 创建 PR | 0.5 周 |
| 国际化 | 中文/英文支持 + 运行时切换 | 1 周 |
| Windows 适配 | Windows 平台测试与适配 | 1 周 |

**交付物**: 全功能跨平台 Git GUI 客户端
