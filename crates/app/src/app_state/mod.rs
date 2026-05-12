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
//! 方法按职责拆分到子模块：
//! - `repository`：仓库生命周期（打开/关闭/刷新/克隆/切换）
//! - `staging`：暂存区操作（stage/unstage/commit）
//! - `branches`：分支操作（切换/创建/删除/重命名）
//! - `stash`：储藏操作
//! - `tags`：标签操作
//! - `remotes`：远程仓库管理与同步（fetch/pull/push）
//! - `diff`：差异视图相关
//!
//! Defines core entities: AppState (main GPUI Entity) and ViewType.
//! Auxiliary types extracted: Project, Workspace, CommitEditor.
//! Methods split into sub-modules by responsibility.

mod blame_reflog;
mod branches;
mod diff;
mod graph;
mod phase4;
mod remotes;
mod repository;
mod staging;
mod stash;
mod tags;

use gpui::Task;
use ogit::GitOps;
use ogit::{Commit, FileDiff, Repository, RepositoryStatus};
use std::path::PathBuf;
use std::sync::Arc;

use crate::settings::{ProjectGroup, WorkspaceEntry};
use crate::workspace::Workspace;

// ============================================================================
// AppState —— 主应用状态实体
// ============================================================================

/// 通知 toast 条目 —— Toast notification entry
#[derive(Debug, Clone)]
pub struct Toast {
    pub id: String,
    pub message: String,
    pub kind: ToastKind,
    pub created_at: std::time::Instant,
}

/// 通知类型 —— Toast kind
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToastKind {
    Success,
    Error,
    Info,
}

/// 项目视图状态快照 —— Per-project view state snapshot
#[derive(Debug, Clone)]
pub struct ProjectViewState {
    pub active_view: ViewType,
    pub selected_diff_path: Option<PathBuf>,
    pub selected_staged_diff_path: Option<PathBuf>,
    pub selected_history: Option<usize>,
}

impl Default for ProjectViewState {
    fn default() -> Self {
        Self {
            active_view: ViewType::Commit,
            selected_diff_path: None,
            selected_staged_diff_path: None,
            selected_history: None,
        }
    }
}

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
    /// 通知 toast 列表 —— Toast notifications
    pub toasts: Vec<Toast>,
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
    /// 选中文件的差异预览（缓存） —— Cached diff for selected_diff_path
    pub diff_preview: Option<FileDiff>,
    /// 当前正在执行的操作描述 —— Current operation description for status bar
    pub current_operation: Option<String>,
    /// 是否使用 --amend 模式提交 —— Amend toggle for next commit
    pub commit_amend: bool,
    /// 待处理的后台任务 —— Pending background tasks
    pub _pending_tasks: Vec<Task<()>>,
    /// 每个项目的视图状态缓存 —— View state cache per project path
    pub project_view_states: std::collections::HashMap<PathBuf, ProjectViewState>,
    /// 缓存的储藏列表 —— Cached stash list
    pub stash_list: Vec<ogit::Stash>,
    /// 缓存的标签列表 —— Cached tag list
    pub tag_list: Vec<ogit::Tag>,
    /// 缓存的远程列表 —— Cached remote list
    pub remote_list: Vec<ogit::Remote>,

    // ========================================================================
    // Phase 4: 历史、搜索与可视化 —— History, Search & Visualization
    // ========================================================================
    /// 提交图数据 —— Commit graph data
    pub graph_data: Option<ogit::GraphData>,
    /// 历史筛选：分支名 —— History filter: branch name
    pub history_filter_branch: Option<String>,
    /// 历史筛选：作者 —— History filter: author
    pub history_filter_author: Option<String>,
    /// 历史筛选：文件路径 —— History filter: file path
    pub history_filter_file: Option<String>,
    /// 提交搜索结果 —— Commit search results
    pub search_results: Vec<Commit>,
    /// 当前搜索查询 —— Current search query
    pub search_query: String,
    /// 是否正在搜索 —— Search in progress flag
    pub is_searching: bool,
    /// 文件搜索结果 —— File search results
    pub file_search_results: Vec<std::path::PathBuf>,
    /// 文件历史：当前文件路径 —— File history: current file path
    pub file_history_path: Option<std::path::PathBuf>,
    /// 文件历史：提交列表 —— File history: commit list
    pub file_history_commits: Vec<Commit>,
    /// 选中的提交详情 —— Selected commit detail
    pub selected_commit_detail: Option<Commit>,
    /// 选中提交的文件差异列表 —— Files changed in selected commit
    pub selected_commit_diff: Vec<ogit::FileDiff>,
    /// Blame 数据 —— Blame data for a file
    pub blame_data: Vec<ogit::BlameLine>,
    /// Blame 文件路径 —— Path of the file being blamed
    pub blame_path: Option<std::path::PathBuf>,
    /// 引用日志条目 —— Reflog entries
    pub reflog_entries: Vec<ogit::ReflogEntry>,
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
    // 通知系统 —— Toast notifications
    // ========================================================================

    /// 添加一个 toast 通知 —— Add a toast notification
    pub fn add_toast(&mut self, message: impl Into<String>, kind: ToastKind) {
        use std::time::{SystemTime, UNIX_EPOCH};
        let msg = message.into();
        let id = format!(
            "toast-{}-{:?}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis(),
            kind
        );
        tracing::info!("[Toast] {:?}: {}", kind, msg);
        self.toasts.push(Toast {
            id,
            message: msg,
            kind,
            created_at: std::time::Instant::now(),
        });
        if self.toasts.len() > 5 {
            self.toasts.remove(0);
        }
    }

    /// 移除指定 id 的 toast —— Remove toast by id
    pub fn remove_toast(&mut self, id: &str) {
        self.toasts.retain(|t| t.id != id);
    }

    /// 清除所有 toast —— Clear all toasts
    #[allow(dead_code)]
    pub fn clear_toasts(&mut self) {
        self.toasts.clear();
    }

    /// 清理过期的 toast（超过 5 秒） —— Remove expired toasts (older than 5s)
    pub fn expire_toasts(&mut self) {
        let now = std::time::Instant::now();
        self.toasts
            .retain(|t| now.duration_since(t.created_at).as_secs() < 5);
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
/// 当前支持：Commit、History、Branches、Diff、Stash、Tags。
/// Phase 4 新增：Graph（提交图）、Detail（提交详情）、FileSearch（文件搜索）、
/// FileHistory（文件历史）、Blame（行注释）、Reflog（引用日志）。
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
    /// 储藏管理视图 —— Stash management view
    Stash,
    /// 标签管理视图 —— Tag management view
    Tags,
    /// 提交图视图 —— Commit graph view (Phase 4)
    Graph,
    /// 提交详情视图 —— Commit detail view (Phase 4)
    Detail,
    /// 文件搜索视图 —— File search view (Phase 4)
    FileSearch,
    /// 文件历史视图 —— File history view (Phase 4)
    FileHistory,
    /// Blame 视图 —— Blame view (Phase 4)
    Blame,
    /// 引用日志视图 —— Reflog view (Phase 4)
    Reflog,
    /// 欢迎/空状态视图 —— Welcome/empty state view
    #[allow(dead_code)]
    Welcome,
}

// The Project, Workspace, and CommitEditor types have been extracted
// to their own modules: project.rs, workspace.rs, commit_editor.rs
// Re-exported via lib.rs for backward compatibility.
