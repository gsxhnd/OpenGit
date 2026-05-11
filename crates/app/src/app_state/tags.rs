//! 标签操作 —— Tag operations
//!
//! 包含 `AppState` 中与 Git tag 相关的方法。
//!
//! Contains AppState methods for tag management (create, delete).

use ogit::GitOps;

use super::AppState;

impl AppState {
    // ========================================================================
    // Tag 操作 —— Tag operations
    // ========================================================================

    /// 创建标签 —— Create a tag
    pub fn create_tag(&mut self, name: &str, message: Option<&str>) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.create_tag(name, None, message)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 删除标签 —— Delete a tag
    pub fn delete_tag(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.delete_tag(name)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }
}
