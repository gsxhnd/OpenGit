//! 提交操作 —— Commit operations
//!
//! 实现以下操作：
//! - `commit` — 创建新提交（`git commit`）
//! - `amend_commit` — 修补上一次提交（`git commit --amend`）
//!
//! 提交流程：
//! 1. 从索引创建树对象
//! 2. 获取父提交列表（HEAD 或空用于初始提交）
//! 3. 使用签名 + 树 + 父提交创建提交对象
//!
//! Implements commit and amend operations using git2's commit API.

use crate::model::Commit;
use crate::operations::GitError;
use crate::repository::{Repository, git_commit_to_model};
use git2::{ObjectType, Signature};

impl Repository {
    /// 创建新提交 —— Create a new commit
    ///
    /// 从当前索引创建一个新提交对象。
    /// 如果提供了 `author`，使用自定义作者信息，否则使用全局 git 配置。
    ///
    /// Creates a commit from the current index. Uses custom author if provided, else git config.
    pub(crate) fn __commit(&self, message: &str, author: Option<&str>) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        // 获取签名：优先使用提供的作者，否则使用全局配置 —— Get signature: provided author or global config
        let signature = if let Some(author_str) = author {
            Signature::now(author_str, "unknown@example.com")?
        } else {
            repo.signature()?
        };

        // 从当前索引创建树对象 —— Create tree from current index
        let tree_id = {
            let mut index = repo.index()?;
            index.write_tree()?
        };

        let tree = repo.find_tree(tree_id)?;

        // 获取父提交列表 —— Get parent commit list
        let parents: Vec<git2::Commit> = match repo.head() {
            Ok(head) => {
                let c = head
                    .peel(ObjectType::Commit)?
                    .into_commit()
                    .map_err(|_| GitError::InvalidRef("Cannot get parent commit".to_string()))?;
                vec![c]
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => Vec::new(), // 初始提交，无父提交
            Err(e) => return Err(GitError::from(e)),
        };

        let parent_refs: Vec<&git2::Commit> = parents.iter().collect();
        let commit_id = repo.commit(
            Some("HEAD"),
            &signature,
            &signature, // 作者和提交者相同 —— Author and committer are the same
            message,
            &tree,
            parent_refs.as_slice(),
        )?;

        let commit = repo.find_commit(commit_id)?;
        Ok(git_commit_to_model(commit))
    }

    /// 修补上一次提交 —— Amend the last commit
    ///
    /// 修改最近一次提交的消息和/或暂存区内容。
    /// 如果不提供新消息，保留原提交消息（但会更新暂存区内容到提交中）。
    ///
    /// Amends the most recent commit with updated message and/or index content.
    /// If no new message, keeps the original message (but updates index content in commit).
    pub(crate) fn __amend_commit(
        &self,
        message: Option<&str>,
        _author: Option<&str>,
    ) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let head = repo.head()?;
        let commit = head
            .peel(ObjectType::Commit)?
            .into_commit()
            .map_err(|_| GitError::InvalidRef("HEAD is not a commit".to_string()))?;

        // 使用新消息或保留原消息 —— Use new message or keep original
        let msg = message.unwrap_or_else(|| commit.message().unwrap_or(""));

        // 从当前索引重新创建树 —— Re-create tree from current index
        let tree_id = {
            let mut index = repo.index()?;
            index.write_tree()?
        };
        let tree = repo.find_tree(tree_id)?;

        let sig = repo.signature()?;
        // 保留原提交的父提交列表 —— Keep original commit's parents
        let parents: Vec<_> = commit.parents().collect();
        let parent_refs: Vec<_> = parents.iter().collect();

        let amended_id =
            repo.commit(Some("HEAD"), &sig, &sig, msg, &tree, parent_refs.as_slice())?;

        let amended = repo.find_commit(amended_id)?;
        Ok(git_commit_to_model(amended))
    }
}
