//! Git 数据模型 —— Git data models
//!
//! 定义所有 Git 实体的纯数据结构，与具体 Git 后端无关。
//! 所有类型均实现了 `Serialize` 和 `Deserialize`，支持 JSON 序列化，
//! 方便在 UI 层和核心层之间传递数据。
//!
//! Defines all Git entity data structures, backend-agnostic and serializable.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Git 提交对象 —— Git commit
///
/// 包含提交的完整元数据：hash、消息、作者、时间戳和父提交列表。
/// 所有字段均为自有数据（非借用），适合跨线程传递。
///
/// Contains full commit metadata: hash, message, author, timestamp, and parent hashes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commit {
    /// 提交哈希值（完整 40 字符 SHA-1） —— Commit hash (full 40-char SHA-1)
    pub hash: String,
    /// 提交摘要（第一行消息） —— Commit summary (first line of message)
    pub summary: String,
    /// 完整提交消息 —— Full commit message
    pub message: String,
    /// 作者名 —— Author name
    pub author: String,
    /// 提交者名 —— Committer name
    pub committer: String,
    /// 提交时间（UTC） —— Commit timestamp in UTC
    pub time: DateTime<Utc>,
    /// 父提交哈希列表 —— Parent commit hashes
    pub parents: Vec<String>,
}

/// 工作区文件状态 —— Working tree file status
///
/// 对应 `git status` 输出的各种文件状态类型。
///
/// Maps to `git status` file status types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FileStatus {
    /// 文件未变更 —— Unchanged
    Unmodified,
    /// 文件已修改 —— Modified
    Modified,
    /// 文件已暂存（新增） —— Added (staged)
    Added,
    /// 文件已暂存（删除） —— Deleted (staged)
    Deleted,
    /// 文件已重命名 —— Renamed
    Renamed,
    /// 新文件（未跟踪） —— New (untracked)
    Untracked,
    /// 文件存在合并冲突 —— Has merge conflicts
    Conflicted,
}

/// 文件变更条目 —— File change entry
///
/// 描述工作区或暂存区中单个文件的状态，包含路径、状态和阶段信息。
/// `staged` 和 `unstaged` 标记用于区分同一个文件在不同阶段的状态。
///
/// Describes a single file's status in working tree or staging area,
/// with path, status, and staging phase flags.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    /// 文件相对于仓库根目录的路径 —— File path relative to repository root
    pub path: PathBuf,
    /// 当前文件状态 —— Current file status
    pub status: FileStatus,
    /// 是否已暂存 —— Whether the file is staged
    pub staged: bool,
    /// 是否有未暂存的变更 —— Whether the file has unstaged changes
    pub unstaged: bool,
}

/// 工作树状态汇总 —— Working tree status summary
///
/// 包含所有文件变更的分类（unstaged / staged / untracked），
/// 以及当前分支和合并/变基状态信息。
///
/// Contains categorized file changes and current branch/merge/rebase state.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct WorkingTreeStatus {
    /// 未暂存的文件列表 —— Files with unstaged changes
    pub unstaged_files: Vec<FileEntry>,
    /// 已暂存的文件列表 —— Files staged for commit
    pub staged_files: Vec<FileEntry>,
    /// 未跟踪的文件列表 —— Untracked files
    pub untracked_files: Vec<FileEntry>,
    /// 当前分支名 —— Current branch name
    pub current_branch: Option<String>,
    /// 合并头（如果正在合并中） —— Merge head (if merge in progress)
    pub merge_head: Option<String>,
    /// 变基合并信息（如果正在变基中） —— Rebase merge info (if rebase in progress)
    pub rebase_merge: Option<String>,
}

/// Git 分支 —— Git branch
///
/// 包含分支名、目标提交、是否本地分支、是否为 HEAD 以及上游分支信息。
///
/// Contains branch name, target commit, local status, HEAD status, and upstream.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    /// 分支名称 —— Branch name
    pub name: String,
    /// 目标提交哈希 —— Target commit hash
    pub target: String,
    /// 是否为本地分支 —— Whether it's a local branch
    pub is_local: bool,
    /// 是否为当前 HEAD —— Whether this is the current HEAD
    pub is_head: bool,
    /// 上游分支名称（如果存在跟踪关系） —— Upstream branch name (if tracking)
    pub upstream: Option<String>,
}

