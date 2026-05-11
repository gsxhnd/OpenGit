//! 暂存区操作 —— Staging operations
//!
//! 包含 `AppState` 中与文件暂存/取消暂存/提交相关的方法。
//!
//! Contains AppState methods for staging, unstaging, and committing files.

use ogit::GitOps;
use std::path::Path;

use super::AppState;

impl AppState {
    // ========================================================================
    // 暂存区操作 —— Staging operations
    // ========================================================================

    /// 暂存文件 —— Stage a file
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

    /// 暂存所有未暂存和未跟踪的文件 —— Stage all unstaged and untracked files
    pub fn stage_all(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let paths: Vec<String> = self
            .repo_status
            .status
            .unstaged_files
            .iter()
            .chain(self.repo_status.status.untracked_files.iter())
            .map(|e| e.path.to_string_lossy().to_string())
            .collect();
        let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        if !refs.is_empty() {
            repo.stage_files(&refs)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        self.refresh_status()?;
        Ok(())
    }

    /// 取消暂存 —— Unstage a file
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

    /// 取消暂存所有已暂存文件 —— Unstage all staged files
    pub fn unstage_all(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let paths: Vec<String> = self
            .repo_status
            .status
            .staged_files
            .iter()
            .map(|e| e.path.to_string_lossy().to_string())
            .collect();
        let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
        if !refs.is_empty() {
            repo.unstage_files(&refs)
                .map_err(|e| anyhow::anyhow!("{}", e))?;
        }
        self.refresh_status()?;
        Ok(())
    }

    /// 提交暂存的更改 —— Commit staged changes
    ///
    /// 支持普通提交和 --amend 修补提交两种模式。
    ///
    /// Supports both normal commit and --amend mode.
    pub fn commit_staged(&mut self, message: &str, amend: bool) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        let summary: &str = message.lines().next().unwrap_or("");
        tracing::info!(
            "Committing staged changes (amend={}, summary='{}')",
            amend,
            summary
        );
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
}
