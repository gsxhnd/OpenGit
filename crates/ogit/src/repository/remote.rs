//! 远程仓库管理 —— Remote management
//!
//! 实现远程仓库的 CRUD 操作：列表、添加、删除。
//! 以及网络操作：fetch、pull（拉取并合并）、push。
//!
//! pull 操作包含三种情况的处理：
//! 1. 已是最新 —— 直接返回
//! 2. 快进合并 —— 直接移动分支指针
//! 3. 普通合并 —— 创建合并提交
//!
//! Implements remote CRUD (list, add, delete) and network ops (fetch, pull, push).

use crate::model::Remote;
use crate::operations::GitError;
use crate::repository::Repository;
use git2::ObjectType;

impl Repository {
    /// 获取所有远程仓库 —— Get all remotes
    pub(crate) fn __get_remotes(&self) -> Result<Vec<Remote>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

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
        Ok(remotes)
    }

    /// 添加远程仓库 —— Add a remote
    pub(crate) fn __add_remote(&self, name: &str, url: &str) -> Result<Remote, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.remote(name, url)?;
        Ok(Remote {
            name: name.to_string(),
            fetch_url: url.to_string(),
            push_url: None,
        })
    }

    /// 删除远程仓库 —— Remove a remote
    pub(crate) fn __remove_remote(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.remote_delete(name)?;
        Ok(())
    }

    /// 从远程仓库获取更新 —— Fetch from remote
    ///
    /// 仅执行 fetch 操作，不合并。相当于 `git fetch <remote>`。
    /// 获取的数据存储在远程跟踪分支中（如 `origin/main`）。
    ///
    /// Performs `git fetch <remote>` — fetches without merging. Data is stored in remote-tracking branches.
    pub(crate) fn __fetch(&self, remote: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let mut remote = repo.find_remote(remote)?;
        // 获取所有远程跟踪分支 —— Fetch all remote-tracking branches
        remote.fetch(&[] as &[&str], None, None)?;
        Ok(())
    }

    /// 从远程仓库拉取并合并 —— Pull from remote (fetch + merge)
    ///
    /// 完整流程：
    /// 1. 从远程仓库 fetch 指定分支到 FETCH_HEAD
    /// 2. 分析合并策略（快进 vs 普通合并）
    /// 3. 执行相应的合并操作
    ///
    /// Full flow: fetch → analyze merge strategy → apply fast-forward or normal merge.
    pub(crate) fn __pull(&self, remote_name: &str, branch_name: &str) -> Result<(), GitError> {
        // ==========================
        // 第一阶段：Fetch —— Phase 1: Fetch
        // ==========================
        {
            let repo = self
                .repo
                .lock()
                .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;
            let mut remote = repo.find_remote(remote_name)?;
            let refspec = format!(
                "refs/heads/{0}:refs/remotes/{1}/{0}",
                branch_name, remote_name
            );
            remote.fetch(&[refspec.as_str()], None, None)?;
        }

        // ==========================
        // 第二阶段：分析并合并 —— Phase 2: Analyze and merge
        // ==========================
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let fetch_head = repo.find_reference("FETCH_HEAD")?;
        let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;
        let (analysis, _) = repo.merge_analysis(&[&fetch_commit])?;

        // 已是最新 —— Already up-to-date
        if analysis.is_up_to_date() {
            return Ok(());
        }

        // 快进合并：直接移动分支指针 —— Fast-forward: just move the branch pointer
        if analysis.is_fast_forward() {
            let refname = format!("refs/heads/{}", branch_name);
            if let Ok(mut local_ref) = repo.find_reference(&refname) {
                local_ref.set_target(
                    fetch_commit.id(),
                    &format!("pull: fast-forward {}", branch_name),
                )?;
            } else {
                repo.reference(
                    &refname,
                    fetch_commit.id(),
                    true,
                    &format!("pull: create {}", branch_name),
                )?;
            }
            repo.set_head(&refname)?;
            let mut co = git2::build::CheckoutBuilder::new();
            co.force();
            repo.checkout_head(Some(&mut co))?;
            return Ok(());
        }

        // 普通合并：需要创建合并提交 —— Normal merge: need to create a merge commit
        if analysis.is_normal() {
            let head_commit = repo.reference_to_annotated_commit(&repo.head()?)?;
            return pull_merge_normal(&repo, &head_commit, &fetch_commit);
        }

        Ok(())
    }

    /// 推送到远程仓库 —— Push to remote
    pub(crate) fn __push(&self, remote: &str, branch: &str, _force: bool) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let mut remote = repo.find_remote(remote)?;
        let refspec = format!("refs/heads/{0}:refs/heads/{0}", branch);
        remote.push(&[refspec.as_str()], None)?;
        Ok(())
    }
}

/// 执行普通合并（非快进） —— Perform a normal (non-fast-forward) merge
///
/// 1. 使用三路合并算法（`merge_trees`）合并本地、远程和共同祖先的树
/// 2. 如果有冲突，检出冲突文件并返回 `MergeConflict` 错误
/// 3. 如果没有冲突，创建合并提交
///
/// Uses three-way merge (merge_trees) to create a merge commit. Returns error if conflicts exist.
pub(crate) fn pull_merge_normal(
    repo: &git2::Repository,
    local: &git2::AnnotatedCommit<'_>,
    remote: &git2::AnnotatedCommit<'_>,
) -> Result<(), GitError> {
    let local_tree = repo.find_commit(local.id())?.tree()?;
    let remote_tree = repo.find_commit(remote.id())?.tree()?;
    // 找到最近的共同祖先 —— Find the merge base (common ancestor)
    let ancestor = repo
        .find_commit(repo.merge_base(local.id(), remote.id())?)?
        .tree()?;
    let mut idx = repo.merge_trees(&ancestor, &local_tree, &remote_tree, None)?;

    // 检查是否有冲突 —— Check for conflicts
    if idx.has_conflicts() {
        repo.checkout_index(Some(&mut idx), None)?;
        let count = idx.conflicts()?.count();
        return Err(GitError::MergeConflict { count });
    }

    // 无冲突：创建合并提交 —— No conflicts: create merge commit
    let result_tree = repo.find_tree(idx.write_tree_to(repo)?)?;
    let sig = repo.signature()?;
    let local_commit = repo.find_commit(local.id())?;
    let remote_commit = repo.find_commit(remote.id())?;
    let msg = format!("Merge commit {}", remote.id());
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &msg,
        &result_tree,
        &[&local_commit, &remote_commit],
    )?;
    repo.checkout_head(None)?;
    Ok(())
}
