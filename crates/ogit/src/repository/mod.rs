//! 仓库操作实现模块 —— Repository implementation module
//!
//! 本模块是对 `GitOps` trait 的具体实现，基于 `git2-rs`（libgit2 的 Rust 绑定）。
//! 为了减少单一文件的复杂度，已按功能拆分为以下子模块：
//!
//! | 子模块 | 功能 |
//! |--------|------|
//! | `status` | 仓库状态查询（status, head） |
//! | `history` | 提交历史查询（history, branch_commits, single_commit） |
//! | `diff` | 差异计算（commit_diff, file_diff） |
//! | `branch` | 分支管理（列表、创建、删除、切换） |
//! | `remote` | 远程仓库管理（列表、添加、删除、fetch、pull、push） |
//! | `tag` | 标签管理（列表、创建、删除） |
//! | `staging` | 暂存区操作（stage, unstage, discard） |
//! | `commit` | 提交操作（commit, amend） |
//! | `stash` | 储藏管理（列表、创建、应用、弹出、删除） |
//! | `merge_reset` | 合并与重置（merge, revert, reset） |
//!
//! This module implements the `GitOps` trait using `git2-rs` (Rust bindings for libgit2).
//! It's split into focused sub-modules for maintainability.

mod branch;
mod commit;
mod diff;
mod history;
mod merge_reset;
mod remote;
mod staging;
mod stash;
mod status;
mod tag;

use crate::model::*;
use crate::operations::{GitError, GitOps, ResetMode};
use chrono::{TimeZone, Utc};
use git2::Repository as Git2Repo;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// Git 仓库封装 —— Repository wrapper around git2
///
/// 使用 `Mutex<Git2Repo>` 包裹 libgit2 仓库对象，提供线程安全的内部可变性，
/// 这样 `GitOps` trait 的所有方法可以接收 `&self` 而非 `&mut self`。
///
/// ## 使用示例
/// ```ignore
/// let repo = Repository::open("/path/to/repo")?;
/// let status = repo.get_status()?;
/// ```
///
/// Wraps `git2::Repository` in a `Mutex` for thread-safe interior mutability,
/// allowing `GitOps` trait methods to take `&self` instead of `&mut self`.
pub struct Repository {
    /// 内部 git2 仓库实例，用互斥锁保护 —— Inner git2 repo protected by mutex
    repo: Mutex<Git2Repo>,
    /// 仓库在文件系统上的路径 —— Filesystem path of the repository
    path: PathBuf,
}

