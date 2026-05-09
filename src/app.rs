/// Application state and entities

use crate::git::operations::GitOps;
use crate::git::{Commit, FileDiff, Repository, RepositoryStatus};
use gpui::Task;
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Main application state entity
pub struct AppState {
    /// Current repository
    pub repository: Option<Arc<Repository>>,
    /// Repository path
    pub repo_path: Option<PathBuf>,
    /// Repository status
    pub repo_status: RepositoryStatus,
    /// Loading state
    pub is_loading: bool,
    /// Error message (if any)
    pub error: Option<String>,
    /// Loaded commit history (most recent first)
    pub history_commits: Vec<Commit>,
    /// Next offset for "load more" history
    pub history_skip: usize,
    /// Selected row index in history list
    pub selected_history: Option<usize>,
    /// Path for inline diff (working tree vs index)
    pub selected_diff_path: Option<PathBuf>,
    /// Cached working-tree diff for `selected_diff_path`
    pub diff_preview: Option<FileDiff>,
    /// Amend toggle for next commit
    pub commit_amend: bool,
    /// Pending tasks
    pub _pending_tasks: Vec<Task<()>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            repository: None,
            repo_path: None,
            repo_status: RepositoryStatus::default(),
            is_loading: false,
            error: None,
            history_commits: Vec::new(),
            history_skip: 0,
            selected_history: None,
            selected_diff_path: None,
            diff_preview: None,
            commit_amend: false,
            _pending_tasks: Vec::new(),
        }
    }
}

/// History page size for pagination
pub const HISTORY_PAGE_SIZE: usize = 50;

impl AppState {
    /// Create new app state
    pub fn new() -> Self {
        Self::default()
    }

    /// Open a repository
    pub fn open_repository(&mut self, path: PathBuf) -> anyhow::Result<()> {
        let repo = Arc::new(
            Repository::open(&path).map_err(|e| anyhow::anyhow!("{}", e))?,
        );
        let status = repo
            .get_status()
            .map_err(|e| anyhow::anyhow!("{}", e))?;

        self.repository = Some(repo);
        self.repo_path = Some(path);
        self.repo_status = status;
        self.error = None;
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.diff_preview = None;
        self.commit_amend = false;
        let _ = self.load_history_reset();

        Ok(())
    }

    /// Close current repository
    pub fn close_repository(&mut self) {
        self.repository = None;
        self.repo_path = None;
        self.repo_status = RepositoryStatus::default();
        self.error = None;
        self.history_commits.clear();
        self.history_skip = 0;
        self.selected_history = None;
        self.selected_diff_path = None;
        self.diff_preview = None;
    }

    /// Refresh repository status
    pub fn refresh_status(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            self.repo_status = repo
                .get_status()
                .map_err(|e| anyhow::anyhow!("{}", e))?;
            self.error = None;
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository opened"))
        }
    }

    /// Set error message
    pub fn set_error(&mut self, error: String) {
        self.error = Some(error);
    }

    /// Clear error message
    pub fn clear_error(&mut self) {
        self.error = None;
    }

    /// Reload first page of history
    pub fn load_history_reset(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.history_commits = repo
            .get_history(HISTORY_PAGE_SIZE, 0)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.history_skip = self.history_commits.len();
        Ok(())
    }

    /// Append next page of history
    pub fn load_more_history(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let more = repo
            .get_history(HISTORY_PAGE_SIZE, self.history_skip)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        if more.is_empty() {
            return Ok(());
        }
        self.history_skip += more.len();
        self.history_commits.extend(more);
        Ok(())
    }

    pub fn stage_path(&mut self, rel: &Path) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let s = rel.to_string_lossy();
        repo.stage_files(&[s.as_ref()])
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    pub fn unstage_path(&mut self, rel: &Path) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let s = rel.to_string_lossy();
        repo.unstage_files(&[s.as_ref()])
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    pub fn commit_staged(&mut self, message: &str, amend: bool) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        if amend {
            repo.amend_commit(Some(message), None)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        } else {
            repo.commit(message, None)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    pub fn checkout_branch(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.switch_branch(name)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    pub fn create_branch(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.create_branch(name, None)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    pub fn fetch_origin(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.fetch("origin")
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    pub fn pull_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.pull("origin", branch)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        let _ = self.load_history_reset();
        Ok(())
    }

    pub fn push_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.push("origin", branch, false)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    pub fn set_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_diff_path = path.clone();
        self.diff_preview = match (&self.repository, path.as_ref()) {
            (Some(repo), Some(p)) => {
                let s = p.to_string_lossy();
                Some(
                    repo.get_file_diff(s.as_ref())
                        .map_err(|e| anyhow::anyhow!("{}", e))?,
                )
            }
            _ => None,
        };
        Ok(())
    }
}

/// View types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ViewType {
    /// Commit/staging view
    Commit,
    /// Commit history view
    History,
    /// Branch management view
    Branches,
    /// Diff view
    Diff,
    /// Stash management view
    Stash,
    /// Tag management view
    Tags,
    /// Welcome/empty state
    Welcome,
}

