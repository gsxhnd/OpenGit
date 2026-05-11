//! 差异计算 —— Diff computation
//!
//! 实现以下方法：
//! - `get_commit_diff(hash)` — 获取指定提交与父提交之间的差异
//! - `get_file_diff(path)` — 获取工作区中单个文件相对于索引的差异
//! - `parse_diff_to_model(diff)` — 将 git2 的 Diff 对象解析为我们的模型
//!
//! 差异解析采用 git2 的回调式 API（`diff.foreach`），使用 `RefCell` 在回调中累积数据。
//!
//! Implements commit diff and file diff computation using git2's callback-based diff API.

use crate::model::*;
use crate::operations::GitError;
use crate::repository::{Repository, delta_file_status};
use std::cell::RefCell;
use std::path::{Path, PathBuf};

impl Repository {
    /// 获取指定提交的完整差异 —— Get diff for a specific commit
    ///
    /// 比较该提交与其第一个父提交之间的差异。
    /// 如果该提交没有父提交（即初始提交），则比较空树与该提交的树。
    ///
    /// Compares the commit with its first parent (or empty tree for initial commits).
    pub(crate) fn __get_commit_diff(&self, hash: &str) -> Result<Vec<FileDiff>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;

        let tree = commit.tree()?;
        let parent_tree = if commit.parent_count() > 0 {
            Some(commit.parent(0)?.tree()?)
        } else {
            None
        };

        let diff = if let Some(parent_tree) = parent_tree {
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?
        } else {
            repo.diff_tree_to_tree(None, Some(&tree), None)?
        };

        parse_diff_to_model(&diff)
    }

    /// 获取暂存区中单个文件与 HEAD 的差异 —— Get staged-vs-HEAD diff for a single file
    ///
    /// 比较该文件在 HEAD 中的版本与索引（暂存区）中的版本。
    /// 显示即将提交的变更内容。
    ///
    /// Compares the file between HEAD and index (staging area). Shows what will be committed.
    pub(crate) fn __get_staged_file_diff(&self, path: &str) -> Result<FileDiff, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let head_tree = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
        let mut opts = git2::DiffOptions::new();
        opts.pathspec(Path::new(path));
        let diff = repo.diff_tree_to_index(head_tree.as_ref(), None, Some(&mut opts))?;
        let parsed = parse_diff_to_model(&diff)?;
        let want = Path::new(path);
        if let Some(fd) = parsed.into_iter().find(|f| f.path == want) {
            return Ok(fd);
        }
        Ok(FileDiff {
            path: PathBuf::from(path),
            old_path: None,
            status: FileStatus::Unmodified,
            hunks: Vec::new(),
            is_binary: false,
        })
    }

    /// 获取所有暂存文件与 HEAD 的差异 —— Get diff for all staged files vs HEAD
    ///
    /// 比较 HEAD 树与索引之间的差异，显示所有已暂存但尚未提交的变更。
    ///
    /// Compares HEAD tree vs index, showing all staged-but-uncommitted changes.
    pub(crate) fn __get_all_staged_diff(&self) -> Result<Vec<FileDiff>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let head_tree = repo.head().ok().and_then(|h| h.peel_to_tree().ok());
        let diff = repo.diff_tree_to_index(head_tree.as_ref(), None, None)?;
        parse_diff_to_model(&diff)
    }

    /// 获取工作区中单个文件的差异 —— Get working-tree diff for a single file
    ///
    /// 比较该文件在索引中的版本与工作区中的版本。
    /// 如果文件没有变更，返回空的 Diff（没有 hunks）。
    ///
    /// Compares the file between index and working tree. Returns empty diff if unchanged.
    pub(crate) fn __get_file_diff(&self, path: &str) -> Result<FileDiff, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut opts = git2::DiffOptions::new();
        // 限制差异只包含指定路径 —— Limit diff to the specified path
        opts.pathspec(Path::new(path));
        let diff = repo.diff_index_to_workdir(None, Some(&mut opts))?;
        let parsed = parse_diff_to_model(&diff)?;
        let want = Path::new(path);
        if let Some(fd) = parsed.into_iter().find(|f| f.path == want) {
            return Ok(fd);
        }
        // 文件无变更，返回空差异 —— File unchanged, return empty diff
        Ok(FileDiff {
            path: PathBuf::from(path),
            old_path: None,
            status: FileStatus::Unmodified,
            hunks: Vec::new(),
            is_binary: false,
        })
    }
}

