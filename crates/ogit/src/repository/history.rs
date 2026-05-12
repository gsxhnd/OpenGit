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
use crate::operations::GitError;
use crate::repository::{Repository, git_commit_to_model};

impl Repository {
    /// 分页获取提交历史 —— Get commit history with pagination
    ///
    /// 从 HEAD 开始反向遍历提交图（按时间倒序）。
    /// `count` 为本次要获取的数量，`skip` 为跳过的提交数。
    ///
    /// Walks the commit graph from HEAD in reverse chronological order.
    /// `count` = number of commits to fetch, `skip` = number of commits to skip.
    pub(crate) fn __get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError> {
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
    pub(crate) fn __get_branch_commits(
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
    pub(crate) fn __get_commit(&self, hash: &str) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;
        Ok(git_commit_to_model(commit))
    }

    /// 按作者筛选提交历史 —— Filter commit history by author
    ///
    /// 遍历提交图，只返回作者名匹配的提交。
    /// 使用大小写不敏感的子串匹配。
    ///
    /// Walks the commit graph, filtering by author name (case-insensitive substring match).
    pub(crate) fn __filter_history_by_author(
        &self,
        author: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;

        let author_lower = author.to_lowercase();
        let mut skipped = 0;

        for oid_result in revwalk {
            if commits.len() >= count {
                break;
            }
            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;
            let commit_author = commit.author().name().unwrap_or("").to_lowercase();

            if !commit_author.contains(&author_lower) {
                continue;
            }
            if skipped < skip {
                skipped += 1;
                continue;
            }
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    /// 按文件路径筛选提交历史 —— Filter commit history by file path
    ///
    /// 遍历提交图，只返回触及指定文件的提交。
    ///
    /// Walks the commit graph, returning only commits that touched the given file.
    pub(crate) fn __filter_history_by_file(
        &self,
        path: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;
        revwalk.set_sorting(git2::Sort::TIME)?;

        let mut skipped = 0;

        for oid_result in revwalk {
            if commits.len() >= count {
                break;
            }
            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;

            // 检查此提交是否触及了指定文件 —— Check if this commit touched the file
            let tree = commit.tree()?;
            let has_file = if commit.parent_count() == 0 {
                // 初始提交 —— Initial commit: check if file exists in tree
                tree.get_path(std::path::Path::new(path)).is_ok()
            } else {
                // 有父提交则比较差异 —— Compare diff with parent
                let parent = commit.parent(0)?;
                let parent_tree = parent.tree()?;
                let diff = repo.diff_tree_to_tree(
                    Some(&parent_tree),
                    Some(&tree),
                    Some(git2::DiffOptions::new().pathspec(path)),
                )?;
                diff.deltas().len() > 0
            };

            if !has_file {
                continue;
            }
            if skipped < skip {
                skipped += 1;
                continue;
            }
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    /// 搜索提交 —— Search commits by message, hash, or author
    ///
    /// 对最近的提交进行模糊搜索，匹配 message、hash 前缀或作者名。
    /// 最多扫描 500 条提交以保证性能。
    ///
    /// Scans recent commits for matches in message, hash prefix, or author name.
    /// Limited to scanning 500 commits for performance.
    pub(crate) fn __search_commits(
        &self,
        query: &str,
        count: usize,
    ) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut results = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;

        let query_lower = query.to_lowercase();

        for (scanned, oid_result) in revwalk.enumerate() {
            if results.len() >= count {
                break;
            }
            if scanned >= 500 {
                break;
            }

            let oid = oid_result?;
            let commit = match repo.find_commit(oid) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let hash_str = oid.to_string();
            let author = commit.author().name().unwrap_or("").to_lowercase();
            let message = commit.message().unwrap_or("").to_lowercase();
            let summary = commit.summary().unwrap_or("").to_lowercase();

            // 匹配 hash 前缀、message、summary 或作者 —— Match hash prefix, message, summary, or author
            if hash_str.starts_with(&query_lower)
                || message.contains(&query_lower)
                || summary.contains(&query_lower)
                || author.contains(&query_lower)
            {
                results.push(git_commit_to_model(commit));
            }
        }

        Ok(results)
    }

    /// 获取单文件提交历史 —— Get commit history for a single file
    ///
    /// 等价于 `filter_history_by_file`，但方法名更明确。
    /// 遍历提交图，返回触及指定文件的提交。
    ///
    /// Equivalent to filter_history_by_file with a clearer method name.
    pub(crate) fn __get_file_history(
        &self,
        path: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        self.__filter_history_by_file(path, count, skip)
    }
}
