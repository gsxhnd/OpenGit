//! 应用状态管理 —— Application state management
//!
//! 定义核心状态实体和辅助数据结构：
//! - `AppState`：GPUI Entity，持有当前仓库、状态和视图相关的所有数据
//! - `ViewType`：视图标签枚举
//! - `Project`：单个项目实体
//! - `Workspace`：多项目工作空间
//! - `CommitEditor`：提交消息编辑器状态
//!
//! `AppState` 是 UI 层与 `ogit` 库之间的桥梁，所有 Git 操作都通过它代理。
//!
//! Defines core entities: AppState (main GPUI Entity), ViewType, Project, Workspace, CommitEditor.

use ogit::GitOps;
use ogit::{Commit, FileDiff, Repository, RepositoryStatus};
use gpui::Task;
use std::path::{Path, PathBuf};
use std::sync::Arc;

// ============================================================================
// AppState —— 主应用状态实体
// ============================================================================

/// 主应用状态实体 —— Main application state entity
///
/// 集中管理当前仓库的所有状态数据，是视图层和 `ogit` 库之间的桥梁。
/// 作为 GPUI Entity，视图通过 `WeakEntity<AppState>` 订阅和修改状态。
///
/// Central state holder for the current repository. Bridges UI views and `ogit` library.
/// GPUI views interact with it via `WeakEntity<AppState>`.
pub struct AppState {
    /// 当前打开的仓库（Arc 包装以支持跨线程共享） —— Currently open repository
    pub repository: Option<Arc<Repository>>,
    /// 仓库在文件系统上的路径 —— Repository path on filesystem
    pub repo_path: Option<PathBuf>,
    /// 仓库状态快照 —— Repository status snapshot
    pub repo_status: RepositoryStatus,
    /// 是否正在加载 —— Loading state
    #[allow(dead_code)]
    pub is_loading: bool,
    /// 错误消息（如果有） —— Error message (if any)
    pub error: Option<String>,
    /// 已加载的提交历史（最新在前） —— Loaded commit history (most recent first)
    pub history_commits: Vec<Commit>,
    /// 历史记录"加载更多"的偏移量 —— Next offset for "load more" history
    pub history_skip: usize,
    /// 历史列表中选中的行索引 —— Selected row index in history list
    pub selected_history: Option<usize>,
    /// 内联差异的目标文件路径 —— Path for inline diff (working tree vs index)
    pub selected_diff_path: Option<PathBuf>,
    /// 选中文��的差异预览（缓存） —— Cached diff for selected_diff_path
    pub diff_preview: Option<FileDiff>,
    /// 是否使用 --amend 模式提交 —— Amend toggle for next commit
    pub commit_amend: bool,
    /// 待处理的后台任务 —— Pending background tasks
    pub _pending_tasks: Vec<Task<()>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            repository: None,
            repo_path: None,
            repo_status: RepositoryStatus::default(),
            is_loading: false,
            error: None,
            history_commits: Vec::new(),
            history_skip: 0,
            selected_history: None,
            selected_diff_path: None,
            diff_preview: None,
            commit_amend: false,
            _pending_tasks: Vec::new(),
        }
    }
}

/// 历史分页大小 —— History page size for pagination
pub const HISTORY_PAGE_SIZE: usize = 50;

impl AppState {
    /// 创建新的空状态 —— Create new empty state
    pub fn new() -> Self {
        Self::default()
    }

    // ========================================================================
    // 仓库生命周期 —— Repository lifecycle
    // ========================================================================

    /// 打开本地仓库 —— Open a local repository
    ///
    /// 初始化仓库、获取状态并加载第一页提交历史。
    ///
    /// Initializes repo, fetches status, and loads first page of history.
    pub fn open_repository(&mut self, path: PathBuf) -> anyhow::Result<()> {
        let repo = Arc::new(Repository::open(&path).map_err(|e| anyhow::anyhow!("{}", e))?);
        self.init_with_repo(repo, path)
    }

    /// 克隆远程仓库 —— Clone a remote repository
    pub fn clone_repository(&mut self, url: &str, into: PathBuf) -> anyhow::Result<()> {
        let repo =
            Arc::new(Repository::clone(url, &into).map_err(|e| anyhow::anyhow!("{}", e))?);
        self.init_with_repo(repo, into)
    }

    /// 使用给定的仓库初始化状态 —— Initialize state with a given repository
    ///
    /// 加载仓库状态和提交历史，清除之前的状态。
    ///
    /// Loads repo status and commit history, clearing previous state.
    fn init_with_repo(&mut self, repo: Arc<Repository>, path: PathBuf) -> anyhow::Result<()> {
        let status = repo.get_status().map_err(|e| anyhow::anyhow!("{}", e))?;

        self.repository = Some(repo);
        self.repo_path = Some(path);
        self.repo_status = status;
        self.error = None;
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.diff_preview = None;
        self.commit_amend = false;
        let _ = self.load_history_reset();

        Ok(())
    }

