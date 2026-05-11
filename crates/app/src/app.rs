//! 应用状态管理 —— Application state management
//!
//! 定义核心状态实体：
//! - `AppState`：GPUI Entity，持有当前仓库、状态和视图相关的所有数据
//! - `ViewType`：视图标签枚举
//!
//! 辅助类型已拆分到独立模块：`Project` → project.rs, `Workspace` → workspace.rs,
//! `CommitEditor` → commit_editor.rs
//!
//! `AppState` 是 UI 层与 `ogit` 库之间的桥梁，所有 Git 操作都通过它代理。
//!
//! Defines core entities: AppState (main GPUI Entity) and ViewType.
//! Auxiliary types extracted: Project, Workspace, CommitEditor.

use gpui::Task;
use ogit::GitOps;
use ogit::{Commit, FileDiff, Repository, RepositoryStatus};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::settings::{ProjectGroup, WorkspaceEntry};
use crate::workspace::{CachedStatus, Workspace};

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
#[derive(Default)]
pub struct AppState {
    /// 工作空间（多项目管理） —— Workspace for multi-project management
    pub workspace: Workspace,
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
    /// 选中的暂存文件差异路径 —— Staged file diff path (HEAD vs index)
    pub selected_staged_diff_path: Option<PathBuf>,
    /// 选中文���的差异预览（缓存） —— Cached diff for selected_diff_path
    pub diff_preview: Option<FileDiff>,
    /// 当前正在执行的操作描述 —— Current operation description for status bar
    pub current_operation: Option<String>,
    /// 是否使用 --amend 模式提交 —— Amend toggle for next commit
    pub commit_amend: bool,
    /// 待处理的后台任务 —— Pending background tasks
    pub _pending_tasks: Vec<Task<()>>,
}

/// 历史分页大小 —— History page size for pagination
pub const HISTORY_PAGE_SIZE: usize = 50;

impl AppState {
    /// 创建新的空状态 —— Create new empty state
    pub fn new() -> Self {
        Self::default()
    }

    /// 使用工作空间设置创建 AppState —— Create AppState with workspace settings
    pub fn new_with_workspace(
        entries: Vec<WorkspaceEntry>,
        groups: Vec<ProjectGroup>,
        active_index: usize,
    ) -> Self {
        let workspace = Workspace::from_settings(entries, groups, active_index);
        Self {
            workspace,
            ..Default::default()
        }
    }

    // ========================================================================
    // 仓库生命周期 —— Repository lifecycle
    // ========================================================================

    /// 打开本地仓库 —— Open a local repository
    ///
    /// 初始化仓库、获取状态并加载第一页提交历史。
    /// 同时将仓库加入工作空间。
    ///
    /// Initializes repo, fetches status, and loads first page of history.
    /// Also adds the repo to the workspace.
    pub fn open_repository(&mut self, path: PathBuf) -> anyhow::Result<()> {
        tracing::info!("Opening repository: {}", path.display());
        let repo = Arc::new(Repository::open(&path).map_err(|e| anyhow::anyhow!("{}", e))?);
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project")
            .to_string();
        self.workspace.add_entry(path.clone(), name);
        self.init_with_repo(repo, path)
    }

