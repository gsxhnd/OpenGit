//! 差异视图操作 —— Diff view operations
//!
//! 包含 `AppState` 中与差异文件选择和差异加载相关的方法。
//!
//! Contains AppState methods for selecting diff files and loading diffs.

use ogit::GitOps;
use std::path::PathBuf;

use super::AppState;

impl AppState {
    // ========================================================================
    // 差异视图 —— Diff view
    // ========================================================================

    /// 设置差异文件路径并加载差异 —— Set diff path and load diff preview
    ///
    /// 如果仓库可用，计算工作区与索引之间的差异并缓存到 `diff_preview`。
    /// 设置 `staged` 为 true 时，显示暂存区 vs HEAD 的差异。
    ///
    /// Computes working-tree diff for the given path and caches it in `diff_preview`.
    /// When `staged` is true, shows staged vs HEAD diff.
    pub fn set_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_diff_path = path.clone();
        self.selected_staged_diff_path = None;
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

    /// 设置暂存差异路径并加载差异 —— Set staged diff path and load diff
    ///
    /// 显示暂存区相对于 HEAD 的变更内容（即将提交的内容）。
    ///
    /// Shows staged changes relative to HEAD (what will be committed).
    pub fn set_staged_diff_path(&mut self, path: Option<PathBuf>) -> anyhow::Result<()> {
        self.selected_staged_diff_path = path.clone();
        self.selected_diff_path = None;
        self.diff_preview = match (&self.repository, path.as_ref()) {
            (Some(repo), Some(p)) => {
                let s = p.to_string_lossy();
                Some(
                    repo.get_staged_file_diff(s.as_ref())
                        .map_err(|e| anyhow::anyhow!("{}", e))?,
                )
            }
            _ => None,
        };
        Ok(())
    }
}
