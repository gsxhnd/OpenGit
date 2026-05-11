//! 储藏操作 —— Stash operations
//!
//! 包含 `AppState` 中与 Git stash 相关的方法。
//!
//! Contains AppState methods for stash management (create, apply, pop, delete).

use ogit::GitOps;

use super::AppState;

impl AppState {
    // ========================================================================
    // Stash 操作 —— Stash operations
    // ========================================================================

    /// 获取储藏列表 —— Get stash list
    pub fn get_stashes(&self) -> anyhow::Result<Vec<ogit::Stash>> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.get_stashes().map_err(|e| anyhow::anyhow!("{}", e))
    }

    /// 创建新储藏 —— Create a new stash
    pub fn create_stash(&mut self, message: Option<&str>) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.create_stash(message)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 应用储藏 —— Apply a stash
    pub fn apply_stash(&mut self, stash_id: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.apply_stash(stash_id)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 弹出储藏 —— Pop a stash
    pub fn pop_stash(&mut self, stash_id: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.pop_stash(stash_id)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 删除储藏 —— Delete a stash
    pub fn delete_stash(&mut self, stash_id: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.delete_stash(stash_id)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }
}
