# 6. 关键设计决策

## 6.1 Git 后端策略

OpenGit 提供 `git2-rs` (libgit2) 和系统 `git` 命令两种后端，**由用户在设置中选择**使用哪一个：

```rust
/// Git 后端类型 (用户可选)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
pub enum GitBackendType {
    #[default]
    Git2,    // 使用 git2-rs (libgit2)，性能好，纯库调用
    GitCmd,  // 使用系统 git 命令，兼容性好，支持所有 git 特性
}

/// Git 操作统一 trait
pub trait GitOps {
    fn status(&self) -> Result<WorkingTreeStatus>;
    fn stage(&self, paths: &[PathBuf]) -> Result<()>;
    fn commit(&self, message: &str, options: CommitOptions) -> Result<Oid>;
    fn push(&self, remote: &str, branch: &str, options: PushOptions) -> Result<()>;
    fn pull(&self, remote: &str, branch: &str, options: PullOptions) -> Result<()>;
    // ...
}

/// 基于 git2-rs 的实现
pub struct Git2Backend {
    repo: git2::Repository,
}

/// 基于系统 git 命令的实现
pub struct GitCmdBackend {
    work_dir: PathBuf,
}

/// 统一仓库入口，根据用户配置委派到对应后端
pub struct Repository {
    backend_type: GitBackendType,
    git2: Git2Backend,
    cmd: GitCmdBackend,
}

impl Repository {
    /// 获取当前用户选择的后端
    fn backend(&self) -> &dyn GitOps {
        match self.backend_type {
            GitBackendType::Git2 => &self.git2,
            GitBackendType::GitCmd => &self.cmd,
        }
    }
}
```

**两种后端对比：**

| 维度 | `git2-rs` (libgit2) | 系统 `git` 命令 |
|------|------|------|
| **性能** | 高 (纯库调用，无进程开销) | 中 (每次操作 fork 进程) |
| **兼容性** | 一般 (不支持 LFS、interactive rebase 等) | 完整 (支持所有 git 特性) |
| **认证** | 需自行处理凭证 | 复用系统 git 凭证管理 |
| **Hooks** | 不执行 git hooks | 自动执行 git hooks |
| **依赖** | 需编译 libgit2 | 需系统安装 git |
| **适用场景** | 追求性能，操作简单的仓库 | 需要完整 git 特性的场景 |

**设计要点：**

- 默认使用 `Git2` 后端 (性能优先)
- 用户可在设置面板 (Git 设置) 中全局切换后端类型
- 也可在项目级别单独配置后端类型 (覆盖全局设置)
- 两种后端均实现 `GitOps` trait，接口完全统一
- 切换后端无需重启，实时生效

## 6.2 多项目状态管理

```rust
/// 工作区 Entity
pub struct Workspace {
    projects: Vec<Entity<Project>>,
    groups: Vec<ProjectGroup>,
    active_tab: Option<usize>,
}

/// 单项目 Entity
pub struct Project {
    name: String,
    path: PathBuf,
    repository: Entity<Repository>,
    watcher: Option<Task<()>>,   // 文件系统监听任务
    fetch_task: Option<Task<()>>, // 自动 fetch 后台任务
}

/// 仓库状态 Entity
pub struct Repository {
    // ... Git 状态缓存
    status: WorkingTreeStatus,
    head: Head,
    branches: Vec<Branch>,
    remotes: Vec<Remote>,
    stashes: Vec<Stash>,
    tags: Vec<Tag>,
}
```

**设计要点：**

- 每个 `Project` 持有独立的 `Entity<Repository>`，状态隔离
- 使用 `WeakEntity` 避免循环引用
- 文件系统 watcher (基于 `notify` crate) 监听工作目录变更，自动刷新 status
- 后台 Task 定期 fetch，检查远程是否有新 commit
- 项目列表持久化到 `~/.config/opengit/projects.json`

## 6.3 Git Graph 渲染

Git Graph 是最复杂的 UI 组件，需要自定义 GPUI Element：

```
       ●─── feat/login
       │
  ●────┤ main
  │    │
  │    ●─── fix/typo
  │    │
  ●────● merge branch 'develop'
  │
  ●
```

**实现方案：**

1. **数据层** (`git/graph.rs`):
   - 遍历 commit DAG，使用拓扑排序
   - Lane 分配算法：为每个分支分配一个 lane (列)
   - 计算连线关系 (直线、合并线、分叉线)

