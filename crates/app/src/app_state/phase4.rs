//! 搜索与筛选 —— Search and filter state methods
//!
//! Phase 4: 提交搜索、文件搜索、历史筛选方法。
//! Phase 4: commit search, file search, history filter methods.

use crate::app_state::{AppState, HISTORY_PAGE_SIZE};
use ogit::GitOps;

impl AppState {
    /// 按条件筛选历史 —— Filter history by criteria
    ///
    /// 支持按作者、文件路径、分支筛选。
    /// 优先级：分支 > 文件 > 作者。
    ///
    /// Supports filtering by author, file path, or branch.
    /// Priority: branch > file > author.
    pub fn load_filtered_history(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        let commits = if let Some(ref branch) = self.history_filter_branch {
            // 按分支筛选 —— Filter by branch
            repo.get_branch_commits(branch, HISTORY_PAGE_SIZE, 0)
                .map_err(|e| anyhow::anyhow!("{}", e))?
        } else if let Some(ref file) = self.history_filter_file {
            // 按文件筛选 —— Filter by file
            repo.filter_history_by_file(file, HISTORY_PAGE_SIZE, 0)
                .map_err(|e| anyhow::anyhow!("{}", e))?
        } else if let Some(ref author) = self.history_filter_author {
            // 按作者筛选 —— Filter by author
            repo.filter_history_by_author(author, HISTORY_PAGE_SIZE, 0)
                .map_err(|e| anyhow::anyhow!("{}", e))?
        } else {
            // 无筛选条件则加载默认历史 —— No filter, load default history
            repo.get_history(HISTORY_PAGE_SIZE, 0)
                .map_err(|e| anyhow::anyhow!("{}", e))?
        };

        self.history_commits = commits;
        self.history_skip = self.history_commits.len();
        self.selected_history = None;
        Ok(())
    }

    /// 清除历史筛选条件 —— Clear history filter criteria
    pub fn clear_history_filter(&mut self) -> anyhow::Result<()> {
        self.history_filter_branch = None;
        self.history_filter_author = None;
        self.history_filter_file = None;
        self.search_query.clear();
        self.search_results.clear();
        self.load_history_reset()
    }

    /// 搜索提交 —— Search commits by query
    ///
    /// 按 message、hash、作者搜索最近的提交。
    /// Searches recent commits by message, hash, or author.
    pub fn search_commits(&mut self, query: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        self.search_query = query.to_string();
        if query.is_empty() {
            self.search_results.clear();
            self.is_searching = false;
            return Ok(());
        }

        self.is_searching = true;
        self.search_results = repo
            .search_commits(query, 50)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.is_searching = false;
        Ok(())
    }

    /// 按文件名搜索工作区文件 —— Search files by name in working tree
    pub fn search_files(&mut self, pattern: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        if pattern.is_empty() {
            self.file_search_results.clear();
            return Ok(());
        }

        self.file_search_results = repo
            .search_files(pattern)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }

    /// 加载文件历史 —— Load file history
    pub fn load_file_history(
        &mut self,
        path: &std::path::Path,
        count: usize,
    ) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        self.file_history_path = Some(path.to_path_buf());
        self.file_history_commits = repo
            .get_file_history(&path.to_string_lossy(), count, 0)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }

    /// 加载提交详情 —— Load commit detail
    ///
    /// 加载指定提交的完整信息和文件差异。
    /// Loads full commit info and file diffs for detail view.
    pub fn load_commit_detail(&mut self, hash: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        self.selected_commit_detail = Some(
            repo.get_commit(hash)
                .map_err(|e| anyhow::anyhow!("{}", e))?,
        );

        self.selected_commit_diff = repo
            .get_commit_diff(hash)
            .map_err(|e| anyhow::anyhow!("{}", e))?;

        Ok(())
    }
}
