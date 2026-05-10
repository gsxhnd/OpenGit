//! 暂存区操作 —— Staging area operations
//!
//! 实现文件的暂存/取消暂存/放弃修改操作：
//! - `stage_files` — 将文件添加到索引（`git add`）
//! - `unstage_files` — 从索引中移除文件（`git reset HEAD -- <paths>`）
//! - `discard_changes` — 放弃工作区修改（`git checkout -- <paths>`）
//!
//! Implements stage, unstage, and discard operations on working tree files.

use crate::operations::GitError;
use crate::repository::Repository;
use std::path::Path;

impl Repository {
    /// 暂存文件 —— Stage files (git add)
    pub(crate) fn __stage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut index = repo.index()?;
        // 使用 IndexAddOption::DEFAULT 添加所有匹配的文件 —— Add all matching files with default options
        index.add_all(
            paths.iter().map(|p| Path::new(p)),
            git2::IndexAddOption::DEFAULT,
            None,
        )?;
        // 写入索引以持久化暂存状态 —— Write index to persist staging state
        index.write()?;
        Ok(())
    }

    /// 取消暂存文件 —— Unstage files (git reset HEAD -- <paths>)
    ///
    /// 如果 HEAD 有效，使用 `reset_default` 重置指定路径的暂存状态；
    /// 如果仓库还没有任何提交（未出生分支），直接从索引中移除文件。
    ///
    /// If HEAD exists, reset the index entries for the paths. For unborn branches, remove paths from index.
    pub(crate) fn __unstage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        match repo.revparse_single("HEAD") {
            Ok(head) => {
                // 正常情况：重置特定路径到 HEAD 的版本 —— Normal: reset paths to HEAD version
                repo.reset_default(Some(&head), paths.iter().map(Path::new))?;
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => {
                // 未出生分支：直接从索引移除 —— Unborn branch: remove from index directly
                let mut index = repo.index()?;
                for path in paths {
                    index.remove_path(Path::new(path))?;
                }
                index.write()?;
            }
            Err(e) => return Err(GitError::from(e)),
        }
        Ok(())
    }

    /// 放弃工作区修改 —— Discard working tree changes (git checkout -- <paths>)
    ///
    /// 使用 `checkout_head` 将指定文件恢复到 HEAD 版本。
    /// 此操作不可逆，会丢失工作区中未提交的更改。
    ///
    /// Uses `checkout_head` to restore files to HEAD version. This is irreversible.
    pub(crate) fn __discard_changes(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        for path in paths {
            let mut checkout_options = git2::build::CheckoutBuilder::new();
            checkout_options.force();
            checkout_options.path(Path::new(path));
            repo.checkout_head(Some(&mut checkout_options))?;
        }
        Ok(())
    }
}
