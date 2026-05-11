//! 分支操作 —— Branch operations
//!
//! 包含 `AppState` 中与分支切换、创建、删除、重命名相关的方法。
//!
//! Contains AppState methods for branch checkout, creation, deletion, and renaming.

use ogit::GitOps;

use super::AppState;

impl AppState {
    // ========================================================================
    // 分支操作 —— Branch operations
    // ========================================================================

    /// 切换到指定分支 —— Checkout a branch
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

    /// 创建新分支 —— Create a new branch
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

    /// 删除分支 —— Delete a branch
    pub fn delete_branch(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.delete_branch(name, false)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 重命名分支 —— Rename a branch
    pub fn rename_branch(&mut self, old_name: &str, new_name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.create_branch(new_name, Some(old_name))
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        repo.delete_branch(old_name, false)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }
}