/// Git 远程仓库 —— Git remote
///
/// 包含远程仓库名称和 URL 信息。push_url 在大多数情况下与 fetch_url 相同，故为可选项。
///
/// Contains remote name and URLs. push_url is optional (usually same as fetch_url).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Remote {
    /// 远程仓库名称（如 "origin"） —— Remote name (e.g., "origin")
    pub name: String,
    /// 拉取 URL —— Fetch URL
    pub fetch_url: String,
    /// 推送 URL（如果与拉取 URL 不同） —— Push URL (if different from fetch)
    pub push_url: Option<String>,
}

/// Git 标签 —— Git tag
///
/// 支持轻量标签和注释标签（含消息和标签者信息）。
///
/// Supports both lightweight and annotated tags (with message and tagger info).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    /// 标签名称 —— Tag name
    pub name: String,
    /// 目标提交哈希 —— Target commit hash
    pub target: String,
    /// 标签消息（仅注释标签） —— Tag message (annotated tags only)
    pub message: Option<String>,
    /// 标签者名称（仅注释标签） —— Tagger name (annotated tags only)
    pub tagger: Option<String>,
}

/// 仓库状态汇总 —— Repository status summary
///
/// 聚合工作区状态、HEAD、分支、远程、标签和上下游差异计数。
/// 这是 UI 层获取仓库整体状态的主要数据结构。
///
/// Aggregates working tree status, HEAD, branches, remotes, tags, and ahead/behind counts.
/// This is the primary data structure UI layer uses to get overall repository state.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RepositoryStatus {
    /// 工作树状态 —— Working tree status
    pub status: WorkingTreeStatus,
    /// 当前 HEAD 提交 —— Current HEAD commit
    pub head: Option<Commit>,
    /// 所有分支 —— All branches
    pub branches: Vec<Branch>,
    /// 所有远程仓库 —— All remotes
    pub remotes: Vec<Remote>,
    /// 所有标签 —— All tags
    pub tags: Vec<Tag>,
    /// 领先上游的提交数 —— Number of commits ahead of upstream
    pub ahead: usize,
    /// 落后上游的提交数 —— Number of commits behind upstream
    pub behind: usize,
}

/// 差异块 —— Diff hunk
///
/// 表示文件差异中的一个连续修改区域。
/// 包含旧文件和新文件的行号范围、hunk 头和差异行列表。
///
/// Represents a contiguous modification region in a file diff,
/// with line ranges, header, and lines.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    /// 旧文件的行号范围（起始行号, 行数） —— Old file line range (start, count)
    pub old_range: (usize, usize),
    /// 新文件的行号范围（起始行号, 行数） —— New file line range (start, count)
    pub new_range: (usize, usize),
    /// Hunk 头部信息（如 "@@ -1,3 +1,4 @@"） —— Hunk header text
    pub header: String,
    /// Hunk 中的差异行列表 —— Lines in the hunk
    pub lines: Vec<DiffLine>,
}

/// 差异行 —— Single diff line
///
/// 表示差异中的一行，包含前缀、内容和行号信息。
/// 前缀含义：'+' 新增行，'-' 删除行，' ' 上下文行。
///
/// Represents a single line in a diff. Prefix: '+' added, '-' removed, ' ' context.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffLine {
    /// 行前缀（'+' 新增, '-' 删除, ' ' 上下文） —— Line prefix
    pub prefix: char,
    /// 行内容 —— Line content
    pub content: String,
    /// 旧文件行号（如适用） —— Old file line number (if applicable)
    pub old_line: Option<usize>,
    /// 新文件行号（如适用） —— New file line number (if applicable)
    pub new_line: Option<usize>,
}

/// 文件差异 —— File diff
///
/// 包含单个文件的完整差异信息：路径、状态、所有 hunks 和二进制标识。
///
/// Contains complete diff info for a single file: path, status, all hunks, and binary flag.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDiff {
    /// 文件路径 —— File path
    pub path: PathBuf,
    /// 旧文件路径（如果文件被重命名） —— Previous path (if renamed)
    pub old_path: Option<PathBuf>,
    /// 文件状态 —— File status
    pub status: FileStatus,
    /// 差异块列表 —— Diff hunks
    pub hunks: Vec<DiffHunk>,
    /// 是否为二进制文件 —— Whether the file is binary
    pub is_binary: bool,
}

