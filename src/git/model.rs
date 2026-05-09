/// Git data models - core types representing Git entities
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Represents a Git commit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commit {
    /// Commit hash (OID)
    pub hash: String,
    /// Commit message summary
    pub summary: String,
    /// Full commit message
    pub message: String,
    /// Author name
    pub author: String,
    /// Committer name
    pub committer: String,
    /// Commit timestamp
    pub time: DateTime<Utc>,
    /// Parent commit hashes
    pub parents: Vec<String>,
}

/// File status in working tree
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FileStatus {
    /// File is unchanged
    Unmodified,
    /// File has been modified
    Modified,
    /// File is staged for addition
    Added,
    /// File is staged for deletion
    Deleted,
    /// File is renamed
    Renamed,
    /// File is newly created (untracked)
    Untracked,
    /// File contains merge conflicts
    Conflicted,
}

/// Represents a file change in the working tree or staging area
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    /// File path relative to repository root
    pub path: PathBuf,
    /// Current status of the file
    pub status: FileStatus,
    /// File is staged
    pub staged: bool,
    /// File is unstaged
    pub unstaged: bool,
}

/// Working tree status summary
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WorkingTreeStatus {
    /// Files with unstaged changes
    pub unstaged_files: Vec<FileEntry>,
    /// Files staged for commit
    pub staged_files: Vec<FileEntry>,
    /// Untracked files
    pub untracked_files: Vec<FileEntry>,
    /// Current branch name
    pub current_branch: Option<String>,
    /// Merge state (if ongoing)
    pub merge_head: Option<String>,
    /// Rebase state (if ongoing)
    pub rebase_merge: Option<String>,
}

/// Represents a Git branch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    /// Branch name
    pub name: String,
    /// Target commit hash
    pub target: String,
    /// Whether it's a local branch
    pub is_local: bool,
    /// Whether this is the current HEAD
    pub is_head: bool,
    /// Upstream branch name (if tracking)
    pub upstream: Option<String>,
}

/// Represents a Git remote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Remote {
    /// Remote name (e.g., "origin")
    pub name: String,
    /// Fetch URL
    pub fetch_url: String,
    /// Push URL (if different)
    pub push_url: Option<String>,
}

/// Represents a Git tag
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    /// Tag name
    pub name: String,
    /// Target commit hash
    pub target: String,
    /// Tag message (for annotated tags)
    pub message: Option<String>,
    /// Tagger name (for annotated tags)
    pub tagger: Option<String>,
}

/// Repository status summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryStatus {
    /// Working tree status
    pub status: WorkingTreeStatus,
    /// Current HEAD commit
    pub head: Option<Commit>,
    /// All branches
    pub branches: Vec<Branch>,
    /// All remotes
    pub remotes: Vec<Remote>,
    /// All tags
    pub tags: Vec<Tag>,
    /// Number of commits ahead of upstream
    pub ahead: usize,
    /// Number of commits behind upstream
    pub behind: usize,
}

impl Default for RepositoryStatus {
    fn default() -> Self {
        Self {
            status: WorkingTreeStatus::default(),
            head: None,
            branches: Vec::new(),
            remotes: Vec::new(),
            tags: Vec::new(),
            ahead: 0,
            behind: 0,
        }
    }
}

/// Diff hunk representing a change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    /// Old file line range (start, count)
    pub old_range: (usize, usize),
    /// New file line range (start, count)
    pub new_range: (usize, usize),
    /// Hunk header text
    pub header: String,
    /// Lines in the hunk
    pub lines: Vec<DiffLine>,
}

/// Single line in a diff
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffLine {
    /// '+' for added, '-' for removed, ' ' for context
    pub prefix: char,
    /// Line content
    pub content: String,
    /// Old file line number (if applicable)
    pub old_line: Option<usize>,
    /// New file line number (if applicable)
    pub new_line: Option<usize>,
}

/// File diff containing all hunks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDiff {
    /// File path
    pub path: PathBuf,
    /// Previous path (if renamed)
    pub old_path: Option<PathBuf>,
    /// File status
    pub status: FileStatus,
    /// Hunks in the diff
    pub hunks: Vec<DiffHunk>,
    /// Whether file is binary
    pub is_binary: bool,
}

/// Stash entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stash {
    /// Stash identifier
    pub id: String,
    /// Stash description
    pub description: String,
    /// Stash commit hash
    pub commit: String,
}