    /// 切换到工作空间中的指定项目 —— Switch to a workspace project by index
    ///
    /// 关闭当前仓库并打开目标项目。
    ///
    /// Closes the current repo and opens the target project.
    pub fn switch_to_entry(&mut self, index: usize) -> anyhow::Result<()> {
        if !self.workspace.switch_to(index) {
            return Err(anyhow::anyhow!("Invalid project index"));
        }
        let path = self
            .workspace
            .active_path()
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("No active project"))?;
        self.set_error("".into());
        self.error = None;
        self.close_repository();
        self.open_repository(path)
    }

    /// 刷新工作空间缓存状态 —— Refresh workspace cached status
    pub fn refresh_workspace_status(&mut self) {
        let repo_path = self.repo_path.clone();
        self.workspace.refresh_all();
        // 更新活跃项目的工作空间状态缓存 —— Update active project's workspace cache
        if let Some(ref path) = repo_path {
            let changed = self.repo_status.status.unstaged_files.len()
                + self.repo_status.status.untracked_files.len();
            let staged = self.repo_status.status.staged_files.len();
            let has_conflict = self
                .repo_status
                .status
                .unstaged_files
                .iter()
                .chain(self.repo_status.status.staged_files.iter())
                .any(|f| f.status == ogit::FileStatus::Conflicted);
            self.workspace.update_status(
                path,
                CachedStatus {
                    branch: self.repo_status.status.current_branch.clone(),
                    changed,
                    staged,
                    ahead: self.repo_status.ahead,
                    behind: self.repo_status.behind,
                    has_conflict,
                    ok: true,
                },
            );
        }
    }

    /// 克隆远程仓库 —— Clone a remote repository
    pub fn clone_repository(&mut self, url: &str, into: PathBuf) -> anyhow::Result<()> {
        tracing::info!("Cloning repository: {} -> {}", url, into.display());
        let repo = Arc::new(Repository::clone(url, &into).map_err(|e| anyhow::anyhow!("{}", e))?);
        let name = into
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project")
            .to_string();
        self.workspace.add_entry(into.clone(), name);
        self.init_with_repo(repo, into)
    }

    /// 从工作空间移除项目 —— Remove a project from workspace
    pub fn remove_from_workspace(&mut self, path: &PathBuf) {
        self.workspace.remove_entry(path);
        // 如果移除的是当前活跃项目，切换到第一个
        if self.repo_path.as_ref() == Some(path) {
            self.close_repository();
            if !self.workspace.is_empty()
                && let Some(p) = self.workspace.active_path().cloned()
                && let Err(e) = self.open_repository(p)
            {
                self.set_error(e.to_string());
            }
        }
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
        self.selected_staged_diff_path = None;
        self.diff_preview = None;
        self.current_operation = None;
        self.commit_amend = false;
        let _ = self.load_history_reset();

        Ok(())
    }

    /// 关闭当前仓库 —— Close current repository
    #[allow(dead_code)]
    pub fn close_repository(&mut self) {
        if let Some(ref repo_path) = self.repo_path {
            tracing::info!("Closing repository: {}", repo_path.display());
        }
        self.repository = None;
        self.repo_path = None;
        self.repo_status = RepositoryStatus::default();
        self.error = None;
        self.history_commits.clear();
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.selected_staged_diff_path = None;
        self.diff_preview = None;
        self.current_operation = None;
    }

    /// 刷新仓库状态 —— Refresh repository status
    ///
    /// 重新获取完整仓库状态（文件、分支、远程等），并更新工作空间缓存。
    ///
    /// Re-fetches full repository status (files, branches, remotes, etc.) and updates workspace cache.
    pub fn refresh_status(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            tracing::debug!("Refreshing repository status");
            self.repo_status = repo.get_status().map_err(|e| anyhow::anyhow!("{}", e))?;
            self.error = None;
            self.refresh_workspace_status();
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository opened"))
        }
    }

    // ========================================================================
    // 错误管理 —— Error management
    // ========================================================================

    /// 设置错误消息 —— Set error message
    ///
    /// 同时将错误记录到 tracing 日志中，便于诊断。
    /// Also logs the error to tracing for diagnostics.
    pub fn set_error(&mut self, error: String) {
        tracing::error!("[AppState] {}", error);
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

    /// 暂存所有未暂存和未跟踪的文件 —— Stage all unstaged and untracked files
    pub fn stage_all(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let paths: Vec<String> = self
            .repo_status
            .status
            .unstaged_files
            .iter()
            .chain(self.repo_status.status.untracked_files.iter())
            .map(|e| e.path.to_string_lossy().to_string())
            .collect();
        let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        if !refs.is_empty() {
            repo.stage_files(&refs)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        self.refresh_status()?;
        Ok(())
    }

    /// 取消暂存 —— Unstage a file
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

    /// 取消暂存所有已暂存文件 —— Unstage all staged files
    pub fn unstage_all(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let paths: Vec<String> = self
            .repo_status
            .status
            .staged_files
            .iter()
            .map(|e| e.path.to_string_lossy().to_string())
            .collect();
        let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        if !refs.is_empty() {
            repo.unstage_files(&refs)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
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
        let summary: &str = message.lines().next().unwrap_or("");
        tracing::info!(
            "Committing staged changes (amend={}, summary='{}')",
            amend,
            summary
        );
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
        tracing::info!("Fetching from origin");
        self.current_operation = Some("Fetching…".into());
        let result = repo.fetch("origin").map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
        }
        result
    }

    /// 从 origin 拉取当前分支 —— Pull current branch from origin
    pub fn pull_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.current_operation = Some("Pulling…".into());
        let result = repo
            .pull("origin", branch)
            .map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
            let _ = self.load_history_reset();
        }
        result
    }

    /// 推送当前分支到 origin —— Push current branch to origin
    pub fn push_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.current_operation = Some("Pushing…".into());
        let result = repo
            .push("origin", branch, false)
            .map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
        }
        result
    }

    // ========================================================================
    // 差异视图 —— Diff view
    // ========================================================================

    /// 设置差异文件路径并加载差异 —— Set diff path and load diff preview
    ///
    /// 如果仓库可用，计算工作区与索引之间的差异并缓存到 `diff_preview`。
    /// 设置 `staged` 为 true 时，显示暂存区 vs HEAD 的差异。
    ///
    /// Computes working-tree diff for the given path and caches it in `diff_preview`.
    /// When `staged` is true, shows staged vs HEAD diff.
    pub fn set_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_diff_path = path.clone();
        self.selected_staged_diff_path = None;
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

    /// 设置暂存差异路径并加载差异 —— Set staged diff path and load diff
    ///
    /// 显示暂存区相对于 HEAD 的变更内容（即将提交的内容）。
    ///
    /// Shows staged changes relative to HEAD (what will be committed).
    pub fn set_staged_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_staged_diff_path = path.clone();
        self.selected_diff_path = None;
        self.diff_preview = match (&self.repository, path.as_ref()) {
            (Some(repo), Some(p)) => {
                let s = p.to_string_lossy();
                Some(
                    repo.get_staged_file_diff(s.as_ref())
                        .map_err(|e| anyhow::anyhow!("{}", e))?,
                )
            }
            _ => None,
        };
        Ok(())
    }

    /// 检查是否有未提交的变更 —— Check if working tree has uncommitted changes
    pub fn has_uncommitted_changes(&self) -> bool {
        !self.repo_status.status.unstaged_files.is_empty()
            || !self.repo_status.status.untracked_files.is_empty()
            || !self.repo_status.status.staged_files.is_empty()
    }

    /// 同步工作空间状态到设置 —— Sync workspace state to settings
    pub fn sync_to_settings(&self, settings: &mut crate::settings::AppSettings) {
        settings.workspace.entries = self.workspace.entries.clone();
        settings.workspace.groups = self.workspace.groups.clone();
        settings.workspace.active_index = self.workspace.active_index;
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

// The Project, Workspace, and CommitEditor types have been extracted
// to their own modules: project.rs, workspace.rs, commit_editor.rs
// Re-exported via lib.rs for backward compatibility.
