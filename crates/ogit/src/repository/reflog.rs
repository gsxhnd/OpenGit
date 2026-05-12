//! 引用日志查询 —— Reflog queries
//!
//! 使用 git2 的 reflog API 获取 HEAD 引用的变动历史。
//! 用于查看操作记录和恢复误操作。
//!
//! Uses git2's reflog API to get HEAD reference change history.
//! Used for viewing operation history and recovering from mistakes.

use crate::model::ReflogEntry;
use crate::operations::GitError;
use crate::repository::Repository;
use chrono::{TimeZone, Utc};

impl Repository {
    /// 获取引用日志 —— Get reflog entries for HEAD
    ///
    /// 从 HEAD 引用的 reflog 中读取最近的变动记录。
    /// Reads recent reference change history from HEAD's reflog.
    pub(crate) fn __get_reflog(&self, count: usize) -> Result<Vec<ReflogEntry>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let reflog = repo.reflog("HEAD")?;
        let total = reflog.len();
        let start = total.saturating_sub(count);

        let mut entries = Vec::new();

        for i in (start..total).rev() {
            if let Some(entry) = reflog.get(i) {
                let old_oid = entry.id_old();
                let new_oid = entry.id_new();
                let committer = entry.committer();

                let time = Utc
                    .timestamp_opt(committer.when().seconds(), 0)
                    .single()
                    .unwrap_or_default();

                entries.push(ReflogEntry {
                    old_hash: old_oid.to_string(),
                    new_hash: new_oid.to_string(),
                    committer: committer.name().unwrap_or("Unknown").to_string(),
                    time,
                    message: entry.message().unwrap_or("").to_string(),
                });
            }
        }

        Ok(entries)
    }
}
