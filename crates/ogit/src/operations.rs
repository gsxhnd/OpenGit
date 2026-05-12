//! 高层 Git 操作抽象层 —— High-level Git operations abstraction
//!
//! 本模块定义了 Git 操作的核心抽象：
//! 1. `GitError` — 所有可能的 Git 操作错误类型，包含 15 种具体错误变体。
//!    每个变体都有可读的错误消息，便于 UI 层直接展示。
//! 2. `GitOps` trait — Git 操作的统一接口，约 30 个方法覆盖仓库管理全场景。
//!    任何 Git 后端（git2、命令行 git、libgit2-sys 等）只需实现此 trait。
//! 3. `ResetMode` — git reset 的三种模式（soft/mixed/hard）。
//!
//! This module defines the core abstraction for Git operations:
//! 1. `GitError` — all possible Git operation error types with 15 concrete variants.
//! 2. `GitOps` trait — unified interface for Git operations (~30 methods).
//! 3. `ResetMode` — three modes for git reset (soft/mixed/hard).

use crate::model::*;
use std::path::PathBuf;

/// Git 操作错误类型 —— Git operation error types
///
/// 涵盖所有 Git 操作可能遇到的错误场景，从仓库未找到、读写失败到合并冲突等。
/// 每种错误都用 `#[error]` 宏提供了用户友好的描述信息。
///
/// Covers all error scenarios: repo not found, read/write failures, merge conflicts etc.
#[derive(Debug, thiserror::Error)]
pub enum GitError {
    /// 指定路径未找到 Git 仓库 —— Repository not found at the given path
    #[error("Repository not found at {path}")]
    RepoNotFound { path: PathBuf },

    /// 仓库读取失败 —— Failed to read repository
    #[error("Failed to read repository: {0}")]
    ReadError(String),

    /// 仓库写入失败 —— Failed to write to repository
    #[error("Failed to write to repository: {0}")]
    WriteError(String),

    /// 分支已存在 —— Branch already exists
    #[error("Branch '{name}' already exists")]
    BranchExists { name: String },

    /// 分支未找到 —— Branch not found
    #[error("Branch '{name}' not found")]
    BranchNotFound { name: String },

    /// 合并冲突，包含冲突文件数量 —— Merge conflict with count of conflicting files
    #[error("Merge conflict in {count} files")]
    MergeConflict { count: usize },

    /// 远程仓库认证失败 —— Authentication failed for remote
    #[error("Authentication failed for remote '{remote}'")]
    AuthFailed { remote: String },

    /// 远程仓库未找到 —— Remote not found
    #[error("Remote '{remote}' not found")]
    RemoteNotFound { remote: String },

    /// 标签已存在 —— Tag already exists
    #[error("Tag '{name}' already exists")]
    TagExists { name: String },

    /// 引用无效 —— Invalid reference
    #[error("Invalid reference: {0}")]
    InvalidRef(String),

    /// git2 库内部错误 —— git2 library internal error
    #[error("Git2 error: {0}")]
    Git2(#[from] git2::Error),

    /// 文件 IO 错误 —— File I/O error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// 操作尚未实现 —— Operation not yet implemented
    ///
    /// 用于标记尚未完成实现的 Git 操作（如 merge、stash apply 等），
    /// 避免"静默成功"带来的逻辑错误。
    ///
    /// Marks operations that haven't been implemented yet to avoid silent success.
    #[error("Operation '{op}' is not yet implemented")]
    UnsupportedOperation { op: String },
}

/// Git 操作统一接口 —— Unified interface for Git operations
///
/// 定义了约 30 个 Git 操作方法，覆盖：
/// - 仓库状态查询（status, head, history, branches, remotes, tags）
/// - 文件操作（stage, unstage, discard, diff）
/// - 提交管理（commit, amend, revert）
/// - 分支管理（create, delete, switch, merge）
/// - 远程操作（fetch, pull, push）
/// - 储藏管理（stash create/apply/pop/delete）
/// - 重置（reset in soft/mixed/hard modes）
///
/// 所有方法通过 `&self` 接收，由实现方处理内部可变性。
///
/// Defines ~30 Git operation methods covering the full lifecycle of Git management.
/// All methods take `&self` — implementors handle interior mutability.
pub trait GitOps {
    /// 获取仓库完整状态（工作区 + 分支 + 远程 + 标签） —— Get full repository status
    fn get_status(&self) -> Result<RepositoryStatus, GitError>;