    /// 关闭当前仓库 —— Close current repository
    #[allow(dead_code)]
    pub fn close_repository(&mut self) {
        self.repository = None;
        self.repo_path = None;
        self.repo_status = RepositoryStatus::default();
        self.error = None;
        self.history_commits.clear();
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.diff_preview = None;
    }

    /// 刷新仓库状态 —— Refresh repository status
    ///
    /// 重新获取完整仓库状态（文件、分支、远程等）。
    ///
    /// Re-fetches full repository status (files, branches, remotes, etc.).
    pub fn refresh_status(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            self.repo_status = repo.get_status().map_err(|e| anyhow::anyhow!("{}", e))?;
            self.error = None;
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository opened"))
        }
    }

    // ========================================================================
    // 错误管理 —— Error management
    // ========================================================================

    /// 设置错误消息 —— Set error message
    pub fn set_error(&mut self, error: String) {
        self.error = Some(error);
    }

    /// 清除错误消息 —— Clear error message
    #[allow(dead_code)]
    pub fn clear_error(&mut self) {
        self.error = None;
    }

    // ========================================================================
    // 提交历史 —— Commit history
    // ========================================================================

    /// 重置并加载第一页历史 —— Reload first page of history
    ///
    /// 清空之前的历史记录，从 HEAD 开始加载最新 50 条提交。
    ///
    /// Clears previous history and loads latest 50 commits from HEAD.
    pub fn load_history_reset(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.history_commits = repo
            .get_history(HISTORY_PAGE_SIZE, 0)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.history_skip = self.history_commits.len();
        Ok(())
    }

    /// 加载下一页历史 —— Load next page of history
    ///
    /// 追加更多历史提交，用于"加载更多"功能。
    /// 如果返回空列表，说明已到达仓库起点。
    ///
    /// Appends more commits for "load more" feature. Empty list means reached repo start.
    pub fn load_more_history(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let more = repo
            .get_history(HISTORY_PAGE_SIZE, self.history_skip)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        if more.is_empty() {
            return Ok(());
        }
        self.history_skip += more.len();
        self.history_commits.extend(more);
        Ok(())
    }

    // ========================================================================
    // 暂存区操作 —— Staging operations
    // ========================================================================

    /// 暂存文件 —— Stage a file
    pub fn stage_path(&mut self, rel: &Path) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let s = rel.to_string_lossy();
        repo.stage_files(&[s.as_ref()])
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 取消暂存文件 —— Unstage a file
    pub fn unstage_path(&mut self, rel: &Path) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let s = rel.to_string_lossy();
        repo.unstage_files(&[s.as_ref()])
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 提交暂存的更改 —— Commit staged changes
    ///
    /// 支持普通提交和 --amend 修补提交两种模式。
    ///
    /// Supports both normal commit and --amend mode.
    pub fn commit_staged(&mut self, message: &str, amend: bool) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        if amend {
            repo.amend_commit(Some(message), None)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        } else {
            repo.commit(message, None)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    // ========================================================================
    // 分支操作 —— Branch operations
    // ========================================================================

    /// 切换到指定分支 —— Checkout a branch
    pub fn checkout_branch(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.switch_branch(name)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    /// 创建新分支 —— Create a new branch
    pub fn create_branch(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.create_branch(name, None)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    // ========================================================================
    // 远程操作 —— Remote operations
    // ========================================================================

    /// 从 origin 远程获取更新 —— Fetch from origin
    pub fn fetch_origin(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.fetch("origin")
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 从 origin 拉取当前分支 —— Pull current branch from origin
    pub fn pull_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.pull("origin", branch)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    /// 推送当前分支到 origin —— Push current branch to origin
    pub fn push_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.push("origin", branch, false)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    // ========================================================================
    // 差异视图 —— Diff view
    // ========================================================================

    /// 设置差异文件路径并加载差异 —— Set diff path and load diff preview
    ///
    /// 如果仓库可用，计算工作区与索引之间的差异并缓存到 `diff_preview`。
    ///
    /// Computes working-tree diff for the given path and caches it in `diff_preview`.
    pub fn set_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_diff_path = path.clone();
        self.diff_preview = match (&self.repository, path.as_ref()) {
            (Some(repo), Some(p)) => {
                let s = p.to_string_lossy();
                Some(
                    repo.get_file_diff(s.as_ref())
                        .map_err(|e| anyhow::anyhow!("{}", e))?,
                )
            }
            _ => None,
        };
        Ok(())
    }
}

// ============================================================================
// ViewType —— 视图类型枚举
// ============================================================================

/// 视图类型 —— View type tabs
///
/// 定义主面板中可切换的视图标签。
/// 当前支持：Commit（提交/暂存）、History（提交历史）、Branches（分支管理）、Diff（差异）。
/// 预留：Stash（储藏）、Tags（标签）、Welcome（欢迎页）。
///
/// Defines the view tabs available in the main panel.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewType {
    /// 提交/暂存视图 —— Commit and staging view
    Commit,
    /// 提交历史视图 —— Commit history view
    History,
    /// 分支管理视图 —— Branch management view
    Branches,
    /// 差异视图 —— Diff view
    Diff,
    /// 储藏管理视图 —— Stash management view (reserved)
    #[allow(dead_code)]
    Stash,
    /// 标签管理视图 —— Tag management view (reserved)
    #[allow(dead_code)]
    Tags,
    /// 欢迎/空状态视图 —— Welcome/empty state view (reserved)
    #[allow(dead_code)]
    Welcome,
}

// ============================================================================
// Project —— 项目实体
// ============================================================================

/// 项目实体（单个仓库项目） —— Project entity (single repository project)
///
/// 封装了项目路径、名称和关联的仓库实例。
/// 预留用于未来的多项目工作空间支持。
///
/// Wraps project path, name, and associated repository. Reserved for multi-project workspace support.
#[allow(dead_code)]
pub struct Project {
    /// 项目路径 —— Project path
    pub path: PathBuf,
    /// 项目名称 —— Project name
    pub name: String,
    /// 关联的仓库 —— Associated repository
    pub repository: Option<Arc<Repository>>,
    /// 项目状态 —— Project status
    pub status: RepositoryStatus,
}

#[allow(dead_code)]
impl Project {
    /// 创建新项目 —— Create new project
    pub fn new(path: PathBuf) -> anyhow::Result<Self> {
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Project".to_string());

        let repo = Arc::new(Repository::open(&path)?);
        let status = repo.get_status()?;

        Ok(Self {
            path,
            name,
            repository: Some(repo),
            status,
        })
    }

    /// 刷新项目状态 —— Refresh project status
    pub fn refresh(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            self.status = repo.get_status()?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository"))
        }
    }
}

