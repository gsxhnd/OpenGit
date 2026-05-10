//! 仓库状态查询 —— Repository status queries
//!
//! 实现 `get_status()` 和 `get_head()` 方法。
//! `get_status()` 是最复杂的查询方法，它一次性收集：
//! - 工作区文件状态（unstaged / staged / untracked）
//! - 当前分支名称
//! - HEAD 提交信息
//! - 所有分支、远程、标签
//! - 与上游的 ahead/behind 计数
//!
//! Implements `get_status()` and `get_head()` — the most comprehensive status query.

use crate::model::*;
use crate::operations::GitError;
use crate::repository::{git_commit_to_model, git_status_to_model, Repository};
use std::path::PathBuf;

impl Repository {
    /// 获取仓库完整状态 —— Get full repository status
    ///
    /// 执行以下步骤：
    /// 1. 获取并分类工作区文件状态（unstaged / staged / untracked）
    /// 2. 获取当前分支名称
    /// 3. 获取 HEAD 提交（如果是未出生分支则返回 None）
    /// 4. 获取所有分支列表（本地分支）
    /// 5. 获取所有远程列表
    /// 6. 获取所有标签列表
    /// 7. 计算与上游分支的 ahead/behind 计数
    ///
    /// Steps: classify working tree files, get current branch, HEAD commit,
    /// list all branches/remotes/tags, compute ahead/behind counts.
    pub(crate) fn __get_status(&self) -> Result<RepositoryStatus, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut status = RepositoryStatus::default();

        // ============================
        // 第一轮：收集文件状态 —— Collect file statuses
        // ============================
        // git2 的状态是位掩码，一个文件可能同时有 index 和 working tree 的变化
        // git2 statuses are bitmasks — a file can have both index and working tree changes
        let mut unstaged = Vec::new();
        let mut staged = Vec::new();
        let mut untracked = Vec::new();

        let statuses = repo.statuses(None)?;
        for entry in statuses.iter() {
            let s = entry.status();
            // 跳过被 .gitignore 忽略的文件 —— Skip ignored files
            if s.contains(git2::Status::IGNORED) {
                continue;
            }

            let path = PathBuf::from(entry.path().unwrap_or(""));
            let file_status = git_status_to_model(s);

            // 判断文件是否在暂存区有变更 —— Check if file has index changes
            let has_index = s.intersects(
                git2::Status::INDEX_NEW
                    | git2::Status::INDEX_MODIFIED
                    | git2::Status::INDEX_DELETED
                    | git2::Status::INDEX_RENAMED
                    | git2::Status::INDEX_TYPECHANGE,
            );
            // 判断文件在工作区是否有变更 —— Check if file has working tree changes
            let has_wt = s.intersects(
                git2::Status::WT_MODIFIED
                    | git2::Status::WT_DELETED
                    | git2::Status::WT_TYPECHANGE
                    | git2::Status::WT_RENAMED
                    | git2::Status::CONFLICTED,
            );

            // 未跟踪文件：工作区新增且未在索引中 —— Untracked: new in working tree, not in index
            if s.contains(git2::Status::WT_NEW) && !has_index {
                untracked.push(FileEntry {
                    path,
                    status: file_status,
                    staged: false,
                    unstaged: true,
                });
                continue;
            }

            if has_index {
                staged.push(FileEntry {
                    path: path.clone(),
                    status: file_status,
                    staged: true,
                    unstaged: false,
                });
            }
            if has_wt || s.contains(git2::Status::WT_NEW) {
                unstaged.push(FileEntry {
                    path,
                    status: file_status,
                    staged: false,
                    unstaged: true,
                });
            }
        }

        // ============================
        // 第二轮：获取 HEAD 和分支信息 —— Collect HEAD and branch info
        // ============================
        let head = repo.head().ok();
        let current_branch = head
            .as_ref()
            .and_then(|h| h.shorthand())
            .map(|s| s.to_string());

