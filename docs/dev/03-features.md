# 3. 功能规划

## 3.1 核心 Git 操作

| 功能 | 说明 |
|------|------|
| **Clone** | 克隆远程仓库到本地 |
| **Init** | 初始化新的 Git 仓库 |
| **Stage / Unstage** | 暂存/取消暂存，支持 hunk 级别和 line 级别 |
| **Commit** | 提交变更，支持 amend |
| **Push** | 推送到远程，支持 force push (需确认) |
| **Pull** | 拉取并合并远程变更 (merge / rebase 策略可选) |
| **Fetch** | 获取远程更新 |
| **Merge** | 分支合并，支持 fast-forward / no-ff / squash |
| **Rebase** | 变基操作，含交互式 Rebase (reorder, squash, edit, drop) |
| **Cherry-pick** | 选择性应用 commit |
| **Reset** | 重置到指定 commit (soft / mixed / hard) |
| **Revert** | 撤销指定 commit (生成新 commit) |

> Git 后端 (git2-rs / 系统 git) 由用户在设置中选择，详见 [设计决策 - Git 后端策略](06-design-decisions.md#61-git-后端策略)。

## 3.2 分支管理

| 功能 | 说明 |
|------|------|
| **分支列表** | 展示本地 + 远程分支，按最近活跃排序 |
| **创建分支** | 从 HEAD 或指定 commit 创建 |
| **删除分支** | 本地 + 远程删除 (需确认) |
| **重命名分支** | 本地分支重命名 |
| **切换分支** | Checkout 分支，含未提交变更处理提示 |
| **上游追踪** | 设置/修改分支的上游追踪关系 |
| **分支比较** | 比较两个分支之间的差异 (commits + files) |

## 3.3 多项目管理

这是 OpenGit 的核心差异化功能，交互模式为 **侧边栏项目列表 + Tab 切换**：

```
┌─────────────────────────────────────────────────────┐
│  Menu Bar                                           │
├──────────┬──────────────────────────────────────────┤
│          │  [Project A] [Project B] [Project C]  ← Tab Bar
│ Projects │──────────────────────────────────────────│
│ ──────── │                                          │
│ ▸ Group1 │  ┌─ Staging Area ──────────────────────┐ │
│   □ ProjA│  │  Modified: 3 files                  │ │
│   □ ProjB│  │  ☑ src/main.rs                      │ │
│ ▸ Group2 │  │  ☐ src/lib.rs                       │ │
│   □ ProjC│  │  ☑ Cargo.toml                       │ │
│          │  └─────────────────────────────────────┘ │
│ ──────── │                                          │
│ [+ Add]  │  ┌─ Commit Message ────────────────────┐ │
│          │  │  feat: add new feature               │ │
│          │  │                                      │ │
│          │  │  [AI Generate]          [Commit]     │ │
│          │  └─────────────────────────────────────┘ │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Status Bar: branch:main | ↑2 ↓1 | 3 changes      │
└─────────────────────────────────────────────────────┘
```

| 功能 | 说明 |
|------|------|
| **项目列表** | 侧边栏展示所有已添加的 Git 项目 |
| **项目分组** | 支持将项目按文件夹/自定义分组整理 |
| **Tab 切换** | 点击项目后在主区域以 Tab 形式展示，可同时打开多个 |
| **状态概览** | 每个项目显示：未提交变更数、领先/落后 commit 数、当前分支 |
| **快速添加** | 通过文件选择器或拖拽添加项目 |
| **移除项目** | 从列表移除 (不删除本地文件) |
| **持久化** | 项目列表和分组配置保存到本地配置文件 |
| **自动刷新** | 文件系统 watcher 监听变更，自动更新状态 |

## 3.4 Diff 与冲突解决

### Diff 视图

| 功能 | 说明 |
|------|------|
| **Inline Diff** | 单栏 diff，增删行上下排列 |
| **Side-by-side Diff** | 双栏 diff，左旧右新 |
| **语法高亮** | Diff 内容按语言进行语法高亮 |
| **Hunk 操作** | 对单个 hunk 进行 stage / discard / revert |
| **Line 操作** | 对单行进行 stage / unstage |
| **Word Diff** | 行内变更以单词级别高亮 |
| **大文件处理** | 超大 diff 分段加载，避免卡顿 |

### 冲突解决

| 功能 | 说明 |
|------|------|
| **冲突标记** | 文件列表中标记冲突文件 |
| **三方合并视图** | Base / Ours / Theirs 三方对比 |
| **手动选择** | 逐 hunk 选择采用哪一方 |
| **合并结果预览** | 实时预览合并后的结果 |
| **标记已解决** | 手动标记冲突已解决 |

## 3.5 历史与追溯

| 功能 | 说明 |
|------|------|
| **Commit 历史** | 分页加载的 commit 列表，展示 message / author / date / hash |
| **Git Graph** | 图形化展示分支和合并的拓扑关系 (详见 [设计决策 - Git Graph 渲染](06-design-decisions.md#63-git-graph-渲染)) |
| **Commit 详情** | 点击 commit 查看详细变更 (diff + 文件列表) |
| **File History** | 查看单个文件的完整修改历史 |
| **Blame** | 逐行展示每行代码的最后修改者和 commit |
| **Reflog** | 查看 HEAD 操作历史，支持恢复误操作 |
| **搜索** | 按 commit message / 作者 / 文件路径 / 文件内容搜索 |

## 3.6 Stash 管理

| 功能 | 说明 |
|------|------|
| **Stash 列表** | 展示所有 stash 条目 |
| **创建 Stash** | 暂存当前变更，支持自定义 message |
| **应用 Stash** | Apply / Pop stash |
| **查看 Stash** | 查看 stash 包含的变更 diff |
| **删除 Stash** | 删除指定 stash 或清空所有 |
| **Stash 部分文件** | 选择性 stash 指定文件 |

## 3.7 Tag 管理

| 功能 | 说明 |
|------|------|
| **Tag 列表** | 展示所有 tag (本地 + 远程) |
| **创建 Tag** | Lightweight / Annotated tag |
| **删除 Tag** | 本地 + 远程删除 |
| **推送 Tag** | 推送指定 tag 或所有 tag 到远程 |
| **Tag 详情** | 查看 tag 指向的 commit |

## 3.8 Remote 操作与平台集成

### Remote 管理

| 功能 | 说明 |
|------|------|
| **Remote 列表** | 展示所有远程仓库 |
| **添加 Remote** | 添加新的远程仓库 |
| **删除 Remote** | 删除远程仓库配置 |
| **编辑 Remote** | 修改 URL / 名称 |
| **Fetch All** | 一键 fetch 所有 remote |

### 平台集成 (GitHub / GitLab / Gitea)

| 功能 | 说明 | 优先级 |
|------|------|--------|
| **认证** | OAuth / Personal Access Token | 必须 |
| **PR / MR 列表** | 查看当前仓库的 Pull Request / Merge Request | 高 |
| **创建 PR / MR** | 从当前分支创建 PR/MR，填写标题和描述 | 高 |
| **Issue 浏览** | 查看 Issue 列表和详情 | 中 |
| **CI/CD 状态** | 查看 Pipeline / Workflow 运行状态 | 中 |
| **Review 评论** | 查看 PR 的 review 评论 | 低 |

## 3.9 高级功能

### 内置终端

| 功能 | 说明 |
|------|------|
| **PTY 终端** | 底部面板嵌入完整的终端模拟器 |
| **工作目录** | 自动切换到当前项目目录 |
| **快速命令** | 支持从 UI 操作直接生成 git 命令到终端 |
| **多 Tab** | 支持多个终端 Tab |

### AI Commit Message

| 功能 | 说明 |
|------|------|
| **自动生成** | 基于 staged diff 自动生成 commit message |
| **多 Provider** | 支持 OpenAI / Claude / Ollama 等本地/远程模型 |
| **Conventional Commits** | 遵循 Conventional Commits 规范 (feat/fix/docs/...) |
| **可编辑** | 生成后用户可编辑修改 |
| **重新生成** | 不满意可一键重新生成 |
| **自定义 Prompt** | 用户可自定义生成 prompt 模板 |

### Git Hooks 管理

| 功能 | 说明 |
|------|------|
| **Hook 列表** | 展示仓库所有 hooks (pre-commit, commit-msg, pre-push 等) |
| **编辑 Hook** | 内置编辑器编辑 hook 脚本 |
| **启用/禁用** | 通过重命名快速启用/禁用 hook |
| **模板** | 提供常用 hook 模板 |

### Submodule 管理

| 功能 | 说明 |
|------|------|
| **Submodule 列表** | 展示所有 submodule 及状态 |
| **添加** | 添加新的 submodule |
| **初始化** | `submodule init` + `submodule update` |
| **更新** | 更新到最新 commit / 指定 commit |
| **同步** | 同步 submodule URL |
| **移除** | 完整移除 submodule |

### Worktree 管理

| 功能 | 说明 |
|------|------|
| **Worktree 列表** | 展示所有 worktree 及关联分支 |
| **创建** | 创建新的 worktree (指定路径 + 分支) |
| **删除** | 删除 worktree |
| **切换** | 在 OpenGit 中快速切换到另一个 worktree |

### Commit 签名

| 功能 | 说明 |
|------|------|
| **GPG 签名** | 使用 GPG key 签名 commit |
| **SSH 签名** | 使用 SSH key 签名 commit |
| **签名验证** | 在 commit 历史中展示签名验证状态 |
| **Key 管理** | 选择/配置签名 key |

### LFS 支持

| 功能 | 说明 |
|------|------|
| **LFS Track** | 管理 `.gitattributes` 中的 LFS 追踪规则 |
| **LFS Status** | 查看 LFS 文件状态 |
| **LFS Pull / Push** | 拉取/推送 LFS 文件 |
| **LFS Prune** | 清理本地 LFS 缓存 |

## 3.10 用户体验

### 快捷键与命令面板

| 功能 | 说明 |
|------|------|
| **命令面板** | `Ctrl/Cmd + Shift + P` 打开，模糊搜索所有命令 |
| **全局快捷键** | 预定义常用操作快捷键 |
| **自定义快捷键** | 用户可自定义快捷键绑定 |
| **快捷键提示** | 菜单和按钮旁显示快捷键 |

**默认快捷键方案：**

| 快捷键 | 操作 |
|--------|------|
| `Ctrl/Cmd + Shift + P` | 命令面板 |
| `Ctrl/Cmd + S` | Stage 选中文件 |
| `Ctrl/Cmd + Enter` | Commit |
| `Ctrl/Cmd + Shift + K` | Push |
| `Ctrl/Cmd + Shift + L` | Pull |
| `Ctrl/Cmd + B` | 分支列表 |
| `Ctrl/Cmd + G` | Git Graph |
| `Ctrl/Cmd + D` | 查看 Diff |
| `` Ctrl/Cmd + ` `` | 切换终端 |
| `Ctrl/Cmd + 1-9` | 切换 Tab |

### 国际化 (i18n)

| 功能 | 说明 |
|------|------|
| **支持语言** | 中文 (zh-CN) / English (en) |
| **运行时切换** | 可在设置中切换语言，无需重启 |
| **编译时宏** | 使用 `t!("key")` 宏获取翻译文本 |
| **翻译文件** | JSON 格式，按语言组织 |

### 主题与外观

| 功能 | 说明 |
|------|------|
| **主题切换** | 21+ 内置主题，设置中可切换 |
| **主题热加载** | 修改 themes/ 下的 JSON 文件自动生效 |
| **自定义主题** | 用户可创建自定义主题 JSON |
| **字体设置** | 可配置 UI 字体和等宽字体 |

### 通知系统

| 功能 | 说明 |
|------|------|
| **操作反馈** | 操作成功/失败的 toast 通知 |
| **后台任务** | Push / Pull / Fetch 等操作的进度指示 |
| **错误详情** | 错误通知可展开查看详细信息 |

### 设置面板

| 功能 | 说明 |
|------|------|
| **通用设置** | 语言、主题、字体 |
| **Git 设置** | 默认 merge 策略、自动 fetch 间隔、签名配置、**Git 后端选择 (git2 / 系统 git)** |
| **快捷键设置** | 查看/修改快捷键绑定 |
| **AI 设置** | Provider 选择、API Key、自定义 Prompt |
| **平台账号** | GitHub / GitLab / Gitea 认证管理 |