impl Repository {
    /// 打开指定路径的 Git 仓库 —— Open a repository at the given path
    ///
    /// 如果路径不是有效的 Git 仓库（没有 .git 目录），返回 `GitError::RepoNotFound`。
    ///
    /// Returns `GitError::RepoNotFound` if the path does not contain a valid Git repository.
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = path.into();
        let repo =
            Git2Repo::open(&path).map_err(|_| GitError::RepoNotFound { path: path.clone() })?;

        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// 从远程 URL 克隆仓库 —— Clone a repository from a URL
    ///
    /// 执行 `git clone <url> <path>` 操作，克隆完成后可立即使用。
    ///
    /// Performs `git clone <url> <path>` — ready to use after completion.
    pub fn clone(url: &str, into: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = into.into();
        let repo = git2::build::RepoBuilder::new()
            .clone(url, &path)
            .map_err(|e| GitError::WriteError(format!("Failed to clone {}: {}", url, e)))?;
        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// 在指定路径初始化新仓库 —— Initialize a new repository at the given path
    pub fn init(path: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = path.into();
        let repo = Git2Repo::init(&path)?;
        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// 获取仓库路径 —— Get repository path
    pub fn path(&self) -> &PathBuf {
        &self.path
    }
}

// ============================================================================
// 辅助函数 —— Helper functions (shared across sub-modules)
// ============================================================================

/// 将 git2 的文件状态转换为我们的模型类型 —— Convert git2 file status to our model
///
/// ## 状态映射优先级（从高到低） —— Priority order (highest first)
/// 1. Deleted（已删除）
/// 2. Renamed（已重命名）
/// 3. Conflicted（冲突）
/// 4. Modified（已修改）
/// 5. Untracked / New（未跟踪/新文件）
/// 6. Unmodified（未修改）
pub(crate) fn git_status_to_model(status: git2::Status) -> FileStatus {
    if status.contains(git2::Status::WT_DELETED) || status.contains(git2::Status::INDEX_DELETED) {
        FileStatus::Deleted
    } else if status.contains(git2::Status::WT_RENAMED)
        || status.contains(git2::Status::INDEX_RENAMED)
    {
        FileStatus::Renamed
    } else if status.contains(git2::Status::CONFLICTED) {
        FileStatus::Conflicted
    } else if status.contains(git2::Status::WT_MODIFIED)
        || status.contains(git2::Status::INDEX_MODIFIED)
    {
        FileStatus::Modified
    } else if status.contains(git2::Status::WT_NEW) {
        FileStatus::Untracked
    } else if status.contains(git2::Status::INDEX_NEW) {
        FileStatus::Added
    } else {
        FileStatus::Unmodified
    }
}

/// 将 git2 的 Commit 对象转换为我们的模型 —— Convert git2 Commit to our model
///
/// 提取提交的 hash、作者、提交者、时间、消息和父提交列表。
/// 时间戳使用 UTC 时区解析。
///
/// Extracts hash, author, committer, time, message, and parent commits.
/// Timestamps are parsed in UTC.
pub(crate) fn git_commit_to_model(commit: git2::Commit) -> Commit {
    let time_obj = commit.time();
    let datetime = Utc.timestamp_opt(time_obj.seconds(), 0).unwrap();

    Commit {
        hash: commit.id().to_string(),
        summary: commit.summary().unwrap_or("").to_string(),
        message: commit.message().unwrap_or("").to_string(),
        author: commit.author().name().unwrap_or("Unknown").to_string(),
        committer: commit.committer().name().unwrap_or("Unknown").to_string(),
        time: datetime,
        parents: commit.parents().map(|p| p.id().to_string()).collect(),
    }
}

/// 将 git2 的 Delta 类型转换为文件状态 —— Convert git2 Delta to file status
pub(crate) fn delta_file_status(d: git2::Delta) -> FileStatus {
    match d {
        git2::Delta::Added => FileStatus::Added,
        git2::Delta::Deleted => FileStatus::Deleted,
        git2::Delta::Renamed => FileStatus::Renamed,
        git2::Delta::Copied => FileStatus::Added,
        git2::Delta::Untracked => FileStatus::Untracked,
        git2::Delta::Modified | git2::Delta::Typechange => FileStatus::Modified,
        _ => FileStatus::Modified,
    }
}

// ============================================================================
// GitOps trait 实现 —— GitOps trait implementation
// ============================================================================
//
// 采用重命名委托模式：子模块定义带有 `__` 前缀的私有实现方法，
// 本块实现 GitOps trait，将标准接口方法委托给同名的私有实现方法。
// 子模块中实现方法命名为 `fn __get_status(...)` 等，公有的 trait 方法
// 通过 `self.__get_status(...)` 调用它们，从而避免同名方法导致的无限递归。
//
// Uses rename-delegation pattern: submodules define private `__`-prefixed
// implementation methods; this trait impl delegates public trait methods to
// those private methods, avoiding infinite recursion from same-named methods.

impl GitOps for Repository {
    fn get_status(&self) -> Result<RepositoryStatus, GitError> {
        self.__get_status()
    }

    fn get_head(&self) -> Result<Option<Commit>, GitError> {
        self.__get_head()
    }

    fn get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError> {
        self.__get_history(count, skip)
    }

    fn get_branch_commits(
        &self,
        branch: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        self.__get_branch_commits(branch, count, skip)
    }

    fn get_commit(&self, hash: &str) -> Result<Commit, GitError> {
        self.__get_commit(hash)
    }

    fn get_commit_diff(&self, hash: &str) -> Result<Vec<FileDiff>, GitError> {
        self.__get_commit_diff(hash)
    }

    fn get_file_diff(&self, path: &str) -> Result<FileDiff, GitError> {
        self.__get_file_diff(path)
    }

    fn get_staged_file_diff(&self, path: &str) -> Result<FileDiff, GitError> {
        self.__get_staged_file_diff(path)
    }

    fn get_all_staged_diff(&self) -> Result<Vec<FileDiff>, GitError> {
        self.__get_all_staged_diff()
    }

    fn get_branches(&self) -> Result<Vec<Branch>, GitError> {
        self.__get_branches()
    }

    fn create_branch(&self, name: &str, target: Option<&str>) -> Result<Branch, GitError> {
        self.__create_branch(name, target)
    }

    fn delete_branch(&self, name: &str, force: bool) -> Result<(), GitError> {
        self.__delete_branch(name, force)
    }

    fn switch_branch(&self, name: &str) -> Result<(), GitError> {
        self.__switch_branch(name)
    }

    fn get_remotes(&self) -> Result<Vec<Remote>, GitError> {
        self.__get_remotes()
    }

    fn add_remote(&self, name: &str, url: &str) -> Result<Remote, GitError> {
        self.__add_remote(name, url)
    }

    fn remove_remote(&self, name: &str) -> Result<(), GitError> {
        self.__remove_remote(name)
    }

    fn get_tags(&self) -> Result<Vec<Tag>, GitError> {
        self.__get_tags()
    }

    fn create_tag(
        &self,
        name: &str,
        target: Option<&str>,
        message: Option<&str>,
    ) -> Result<Tag, GitError> {
        self.__create_tag(name, target, message)
    }

    fn delete_tag(&self, name: &str) -> Result<(), GitError> {
        self.__delete_tag(name)
    }

    fn stage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        self.__stage_files(paths)
    }

    fn unstage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        self.__unstage_files(paths)
    }

