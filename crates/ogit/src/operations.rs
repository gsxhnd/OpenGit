/// High-level Git operations
use crate::model::*;
use anyhow::Result;
use std::path::PathBuf;

/// Error types for Git operations
#[derive(Debug, thiserror::Error)]
pub enum GitError {
    #[error("Repository not found at {path}")]
    RepoNotFound { path: PathBuf },

    #[error("Failed to read repository: {0}")]
    ReadError(String),

    #[error("Failed to write to repository: {0}")]
    WriteError(String),

    #[error("Branch '{name}' already exists")]
    BranchExists { name: String },

    #[error("Branch '{name}' not found")]
    BranchNotFound { name: String },

    #[error("Merge conflict in {count} files")]
    MergeConflict { count: usize },

    #[error("Authentication failed for remote '{remote}'")]
    AuthFailed { remote: String },

    #[error("Remote '{remote}' not found")]
    RemoteNotFound { remote: String },

    #[error("Tag '{name}' already exists")]
    TagExists { name: String },

    #[error("Invalid reference: {0}")]
    InvalidRef(String),

    #[error("Git2 error: {0}")]
    Git2(#[from] git2::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Trait for Git operations
pub trait GitOps {
    /// Get repository status (working tree + branches + remotes)
    fn get_status(&self) -> Result<RepositoryStatus, GitError>;

    /// Get current HEAD commit
    fn get_head(&self) -> Result<Option<Commit>, GitError>;

    /// Get commits in history (with pagination)
    fn get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError>;

    /// Get commits on a specific branch
    fn get_branch_commits(
        &self,
        branch: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError>;

    /// Get commit details
    fn get_commit(&self, hash: &str) -> Result<Commit, GitError>;

    /// Get diff for a specific commit
    fn get_commit_diff(&self, hash: &str) -> Result<Vec<FileDiff>, GitError>;

    /// Get diff for a file in working tree
    fn get_file_diff(&self, path: &str) -> Result<FileDiff, GitError>;

    /// Get all branches
    fn get_branches(&self) -> Result<Vec<Branch>, GitError>;

    /// Create a new branch
    fn create_branch(&self, name: &str, target: Option<&str>) -> Result<Branch, GitError>;

    /// Delete a branch
    fn delete_branch(&self, name: &str, force: bool) -> Result<(), GitError>;

    /// Switch to a branch
    fn switch_branch(&self, name: &str) -> Result<(), GitError>;

    /// Get all remotes
    fn get_remotes(&self) -> Result<Vec<Remote>, GitError>;

    /// Add a remote
    fn add_remote(&self, name: &str, url: &str) -> Result<Remote, GitError>;

    /// Remove a remote
    fn remove_remote(&self, name: &str) -> Result<(), GitError>;

    /// Get all tags
    fn get_tags(&self) -> Result<Vec<Tag>, GitError>;

    /// Create a tag
    fn create_tag(
        &self,
        name: &str,
        target: Option<&str>,
        message: Option<&str>,
    ) -> Result<Tag, GitError>;

    /// Delete a tag
    fn delete_tag(&self, name: &str) -> Result<(), GitError>;

    /// Stage files (add to index)
    fn stage_files(&self, paths: &[&str]) -> Result<(), GitError>;

    /// Unstage files (remove from index)
    fn unstage_files(&self, paths: &[&str]) -> Result<(), GitError>;

    /// Discard changes to files in working tree
    fn discard_changes(&self, paths: &[&str]) -> Result<(), GitError>;

    /// Commit staged changes
    fn commit(&self, message: &str, author: Option<&str>) -> Result<Commit, GitError>;

    /// Amend the last commit
    fn amend_commit(&self, message: Option<&str>, author: Option<&str>)
    -> Result<Commit, GitError>;

    /// Fetch from remote
    fn fetch(&self, remote: &str) -> Result<(), GitError>;

    /// Pull from remote
    fn pull(&self, remote: &str, branch: &str) -> Result<(), GitError>;

    /// Push to remote
    fn push(&self, remote: &str, branch: &str, force: bool) -> Result<(), GitError>;

    /// Merge a branch
    fn merge(&self, branch: &str) -> Result<(), GitError>;

    /// Abort ongoing merge
    fn abort_merge(&self) -> Result<(), GitError>;

    /// Resolve merge conflicts for a file
    fn resolve_conflict(&self, path: &str, resolution: &str) -> Result<(), GitError>;

    /// Get stashes
    fn get_stashes(&self) -> Result<Vec<Stash>, GitError>;

    /// Create a stash
    fn create_stash(&self, message: Option<&str>) -> Result<Stash, GitError>;

    /// Apply a stash
    fn apply_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// Pop a stash (apply and remove)
    fn pop_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// Delete a stash
    fn delete_stash(&self, stash_id: &str) -> Result<(), GitError>;

    /// Revert a commit
    fn revert_commit(&self, hash: &str) -> Result<Commit, GitError>;

    /// Reset to a commit
    fn reset(&self, target: &str, mode: ResetMode) -> Result<(), GitError>;
}

/// Reset mode for git reset
#[derive(Debug, Clone, Copy)]
pub enum ResetMode {
    /// Keep working tree changes (--soft)
    Soft,
    /// Keep working tree, reset index (--mixed)
    Mixed,
    /// Discard everything (--hard)
    Hard,
}
