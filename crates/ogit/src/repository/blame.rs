//! Blame 信息查询 —— Blame information queries
//!
//! 使用 git2 的 blame API 获取文件的逐行提交信息。
//! 每行包含：提交哈希、作者、时间、行号和内容摘要。
//!
//! Uses git2's blame API to get per-line commit information.
//! Each line includes: commit hash, author, time, line number, and content summary.

use crate::model::BlameLine;
use crate::operations::GitError;
use crate::repository::Repository;
use chrono::{TimeZone, Utc};

impl Repository {
    /// 获取文件的 blame 信息 —— Get blame information for a file
    ///
    /// 调用 git2 的 `blame_file` 获取每行的最后修改提交信息。
    /// 返回按行号排序的 blame 行列表。
    ///
    /// Uses git2's blame_file to get the last commit that modified each line.
    /// Returns blame lines ordered by line number.
    pub(crate) fn __get_blame(&self, path: &str) -> Result<Vec<BlameLine>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let head = repo.head()?.peel_to_commit()?;
        let blame = repo.blame_file(
            std::path::Path::new(path),
            Some(git2::BlameOptions::new().newest_commit(head.id())),
        )?;

        let mut lines = Vec::new();
        let max_lines = blame.len().min(5000); // Limit to prevent memory issues with huge files

        for i in 0..max_lines {
            if let Some(hunk) = blame.get_line(i) {
                let sig = hunk.final_signature();
                let commit_id = hunk.final_commit_id();

                // Get commit summary for this hunk
                let summary = repo
                    .find_commit(commit_id)
                    .ok()
                    .and_then(|c| c.summary().map(|s| s.to_string()))
                    .unwrap_or_default();

                let time = Utc
                    .timestamp_opt(sig.when().seconds(), 0)
                    .single()
                    .unwrap_or_default();

                lines.push(BlameLine {
                    hash: commit_id.to_string(),
                    author: sig.name().unwrap_or("Unknown").to_string(),
                    time,
                    line: i + 1,            // 1-based line number
                    content: String::new(), // Content can be large; omit for performance
                    summary,
                });
            }
        }

        Ok(lines)
    }
}