        let head_commit = match repo.head() {
            Ok(head) => {
                let target = head.target().ok_or_else(|| {
                    GitError::InvalidRef("HEAD does not point to a commit".to_string())
                })?;
                let commit = repo.find_commit(target)?;
                Some(git_commit_to_model(commit))
            }
            // 未出生的分支（刚 `git init` 还没有任何提交） —— Unborn branch (fresh init, no commits)
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => None,
            Err(e) => return Err(GitError::from(e)),
        };

        // ============================
        // 第三轮：收集分支列表 —— Collect branches
        // ============================
        let mut branches = Vec::new();
        let head_name = repo
            .head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()));

        for branch_result in repo.branches(None)? {
            let (branch, _) = branch_result?;
            let name = branch.name()?.unwrap_or("").to_string();
            let target = branch
                .get()
                .target()
                .map(|oid| oid.to_string())
                .unwrap_or_default();

            let upstream = branch
                .upstream()
                .ok()
                .and_then(|b| b.name().ok().flatten().map(|n| n.to_string()));

            branches.push(Branch {
                name: name.clone(),
                target,
                is_local: true,
                is_head: head_name.as_ref().map(|h| h == &name).unwrap_or(false),
                upstream,
            });
        }

        // ============================
        // 第四轮：收集远程列表 —— Collect remotes
        // ============================
        let mut remotes = Vec::new();
        for name_opt in repo.remotes()?.iter() {
            if let Some(name) = name_opt {
                if let Ok(remote) = repo.find_remote(name) {
                    let fetch_url = remote.url().unwrap_or("").to_string();
                    remotes.push(Remote {
                        name: name.to_string(),
                        fetch_url,
                        push_url: None,
                    });
                }
            }
        }

        // ============================
        // 第五轮：收集标签列表 —— Collect tags
        // ============================
        let mut tags = Vec::new();
        for tag_name in repo.tag_names(None)?.iter().flatten() {
            let oid = repo.revparse_single(tag_name)?;
            tags.push(Tag {
                name: tag_name.to_string(),
                target: oid.id().to_string(),
                message: None,
                tagger: None,
            });
        }

        // ============================
        // 组装最终状态 —— Assemble final status
        // ============================
        status.status = WorkingTreeStatus {
            unstaged_files: unstaged,
            staged_files: staged,
            untracked_files: untracked,
            current_branch,
            merge_head: None,
            rebase_merge: None,
        };
        status.head = head_commit;
        status.branches = branches;
        status.remotes = remotes;
        status.tags = tags;

        // ============================
        // 第六轮：计算与上游的 ahead/behind —— Compute ahead/behind
        // ============================
        if let Ok(head_ref) = repo.head() {
            let local_branch = git2::Branch::wrap(head_ref);
            if let Ok(upstream_branch) = local_branch.upstream() {
                if let (Ok(local_commit), Ok(upstream_commit)) = (
                    local_branch.get().peel_to_commit(),
                    upstream_branch.get().peel_to_commit(),
                ) {
                    if let Ok((ahead, behind)) =
                        repo.graph_ahead_behind(local_commit.id(), upstream_commit.id())
                    {
                        status.ahead = ahead;
                        status.behind = behind;
                    }
                }
            }
        }

        Ok(status)
    }

    /// 获取当前 HEAD 提交 —— Get current HEAD commit
    ///
    /// 如果仓库还没有任何提交（未出生分支），返回 `Ok(None)`。
    ///
    /// Returns `Ok(None)` for unborn branches (no commits yet).
    pub(crate) fn __get_head(&self) -> Result<Option<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        match repo.head() {
            Ok(head) => {
                let target = head.target().ok_or_else(|| {
                    GitError::InvalidRef("HEAD does not point to a commit".to_string())
                })?;
                let commit = repo.find_commit(target)?;
                Ok(Some(git_commit_to_model(commit)))
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => Ok(None),
            Err(e) => Err(GitError::from(e)),
        }
    }
}