/// 将 git2 的 Diff 对象解析为我们的 FileDiff 模型 —— Parse git2 Diff into FileDiff model
///
/// 使用 git2 的三层回调式 API：
/// 1. **文件回调**：每个变更的文件触发一次，创建 `FileDiff`
/// 2. **Hunk 回调**：每个差异块触发一次，创建 `DiffHunk`
/// 3. **行回调**：差异块中的每一行触发一次，创建 `DiffLine`
///
/// 由于回调不允许借用外部可变数据，使用 `RefCell` 在回调间累积数据。
///
/// Uses git2's three-level callback API (file → hunk → line) with `RefCell` for data accumulation.
pub(crate) fn parse_diff_to_model(diff: &git2::Diff) -> Result<Vec<FileDiff>, GitError> {
    use crate::model::{DiffHunk as HunkModel, DiffLine as LineModel};

    // 使用 RefCell 在回调中累积数据 —— Use RefCell to accumulate data in callbacks
    let files: RefCell<Vec<FileDiff>> = RefCell::new(Vec::new());
    let cur_file: RefCell<Option<FileDiff>> = RefCell::new(None);
    let cur_hunk: RefCell<Option<HunkModel>> = RefCell::new(None);

    diff.foreach(
        // ==========================
        // 文件回调：每个文件触发一次 —— File callback: once per file
        // ==========================
        &mut |delta, _progress| {
            // 将上一个文件及其最后一个 hunk 推入结果 —— Push previous file and its last hunk
            if let Some(mut f) = cur_file.borrow_mut().take() {
                if let Some(h) = cur_hunk.borrow_mut().take() {
                    f.hunks.push(h);
                }
                files.borrow_mut().push(f);
            }
            let new_path = delta
                .new_file()
                .path()
                .unwrap_or_else(|| Path::new(""))
                .to_path_buf();
            // 检测文件重命名 —— Detect file renames
            let old_path = delta.old_file().path().and_then(|p| {
                let np = delta.new_file().path().unwrap_or(p);
                if p != np { Some(p.to_path_buf()) } else { None }
            });
            *cur_file.borrow_mut() = Some(FileDiff {
                path: new_path,
                old_path,
                status: delta_file_status(delta.status()),
                hunks: Vec::new(),
                is_binary: delta.flags().contains(git2::DiffFlags::BINARY),
            });
            true
        },
        // 二进制文件回调 —— Binary file callback (skip processing)
        Some(&mut |_delta, _binary| true),
        // ==========================
        // Hunk 回调：每个差异块触发一次 —— Hunk callback: once per hunk
        // ==========================
        Some(&mut |_delta, hunk| {
            if let Some(f) = cur_file.borrow_mut().as_mut() {
                if let Some(h) = cur_hunk.borrow_mut().take() {
                    f.hunks.push(h);
                }
                let header = String::from_utf8_lossy(hunk.header()).to_string();
                *cur_hunk.borrow_mut() = Some(HunkModel {
                    old_range: (hunk.old_start() as usize, hunk.old_lines() as usize),
                    new_range: (hunk.new_start() as usize, hunk.new_lines() as usize),
                    header,
                    lines: Vec::new(),
                });
            }
            true
        }),
        // ==========================
        // 行回调：每一行触发一次 —— Line callback: once per line
        // ==========================
        Some(&mut |_delta, _hunk_opt, line| {
            if let (Some(_f), Some(h)) = (
                cur_file.borrow_mut().as_mut(),
                cur_hunk.borrow_mut().as_mut(),
            ) {
                let t = line.origin_value();
                // 只保留有意义的行类型：添加/删除/上下文/EOF标记 —— Only keep meaningful line types
                if matches!(
                    t,
                    git2::DiffLineType::Addition
                        | git2::DiffLineType::Deletion
                        | git2::DiffLineType::Context
                        | git2::DiffLineType::ContextEOFNL
                        | git2::DiffLineType::AddEOFNL
                        | git2::DiffLineType::DeleteEOFNL
                ) {
                    let content = String::from_utf8_lossy(line.content())
                        .trim_end_matches('\n')
                        .to_string();
                    h.lines.push(LineModel {
                        prefix: line.origin(),
                        content,
                        old_line: line.old_lineno().map(|l| l as usize),
                        new_line: line.new_lineno().map(|l| l as usize),
                    });
                }
            }
            true
        }),
    )?;

    // 将最后一个文件和 hunk 推入结果 —— Push the last file and hunk into results
    if let Some(mut f) = cur_file.into_inner() {
        if let Some(h) = cur_hunk.into_inner() {
            f.hunks.push(h);
        }
        files.borrow_mut().push(f);
    }

    Ok(files.into_inner())
}
