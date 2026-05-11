//! 仓库生命周期管理 —— Repository lifecycle management
//!
//! 包含 `AppState` 中与仓库打开、关闭、刷新、克隆、切换相关的方法。
//!
//! Contains AppState methods for opening, closing, refreshing, cloning,
//! and switching repositories.

use ogit::GitOps;
use std::path::PathBuf;
use std::sync::Arc;

use ogit::Repository;

use crate::workspace::CachedStatus;

use super::{AppState, ProjectViewState, ViewType};

impl AppState {
    // ========================================================================
    // 仓库生命周期 —— Repository lifecycle
    // ========================================================================

    /// 打开本地仓库 —— Open a local repository
    ///
    /// 初始化仓库、获取状态并加载第一页提交历史。
    /// 同时将仓库加入工作空间。
    ///
    /// Initializes repo, fetches status, and loads first page of history.
    /// Also adds the repo to the workspace.
    pub fn open_repository(&mut self, path: PathBuf) -> anyhow::Result<()> {
        tracing::info!("Opening repository: {}", path.display());
        let repo = Arc::new(Repository::open(&path).map_err(|e| anyhow::anyhow!("{}", e))?);
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project")
            .to_string();
        self.workspace.add_entry(path.clone(), name);
        self.init_with_repo(repo, path)
    }

    /// 切换到工作空间中的指定项目 —— Switch to a workspace project by index
    ///
    /// 关闭当前仓库并打开目标项目。
    ///
    /// Closes the current repo and opens the target project.
    pub fn switch_to_entry(&mut self, index: usize) -> anyhow::Result<()> {
        if !self.workspace.switch_to(index) {
            return Err(anyhow::anyhow!("Invalid project index"));
        }
        let path = self
            .workspace
            .active_path()
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("No active project"))?;
        self.set_error("".into());
        self.error = None;
        self.close_repository();
        self.open_repository(path)
    }

    /// 刷新工作空间缓存状态 —— Refresh workspace cached status
    pub fn refresh_workspace_status(&mut self) {
        let repo_path = self.repo_path.clone();
        self.workspace.refresh_all();
        if let Some(ref path) = repo_path {
            let changed = self.repo_status.status.unstaged_files.len()
                + self.repo_status.status.untracked_files.len();
            let staged = self.repo_status.status.staged_files.len();
            let has_conflict = self
                .repo_status
                .status
                .unstaged_files
                .iter()
                .chain(self.repo_status.status.staged_files.iter())
                .any(|f| f.status == ogit::FileStatus::Conflicted);
            self.workspace.update_status(
                path,
                CachedStatus {
                    branch: self.repo_status.status.current_branch.clone(),
                    changed,
                    staged,
                    ahead: self.repo_status.ahead,
                    behind: self.repo_status.behind,
                    has_conflict,
                    ok: true,
                },
            );
        }
    }

    /// 克隆远程仓库 —— Clone a remote repository
    pub fn clone_repository(&mut self, url: &str, into: PathBuf) -> anyhow::Result<()> {
        tracing::info!("Cloning repository: {} -> {}", url, into.display());
        let repo = Arc::new(Repository::clone(url, &into).map_err(|e| anyhow::anyhow!("{}", e))?);
        let name = into
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Project")
            .to_string();
        self.workspace.add_entry(into.clone(), name);
        self.init_with_repo(repo, into)
    }

    /// 从工作空间移除项目 —— Remove a project from workspace
    pub fn remove_from_workspace(&mut self, path: &PathBuf) {
        self.workspace.remove_entry(path);
        if self.repo_path.as_ref() == Some(path) {
            self.close_repository();
            if !self.workspace.is_empty()
                && let Some(p) = self.workspace.active_path().cloned()
                && let Err(e) = self.open_repository(p)
            {
                self.set_error(e.to_string());
            }
        }
    }

    /// 使用给定的仓库初始化状态 —— Initialize state with a given repository
    ///
    /// 加载仓库状态和提交历史，清除之前的状态。
    ///
    /// Loads repo status and commit history, clearing previous state.
    fn init_with_repo(&mut self, repo: Arc<Repository>, path: PathBuf) -> anyhow::Result<()> {
        let status = repo.get_status().map_err(|e| anyhow::anyhow!("{}", e))?;

        self.repository = Some(repo.clone());
        self.repo_path = Some(path.clone());
        self.repo_status = status;
        self.error = None;
        self.toasts.clear();
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.selected_staged_diff_path = None;
        self.diff_preview = None;
        self.current_operation = None;
        self.commit_amend = false;
        self.stash_list = repo.get_stashes().unwrap_or_default();
        self.tag_list = repo.get_tags().unwrap_or_default();
        self.remote_list = repo.get_remotes().unwrap_or_default();

        if let Some(vs) = self.project_view_states.get(&path).cloned() {
            self.selected_diff_path = vs.selected_diff_path;
            self.selected_staged_diff_path = vs.selected_staged_diff_path;
            self.selected_history = vs.selected_history;
        }

        let _ = self.load_history_reset();

        Ok(())
    }

    /// 关闭当前仓库 —— Close current repository
    #[allow(dead_code)]
    pub fn close_repository(&mut self) {
        if let Some(ref repo_path) = self.repo_path {
            tracing::info!("Closing repository: {}", repo_path.display());
            self.project_view_states.insert(
                repo_path.clone(),
                ProjectViewState {
                    active_view: ViewType::Commit,
                    selected_diff_path: self.selected_diff_path.clone(),
                    selected_staged_diff_path: self.selected_staged_diff_path.clone(),
                    selected_history: self.selected_history,
                },
            );
        }
        self.repository = None;
        self.repo_path = None;
        self.repo_status = ogit::RepositoryStatus::default();
        self.error = None;
        self.toasts.clear();
        self.history_commits.clear();
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.selected_staged_diff_path = None;
        self.diff_preview = None;
        self.current_operation = None;
    }

    /// 刷新仓库状态 —— Refresh repository status
    ///
    /// 重新获取完整仓库状态（文件、分支、远程等），并更新工作空间缓存。
    ///
    /// Re-fetches full repository status and updates workspace cache.
    pub fn refresh_status(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            tracing::debug!("Refreshing repository status");
            self.repo_status = repo.get_status().map_err(|e| anyhow::anyhow!("{}", e))?;
            self.stash_list = repo.get_stashes().unwrap_or_default();
            self.tag_list = repo.get_tags().unwrap_or_default();
            self.remote_list = repo.get_remotes().unwrap_or_default();
            self.error = None;
            self.refresh_workspace_status();
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository opened"))
        }
    }
}