/// Project entity (single repository project)
pub struct Project {
    /// Project path
    pub path: PathBuf,
    /// Project name
    pub name: String,
    /// Associated repository
    pub repository: Option<Arc<Repository>>,
    /// Project status
    pub status: RepositoryStatus,
}

impl Project {
    /// Create new project
    pub fn new(path: PathBuf) -> anyhow::Result<Self> {
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Project".to_string());

        let repo = Arc::new(Repository::open(&path)?);
        let status = repo.get_status()?;

        Ok(Self {
            path,
            name,
            repository: Some(repo),
            status,
        })
    }

    /// Refresh project status
    pub fn refresh(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            self.status = repo.get_status()?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository"))
        }
    }
}

/// Workspace manages multiple projects
pub struct Workspace {
    /// Active project
    pub active_project: Option<usize>,
    /// List of projects
    pub projects: Vec<Project>,
}

impl Default for Workspace {
    fn default() -> Self {
        Self {
            active_project: None,
            projects: Vec::new(),
        }
    }
}

impl Workspace {
    /// Add project to workspace
    pub fn add_project(&mut self, project: Project) {
        if self.active_project.is_none() {
            self.active_project = Some(0);
        }
        self.projects.push(project);
    }

    /// Remove project from workspace
    pub fn remove_project(&mut self, index: usize) {
        if index < self.projects.len() {
            self.projects.remove(index);
            if let Some(active) = self.active_project {
                if active >= self.projects.len() {
                    self.active_project = if self.projects.is_empty() {
                        None
                    } else {
                        Some(self.projects.len() - 1)
                    };
                }
            }
        }
    }

    /// Get active project
    pub fn active(&self) -> Option<&Project> {
        self.active_project.and_then(|idx| self.projects.get(idx))
    }

    /// Get mutable active project
    pub fn active_mut(&mut self) -> Option<&mut Project> {
        let idx = self.active_project?;
        self.projects.get_mut(idx)
    }

    /// Switch to project
    pub fn switch_to(&mut self, index: usize) {
        if index < self.projects.len() {
            self.active_project = Some(index);
        }
    }
}

/// Commit message editor state
pub struct CommitEditor {
    /// Message text
    pub message: String,
    /// Commit author
    pub author: Option<String>,
    /// Whether all staged files
    pub is_amend: bool,
}

impl Default for CommitEditor {
    fn default() -> Self {
        Self {
            message: String::new(),
            author: None,
            is_amend: false,
        }
    }
}

impl CommitEditor {
    /// Create new editor
    pub fn new() -> Self {
        Self::default()
    }

    /// Reset editor
    pub fn reset(&mut self) {
        self.message.clear();
        self.author = None;
        self.is_amend = false;
    }

    /// Update message
    pub fn set_message(&mut self, msg: String) {
        self.message = msg;
    }

    /// Update author
    pub fn set_author(&mut self, author: String) {
        self.author = Some(author);
    }

    /// Toggle amend mode
    pub fn toggle_amend(&mut self) {
        self.is_amend = !self.is_amend;
    }

    /// Check if message is valid for commit
    pub fn is_valid(&self) -> bool {
        !self.message.trim().is_empty()
    }
}