// ============================================================================
// Workspace —— 工作空间
// ============================================================================

/// 工作空间（管理多个项目） —— Workspace managing multiple projects
///
/// 预留用于未来支持同时打开多个 Git 仓库。
///
/// Reserved for future multi-repo support.
#[allow(dead_code)]
pub struct Workspace {
    /// 当前活跃的项目索引 —— Active project index
    pub active_project: Option<usize>,
    /// 所有项目列表 —— List of projects
    pub projects: Vec<Project>,
}

impl Default for Workspace {
    fn default() -> Self {
        Self {
            active_project: None,
            projects: Vec::new(),
        }
    }
}

#[allow(dead_code)]
impl Workspace {
    /// 添加项目到工作空间 —— Add project to workspace
    pub fn add_project(&mut self, project: Project) {
        if self.active_project.is_none() {
            self.active_project = Some(0);
        }
        self.projects.push(project);
    }

    /// 从工作空间移除项目 —— Remove project from workspace
    pub fn remove_project(&mut self, index: usize) {
        if index < self.projects.len() {
            self.projects.remove(index);
            if let Some(active) = self.active_project {
                if active >= self.projects.len() {
                    self.active_project = if self.projects.is_empty() {
                        None
                    } else {
                        Some(self.projects.len() - 1)
                    };
                }
            }
        }
    }

    /// 获取活跃项目 —— Get active project
    pub fn active(&self) -> Option<&Project> {
        self.active_project.and_then(|idx| self.projects.get(idx))
    }

    /// 获取可变活跃项目 —— Get mutable active project
    pub fn active_mut(&mut self) -> Option<&mut Project> {
        let idx = self.active_project?;
        self.projects.get_mut(idx)
    }

    /// 切换到指定项目 —— Switch to project by index
    pub fn switch_to(&mut self, index: usize) {
        if index < self.projects.len() {
            self.active_project = Some(index);
        }
    }
}

// ============================================================================
// CommitEditor —— 提交消息编辑器
// ============================================================================

/// 提交消息编辑器状态 —— Commit message editor state
///
/// 管理提交消息文本、作者信息和 --amend 模式。
///
/// Manages commit message text, author info, and --amend mode.
#[allow(dead_code)]
pub struct CommitEditor {
    /// 提交消息文本 —— Commit message text
    pub message: String,
    /// 作者名（可选，使用全局配置时为空） —— Author name (optional, uses global config if empty)
    pub author: Option<String>,
    /// 是否使用 amend 模式 —— Whether --amend mode is active
    pub is_amend: bool,
}

impl Default for CommitEditor {
    fn default() -> Self {
        Self {
            message: String::new(),
            author: None,
            is_amend: false,
        }
    }
}

#[allow(dead_code)]
impl CommitEditor {
    /// 创建新编辑器 —— Create new editor
    pub fn new() -> Self {
        Self::default()
    }

    /// 重置编辑器状态 —— Reset editor state
    pub fn reset(&mut self) {
        self.message.clear();
        self.author = None;
        self.is_amend = false;
    }

    /// 设置提交消息 —— Set commit message
    pub fn set_message(&mut self, msg: String) {
        self.message = msg;
    }

    /// 设置作者 —— Set author
    pub fn set_author(&mut self, author: String) {
        self.author = Some(author);
    }

    /// 切换 amend 模式 —— Toggle amend mode
    pub fn toggle_amend(&mut self) {
        self.is_amend = !self.is_amend;
    }

    /// 检查消息是否有效 —— Check if message is valid for commit
    pub fn is_valid(&self) -> bool {
        !self.message.trim().is_empty()
    }
}
