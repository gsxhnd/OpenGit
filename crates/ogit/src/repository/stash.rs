//! 储藏管理 —— Stash management
//!
//! 实现 Git stash 的完整操作：
//! - `get_stashes` — 列出所有储藏
//! - `create_stash` — 创建新储藏（保存当前工作区变更）
//! - `apply_stash` — 应用储藏（不删除）
//! - `pop_stash` — 弹出储藏（应用并删除）
//! - `delete_stash` — 删除指定储藏
//!
//! 注意：当前 `apply_stash`、`pop_stash`、`delete_stash` 尚未实现，
//! 调用会返回 `GitError::UnsupportedOperation` 而非静默成功。
//!
//! Implements stash operations. apply/pop/delete return `UnsupportedOperation` until implemented.

use crate::model::Stash;
use crate::operations::GitError;
use crate::repository::Repository;

impl Repository {
    /// 获取所有储藏列表 —— Get all stashes
    pub(crate) fn __get_stashes(&self) -> Result<Vec<Stash>, GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut stashes = Vec::new();
        // git2 的 stash_foreach 以回调方式遍历所有储藏 —— git2's stash_foreach iterates through all stashes
        repo.stash_foreach(|idx, name, _oid| {
            stashes.push(Stash {
                id: format!("stash@{{{}}}", idx),
                description: name.to_string(),
                commit: String::new(),
            });
            true // 继续遍历 —— Continue iteration
        })?;
        Ok(stashes)
    }

    /// 创建新储藏 —— Create a new stash
    ///
    /// 保存当前工作区中所有已跟踪文件的修改。
    /// 相当于 `git stash push -m "<message>"`。
    ///
    /// Saves all tracked file modifications in the working tree.
    pub(crate) fn __create_stash(&self, message: Option<&str>) -> Result<Stash, GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let sig = repo.signature()?;
        let stash_id = repo.stash_save(&sig, message.unwrap_or("stash"), None)?;

        Ok(Stash {
            id: format!("stash@{{{}}}", 0),
            description: message.map(|s| s.to_string()).unwrap_or_default(),
            commit: stash_id.to_string(),
        })
    }

    /// 应用储藏（不删除） —— Apply a stash (keep it in the stash list)
    pub(crate) fn __apply_stash(&self, stash_id: &str) -> Result<(), GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let idx = parse_stash_index(stash_id)?;
        let mut opts = git2::StashApplyOptions::new();
        repo.stash_apply(idx, Some(&mut opts))?;
        Ok(())
    }

    /// 弹出储藏（应用并删除） —— Pop a stash (apply and drop)
    pub(crate) fn __pop_stash(&self, stash_id: &str) -> Result<(), GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let idx = parse_stash_index(stash_id)?;
        repo.stash_pop(idx, None)?;
        Ok(())
    }

    /// 删除储藏 —— Delete a stash
    pub(crate) fn __delete_stash(&self, stash_id: &str) -> Result<(), GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let idx = parse_stash_index(stash_id)?;
        repo.stash_drop(idx)?;
        Ok(())
    }
}

/// 解析 stash id（如 "stash@{0}"）为索引数字 —— Parse stash id (e.g. "stash@{0}") to index
fn parse_stash_index(stash_id: &str) -> Result<usize, GitError> {
    let start = stash_id
        .find('{')
        .ok_or_else(|| GitError::InvalidRef(format!("Invalid stash id format: {}", stash_id)))?;
    let end = stash_id
        .find('}')
        .ok_or_else(|| GitError::InvalidRef(format!("Invalid stash id format: {}", stash_id)))?;
    stash_id[start + 1..end]
        .parse::<usize>()
        .map_err(|e| GitError::InvalidRef(format!("Invalid stash index: {}", e)))
}
