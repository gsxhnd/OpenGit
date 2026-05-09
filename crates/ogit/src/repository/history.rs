//! 提交历史查询 —— Commit history queries
//!
//! 实现以下方法：
//! - `get_history(count, skip)` — 分页获取提交历史
//! - `get_branch_commits(branch, count, skip)` — 获取指定分支的提交历史
//! - `get_commit(hash)` — 获取单个提交的详细信息
//!
//! 使用 git2 的 revwalk 实现提交遍历，支持分页（skip/count）。
//!
//! Implements paginated commit history queries using git2's revwalk.

use crate::model::Commit;
use crate::operations::{GitError, GitOps};
use crate::repository::{git_commit_to_model, Repository};

impl GitOps for Repository {
    /// 分页获取提交历史 —— Get commit history with pagination
    ///
    /// 从 HEAD 开始反向遍历提交图（按时间倒序）。
    /// `count` 为本次要获取的数量，`skip` 为跳过的提交数。
    ///
    /// Walks the commit graph from HEAD in reverse chronological order.
    /// `count` = number of commits to fetch, `skip` = number of commits to skip.
    fn get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        // 从 HEAD 开始遍历 —— Start traversal from HEAD
        revwalk.push_head()?;

        for (i, oid_result) in revwalk.enumerate() {
            if i < skip {
                continue;
            }
            if i >= skip + count {
                break;
            }

            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    /// 获取指定分支的提交历史 —— Get commits on a specific branch
    ///
    /// 从 `refs/heads/<branch>` 开始遍历，支持分页。
    ///
    /// Walks from `refs/heads/<branch>` with pagination support.
    fn get_branch_commits(
        &self,
        branch: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_ref(&format!("refs/heads/{}", branch))?;

        for (i, oid_result) in revwalk.enumerate() {
            if i < skip {
                continue;
            }
            if i >= skip + count {
                break;
            }

            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    /// 获取单个提交的详细信息 —— Get single commit details by hash
    fn get_commit(&self, hash: &str) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;
        Ok(git_commit_to_model(commit))
    }
}
