//! 文件搜索 —— File search
//!
//! 搜索工作区中的文件，类似 `git ls-files` 或 `find` 操作。
//! 排除 `.git` 目录，支持文件名模式匹配。
//!
//! Searches files in the working tree, excluding `.git` directory.
//! Supports filename pattern matching.

use std::path::PathBuf;

use crate::operations::GitError;
use crate::repository::Repository;

impl Repository {
    /// 按文件名搜索工作区文件 —— Search files by name in working tree
    ///
    /// 使用 git2 的 `statuses` API 获取所有已知文件（tracked + untracked），
    /// 返回文件名包含查询字符串的文件列表。
    /// 搜索结果限制为 100 个文件。
    ///
    /// Uses git2's statuses to get known files and filters by name pattern.
    pub(crate) fn __search_files(&self, pattern: &str) -> Result<Vec<PathBuf>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let pattern_lower = pattern.to_lowercase();
        let mut results = Vec::new();

        // 使用 git status 扫描所有已知文件 —— Use git status to scan all tracked files
        let mut opts = git2::StatusOptions::new();
        opts.include_untracked(true);

        let statuses = repo.statuses(Some(&mut opts))?;
        let seen_paths: std::collections::HashSet<String> = statuses
            .iter()
            .filter_map(|entry| entry.path().map(|p| p.to_string()))
            .collect();

        for path_str in &seen_paths {
            if path_str.to_lowercase().contains(&pattern_lower) {
                results.push(PathBuf::from(path_str));
                if results.len() >= 100 {
                    break;
                }
            }
        }

        Ok(results)
    }
}