/// 储藏条目 —— Stash entry
///
/// 保存工作区临时快照的信息。
/// 注意：`commit` 字段存储了 git2 返回的 OID，可能需要参与后续 stash 操作。
///
/// Holds temporary workspace snapshot info.
/// Note: `commit` stores the OID returned by git2, useful for subsequent stash operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stash {
    /// 储藏标识符（如 "stash@{0}"） —— Stash identifier (e.g., "stash@{0}")
    pub id: String,
    /// 储藏描述信息 —— Stash description
    pub description: String,
    /// 储藏对应的提交哈希 —— Stash commit hash
    pub commit: String,
}

// ============================================================================
// Phase 4 新增模型 —— Phase 4 new model types
// ============================================================================

/// Git blame 行信息 —— Per-line blame information
///
/// 包含单行代码的 blame 信息：提交哈希、作者、时间、行号和内容。
/// 用于构建 blame 视图，支持跳转到对应 commit。
///
/// Contains per-line blame data: commit hash, author, time, line number, and content.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlameLine {
    /// 该行对应的提交哈希 —— Commit hash for this line
    pub hash: String,
    /// 作者名 —— Author name
    pub author: String,
    /// 提交时间（UTC） —— Commit time in UTC
    pub time: DateTime<Utc>,
    /// 文件中的行号（1-based） —— Line number in the file (1-based)
    pub line: usize,
    /// 该行的原始内容 —— Original content of the line
    pub content: String,
    /// 提交摘要（用于快速预览） —— Commit summary for quick preview
    pub summary: String,
}

/// 引用日志条目 —— Reflog entry
///
/// 记录本地引用（如 HEAD、分支）的变动历史。
/// 可用于恢复误操作（如误删分支、误 reset）。
///
/// Records local reference change history for recovery of mistaken operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReflogEntry {
    /// 移动前的提交哈希 —— Hash before the change
    pub old_hash: String,
    /// 移动后的提交哈希 —— Hash after the change
    pub new_hash: String,
    /// 引用操作者 —— Who performed the operation
    pub committer: String,
    /// 操作时间 —— Operation time
    pub time: DateTime<Utc>,
    /// 操作描述（如 "commit: message"、"reset: moving to HEAD~1"） —— Operation description
    pub message: String,
}

/// 提交图节点 —— Graph row cell (visual element in commit graph column)
///
/// 表示图列中的一个单元格，可以是空、线、提交点或分支标签。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GraphCell {
    /// 空单元格 —— Empty cell
    Empty,
    /// 垂直线（│） —— Vertical line
    Pipe,
    /// 分支线（├─ 或 ├┬） —— Branch line
    Branch,
    /// 合并线（─┘ 或 ─┤） —— Merge line
    Merge,
    /// 提交节点（●） —— Commit node
    Dot,
    /// 左上转角（┌） —— Top-left corner (branch fork start)
    Fork,
    /// 右下转角（┘） —— Bottom-right corner (merge end)
    MergeEnd,
}

/// 提交图行 —— Single row in the commit graph
///
/// 包含一行可视化图单元格、关联的提交信息和分支/标签标记。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRow {
    /// 该行左侧的图单元格列表 —— Graph cells for the left decoration
    pub cells: Vec<GraphCell>,
    /// 该行对应的提交 —— The commit for this row
    pub commit: Commit,
    /// 该行的分支标记列表 —— Branch labels at this row
    pub branch_labels: Vec<String>,
    /// 该行的标签标记列表 —— Tag labels at this row
    pub tag_labels: Vec<String>,
}

/// 提交图数据 —— Commit graph data
///
/// 包含完整的提交拓扑图，每行对应一个提交，附带分支/标签标记。
/// 用于在 UI 中渲染提交历史图。
///
/// Contains complete commit topology, rows with graph cells, branch and tag markers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    /// 图行列表（按时间倒序，最新在前） —— Graph rows (reverse chronological)
    pub rows: Vec<GraphRow>,
}