    /// 获取当前 HEAD 提交 —— Get current HEAD commit
    fn get_head(&self) -> Result<Option<Commit>, GitError>;

    /// 按分页获取提交历史 —— Get commit history with pagination
    fn get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError>;

    /// 获取指定分支的提交历史 —— Get commits on a specific branch
    fn get_branch_commits(
        &self,
        branch: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError>;

    /// 获取单个提交的详细信息 —— Get commit details by hash
    fn get_commit(&self, hash: &str) -> Result<Commit, GitError>;

    /// 获取指定提交的完整差异 —— Get diff for a specific commit
    fn get_commit_diff(&self, hash: &str) -> Result<Vec<FileDiff>, GitError>;

    /// 获取工作区中单个文件的差异 —— Get working-tree diff for a single file
    fn get_file_diff(&self, path: &str) -> Result<FileDiff, GitError>;

    /// 获取暂存区中单个文件与 HEAD 的差异 —— Get staged-vs-HEAD diff for a single file
    fn get_staged_file_diff(&self, path: &str) -> Result<FileDiff, GitError>;

    /// 获取所有暂存文件与 HEAD 的差异 —— Get diff for all staged files vs HEAD
    fn get_all_staged_diff(&self) -> Result<Vec<FileDiff>, GitError>;

    /// 获取所有分支列表 —— Get all branches
    fn get_branches(&self) -> Result<Vec<Branch>, GitError>;

    /// 创建新分支 —— Create a new branch
    fn create_branch(&self, name: &str, target: Option<&str>) -> Result<Branch, GitError>;

    /// 删除分支 —— Delete a branch
    fn delete_branch(&self, name: &str, force: bool) -> Result<(), GitError>;

    /// 切换到指定分支 —— Switch to a branch
    fn switch_branch(&self, name: &str) -> Result<(), GitError>;

    /// 获取所有远程仓库列表 —— Get all remotes
    fn get_remotes(&self) -> Result<Vec<Remote>, GitError>;

    /// 添加远程仓库 —— Add a remote
    fn add_remote(&self, name: &str, url: &str) -> Result<Remote, GitError>;

    /// 移除远程仓库 —— Remove a remote
    fn remove_remote(&self, name: &str) -> Result<(), GitError>;

    /// 获取所有标签 —— Get all tags
    fn get_tags(&self) -> Result<Vec<Tag>, GitError>;

    /// 创建标签（支持轻量标签和注释标签） —— Create a tag (lightweight or annotated)
    fn create_tag(
        &self,
        name: &str,
        target: Option<&str>,
        message: Option<&str>,
    ) -> Result<Tag, GitError>;

    /// 删除标签 —— Delete a tag
    fn delete_tag(&self, name: &str) -> Result<(), GitError>;

    /// 暂存文件到索引 —— Stage files to index
    fn stage_files(&self, paths: &[&str]) -> Result<(), GitError>;

    /// 取消暂存文件 —— Unstage files from index
    fn unstage_files(&self, paths: &[&str]) -> Result<(), GitError>;

    /// 放弃工作区的修改 —— Discard working tree changes
    fn discard_changes(&self, paths: &[&str]) -> Result<(), GitError>;

    /// 提交暂存的更改 —— Commit staged changes
    fn commit(&self, message: &str, author: Option<&str>) -> Result<Commit, GitError>;

    /// 修补上一次提交 —— Amend the last commit
    fn amend_commit(&self, message: Option<&str>, author: Option<&str>)
    -> Result<Commit, GitError>;

    /// 从远程仓库获取更新 —— Fetch from remote
    fn fetch(&self, remote: &str) -> Result<(), GitError>;

    /// 从远程仓库拉取并合并 —— Pull from remote (fetch + merge)
    fn pull(&self, remote: &str, branch: &str) -> Result<(), GitError>;

    /// 推送到远程仓库 —— Push to remote
    fn push(&self, remote: &str, branch: &str, force: bool) -> Result<(), GitError>;

    /// 合并指定分支 —— Merge a branch
    fn merge(&self, branch: &str) -> Result<(), GitError>;

    /// 中止正在进行的合并 —— Abort ongoing merge
    fn abort_merge(&self) -> Result<(), GitError>;

    /// 解决指定文件的合并冲突 —— Resolve merge conflict for a file
    fn resolve_conflict(&self, path: &str, resolution: &str) -> Result<(), GitError>;

    /// 获取所有储藏列表 —— Get all stashes
    fn get_stashes(&self) -> Result<Vec<Stash>, GitError>;

    /// 创建新储藏 —— Create a new stash
    fn create_stash(&self, message: Option<&str>) -> Result<Stash, GitError>;

    /// 应用储藏（不删除） —— Apply a stash (keep it)
    fn apply_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// 弹出储藏（应用并删除） —— Pop a stash (apply and drop)
    fn pop_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// 删除储藏 —— Delete a stash
    fn delete_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// 还原指定提交 —— Revert a commit
    fn revert_commit(&self, hash: &str) -> Result<Commit, GitError>;

    /// 重置到指定提交 —— Reset to a target commit
    fn reset(&self, target: &str, mode: ResetMode) -> Result<(), GitError>;

    // ========================================================================
    // Phase 4: 历史、搜索与可视化 —— History, Search & Visualization
    // ========================================================================

    /// 获取提交图数据（含拓扑、分支/标签标记） —— Get commit graph with topology and markers
    fn get_graph(&self, count: usize) -> Result<GraphData, GitError>;

    /// 按作者筛选提交历史 —— Filter commit history by author
    fn filter_history_by_author(
        &self,
        author: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError>;

    /// 按文件路径筛选提交历史 —— Filter commit history by file path
    fn filter_history_by_file(
        &self,
        path: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError>;

    /// 搜索提交（按 message / hash / author 模糊搜索） —— Search commits by message, hash, or author
    fn search_commits(&self, query: &str, count: usize) -> Result<Vec<Commit>, GitError>;

    /// 按文件名搜索工作区文件 —— Search files by name in working tree
    fn search_files(&self, pattern: &str) -> Result<Vec<PathBuf>, GitError>;

    /// 获取单文件提交历史 —— Get commit history for a single file
    fn get_file_history(
        &self,
        path: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError>;

    /// 获取文件的 blame 信息 —— Get blame information for a file
    fn get_blame(&self, path: &str) -> Result<Vec<BlameLine>, GitError>;

    /// 获取引用日志 —— Get reflog entries
    fn get_reflog(&self, count: usize) -> Result<Vec<ReflogEntry>, GitError>;
}

/// Git 重置模式 —— Git reset mode
///
/// 对应 `git reset` 的三种模式：
/// - `Soft`：仅移动 HEAD，保留暂存区和工作区（`--soft`）
/// - `Mixed`：移动 HEAD 并重置暂存区，保留工作区（`--mixed`，默认）
/// - `Hard`：完全丢弃所有更改（`--hard`，危险操作）
///
/// Corresponds to `git reset` modes: soft (only move HEAD), mixed (reset index too),
/// hard (discard everything).
#[derive(Debug, Clone, Copy)]
pub enum ResetMode {
    /// 仅移动 HEAD，保留暂存区和工作区更改 —— Soft: only move HEAD
    Soft,
    /// 重置 HEAD 和暂存区，保留工作区更改 —— Mixed: reset HEAD and index
    Mixed,
    /// 完全丢弃所有更改 —— Hard: discard everything
    Hard,
}