    fn discard_changes(&self, paths: &[&str]) -> Result<(), GitError> {
        self.__discard_changes(paths)
    }

    fn commit(&self, message: &str, author: Option<&str>) -> Result<Commit, GitError> {
        self.__commit(message, author)
    }

    fn amend_commit(
        &self,
        message: Option<&str>,
        author: Option<&str>,
    ) -> Result<Commit, GitError> {
        self.__amend_commit(message, author)
    }

    fn fetch(&self, remote: &str) -> Result<(), GitError> {
        self.__fetch(remote)
    }

    fn pull(&self, remote: &str, branch: &str) -> Result<(), GitError> {
        self.__pull(remote, branch)
    }

    fn push(&self, remote: &str, branch: &str, force: bool) -> Result<(), GitError> {
        self.__push(remote, branch, force)
    }

    fn merge(&self, branch: &str) -> Result<(), GitError> {
        self.__merge(branch)
    }

    fn abort_merge(&self) -> Result<(), GitError> {
        self.__abort_merge()
    }

    fn resolve_conflict(&self, path: &str, resolution: &str) -> Result<(), GitError> {
        self.__resolve_conflict(path, resolution)
    }

    fn get_stashes(&self) -> Result<Vec<Stash>, GitError> {
        self.__get_stashes()
    }

    fn create_stash(&self, message: Option<&str>) -> Result<Stash, GitError> {
        self.__create_stash(message)
    }

    fn apply_stash(&self, stash_id: &str) -> Result<(), GitError> {
        self.__apply_stash(stash_id)
    }

    fn pop_stash(&self, stash_id: &str) -> Result<(), GitError> {
        self.__pop_stash(stash_id)
    }

    fn delete_stash(&self, stash_id: &str) -> Result<(), GitError> {
        self.__delete_stash(stash_id)
    }

    fn revert_commit(&self, hash: &str) -> Result<Commit, GitError> {
        self.__revert_commit(hash)
    }

    fn reset(&self, target: &str, mode: ResetMode) -> Result<(), GitError> {
        self.__reset(target, mode)
    }
}
