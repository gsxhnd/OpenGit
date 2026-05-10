//! 合并与重置操作 —— Merge, revert, and reset operations
//!
//! 实现以下操作：
//! - `merge` — 合并指定分支（尚未实现）
//! - `abort_merge` — 中止正在进行的合并（尚未实现）
//! - `resolve_conflict` — 解决指定文件的合并冲突（尚未实现）
//! - `revert_commit` — 还原指定提交，创建反向提交
//! - `reset` — 重置仓库到指定提交（soft/mixed/hard）
//!
//! 所有未实现的操作返回 `GitError::UnsupportedOperation`。
//!
//! Implements merge, revert, and reset. Unimplemented ops return `UnsupportedOperation`.

use crate::model::Commit;
use crate::operations::{GitError, ResetMode};
use crate::repository::{Repository, git_commit_to_model};

impl Repository {
    /// 合并指定分支 —— Merge a branch
    ///
    /// 待实现：需要调用 git2 的 merge API —— TODO: use git2 merge API
    pub(crate) fn __merge(&self, _branch: &str) -> Result<(), GitError> {
        Err(GitError::UnsupportedOperation {
            op: "merge".to_string(),
        })
    }

    /// 中止正在进行的合并 —— Abort ongoing merge
    ///
    /// 待实现：使用 `git merge --abort` 的逻辑 —— TODO: implement git merge --abort logic
    pub(crate) fn __abort_merge(&self) -> Result<(), GitError> {
        Err(GitError::UnsupportedOperation {
            op: "abort_merge".to_string(),
        })
    }

    /// 解决指定文件的合并冲突 —— Resolve merge conflict for a file
    ///
    /// 待实现：需要将冲突文件标记为已解决 —— TODO: mark conflicted file as resolved
    pub(crate) fn __resolve_conflict(
        &self,
        _path: &str,
        _resolution: &str,
    ) -> Result<(), GitError> {
        Err(GitError::UnsupportedOperation {
            op: "resolve_conflict".to_string(),
        })
    }

    /// 还原指定提交 —— Revert a commit
    ///
    /// 创建反向提交来撤销指定提交的变更。
    /// 这不会修改历史，而是在历史末尾添加新提交。
    ///
    /// Creates a new commit that reverses the specified commit's changes.
    /// This does NOT rewrite history — it appends a new commit.
    pub(crate) fn __revert_commit(&self, hash: &str) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;
        let tree = commit.tree()?;

        // 将指定提交的树状态写入当前索引 —— Write the target commit's tree to current index
        let mut index = repo.index()?;
        index.read_tree(&tree)?;
        index.write()?;

        // 创建反向提交 —— Create the revert commit
        let sig = repo.signature()?;
        let revert_commit = repo.commit(
            Some("HEAD"),
            &sig,
            &sig,
            &format!("Revert \"{}\"", commit.summary().unwrap_or("commit")),
            &tree,
            &[&commit],
        )?;

        let result = repo.find_commit(revert_commit)?;
        Ok(git_commit_to_model(result))
    }

    /// 重置仓库到指定提交 —— Reset to a target commit
    ///
    /// 根据 `mode` 参数执行不同级别的重置：
    /// - `Soft`：仅移动 HEAD（`--soft`），保留暂存区和工作区
    /// - `Mixed`：移动 HEAD 并重置暂存区（`--mixed`），保留工作区
    /// - `Hard`：完全丢弃所有更改（`--hard`），⚠️ 危险操作
    ///
    /// Resets to the target commit with the specified mode. `Hard` mode discards ALL changes.
    pub(crate) fn __reset(&self, target: &str, mode: ResetMode) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let obj = repo.revparse_single(target)?;
        let reset_type = match mode {
            ResetMode::Soft => git2::ResetType::Soft,
            ResetMode::Mixed => git2::ResetType::Mixed,
            ResetMode::Hard => git2::ResetType::Hard,
        };
        repo.reset(&obj, reset_type, None)?;
        Ok(())
    }
}
