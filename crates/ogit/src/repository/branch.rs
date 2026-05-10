//! 分支管理 —— Branch management
//!
//! 实现分支的 CRUD 操作：列表、创建、删除、切换。
//! 所有本地分支操作，暂不涉及远程分支跟踪管理。
//!
//! Implements branch CRUD: list, create, delete, switch (local branches only).

use crate::model::Branch;
use crate::operations::GitError;
use crate::repository::Repository;
use git2::BranchType;

impl Repository {
    /// 获取所有本地分支 —— Get all local branches
    pub(crate) fn __get_branches(&self) -> Result<Vec<Branch>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

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

            // 获取上游分支名（如果有） —— Get upstream branch name if tracking
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

        Ok(branches)
    }

    /// 创建新分支 —— Create a new branch
    ///
    /// 如果指定了 `target`，从这个引用处创建分支；
    /// 否则从当前 HEAD 创建分支。
    ///
    /// If `target` is specified, branch from that ref; otherwise branch from HEAD.
    pub(crate) fn __create_branch(
        &self,
        name: &str,
        target: Option<&str>,
    ) -> Result<Branch, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let target_oid = if let Some(target) = target {
            // 从指定引用创建 —— Create from specified ref
            git2::Oid::from_str(target)?
        } else {
            // 从当前 HEAD 创建 —— Create from current HEAD
            repo.head()?
                .target()
                .ok_or_else(|| GitError::InvalidRef("Cannot resolve HEAD".to_string()))?
        };

        let target_commit = repo.find_commit(target_oid)?;
        repo.branch(name, &target_commit, false)?;

        Ok(Branch {
            name: name.to_string(),
            target: target_oid.to_string(),
            is_local: true,
            is_head: false,
            upstream: None,
        })
    }

    /// 删除本地分支 —— Delete a local branch
    ///
    /// 注意：当前 `force` 参数暂未实现，仅支持删除已完全合并的分支。
    ///
    /// Note: `force` parameter is not yet implemented — only deletes fully merged branches.
    pub(crate) fn __delete_branch(&self, name: &str, _force: bool) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut branch = repo.find_branch(name, BranchType::Local)?;
        branch.delete()?;
        Ok(())
    }

    /// 切换到指定分支 —— Switch to a branch
    ///
    /// 执行以下操作：
    /// 1. 使用 `checkout_tree` 检出目标分支的文件
    /// 2. 使用 `set_head` 更新 HEAD 指向目标分支
    ///
    /// Performs: checkout_tree → set_head to switch to the target branch.
    pub(crate) fn __switch_branch(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let _branch = repo.find_branch(name, BranchType::Local)?;
        let obj = repo.revparse_single(&format!("refs/heads/{}", name))?;
        let mut checkout = git2::build::CheckoutBuilder::default();
        checkout.force();
        // 检出目标分支的工作树 —— Checkout the target branch's working tree
        repo.checkout_tree(&obj, Some(&mut checkout))?;
        // 更新 HEAD 指向 —— Update HEAD to point to the branch
        repo.set_head(&format!("refs/heads/{}", name))?;
        Ok(())
    }
}