2. **渲染层** (`ui/graph_canvas.rs`):
   - 使用 GPUI Element API 自定义绘制 (paint phase)
   - 每个 commit 是一个节点 (圆点)
   - 分支连线使用 Bezier 曲线或折线
   - 不同分支使用不同颜色

3. **性能优化**:
   - 虚拟滚动：只渲染可见区域的 commit
   - 增量加载：按需加载更多 commit
   - 缓存 lane 计算结果

```rust
/// Git Graph 自定义 Element
pub struct GraphCanvas {
    commits: Vec<GraphCommit>,
    lanes: Vec<Lane>,
    scroll_offset: f32,
    visible_range: Range<usize>,
}

impl Element for GraphCanvas {
    type RequestLayoutState = ();
    type PrepaintState = GraphPrepaintState;

    fn prepaint(&mut self, ...) -> Self::PrepaintState {
        // 计算可见 commit 范围
        // 准备绘制数据
    }

    fn paint(&mut self, ...) {
        // 绘制 lane 连线 (Bezier curves)
        // 绘制 commit 节点 (circles)
        // 绘制分支标签
    }
}
```

## 6.4 AI Commit Message

```rust
/// AI Provider 抽象
#[async_trait]
pub trait AiProvider: Send + Sync {
    async fn generate_commit_message(&self, diff: &str, context: &AiContext) -> Result<String>;
}

/// 生成上下文
pub struct AiContext {
    pub language: String,         // commit message 语言
    pub style: CommitStyle,       // Conventional / Freeform
    pub max_length: usize,
    pub custom_prompt: Option<String>,
    pub recent_commits: Vec<String>, // 最近的 commit message，用于风格参考
}
```

**集成流程：**

```
用户点击 [AI Generate]
    │
    ▼ cx.background_spawn()
收集 staged diff + recent commits
    │
    ▼
调用 AiProvider.generate_commit_message()
    │
    ▼ weak_entity.update()
填充到 commit message 输入框
    │
    ▼
用户编辑 / 重新生成 / 确认 commit
```

## 6.5 国际化方案

```rust
// locales/zh-CN.json
{
    "app.name": "OpenGit",
    "workspace.add_project": "添加项目",
    "workspace.remove_project": "移除项目",
    "git.commit": "提交",
    "git.push": "推送",
    "git.pull": "拉取",
    "git.stage": "暂存",
    "git.unstage": "取消暂存",
    "git.branch.create": "创建分支",
    "git.branch.delete": "删除分支",
    "settings.language": "语言",
    "settings.theme": "主题",
    // ...
}

// 使用方式
use crate::i18n::t;

Button::new("commit")
    .label(t!("git.commit"))
    .on_click(|_, _, _| { /* ... */ });
```

## 6.6 快捷键与命令面板

```rust
/// Action 定义 (参考 GPUI Action 系统)
actions!(
    opengit,
    [
        StageSelected,
        UnstageSelected,
        Commit,
        Push,
        Pull,
        Fetch,
        ToggleTerminal,
        ToggleGraph,
        OpenCommandPalette,
        SwitchBranch,
        CreateBranch,
        // ...
    ]
);

/// 快捷键绑定
fn register_keybindings(cx: &mut App) {
    cx.bind_keys([
        KeyBinding::new("cmd-shift-p", OpenCommandPalette, None),
        KeyBinding::new("cmd-s", StageSelected, None),
        KeyBinding::new("cmd-enter", Commit, None),
        KeyBinding::new("cmd-shift-k", Push, None),
        KeyBinding::new("cmd-shift-l", Pull, None),
        KeyBinding::new("cmd-b", SwitchBranch, None),
        KeyBinding::new("cmd-g", ToggleGraph, None),
        KeyBinding::new("ctrl-`", ToggleTerminal, None),
        // ...
    ]);
}
```

## 6.7 持久化策略

配置文件位置：`~/.config/opengit/`

```
~/.config/opengit/
├── config.json          # 全局设置 (主题、语言、字体、AI 配置、Git 后端选择)
├── projects.json        # 项目列表与分组
├── keybindings.json     # 自定义快捷键
├── accounts.json        # 平台账号 (加密存储 token)
└── window-state.json    # 窗口位置、大小、面板布局
```
