//! 远程仓库管理与同步 —— Remote management and sync operations
//!
//! 包含 `AppState` 中与远程仓库管理（添加/删除）和同步（fetch/pull/push）相关的方法。
//!
//! Contains AppState methods for remote management (add/remove)
//! and sync operations (fetch, pull, push).

use ogit::GitOps;

use super::AppState;

impl AppState {
    // ========================================================================
    // Remote 操作 —— Remote operations
    // ========================================================================

    /// 添加远程仓库 —— Add a remote
    pub fn add_remote(&mut self, name: &str, url: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.add_remote(name, url)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    /// 删除远程仓库 —— Remove a remote
    pub fn remove_remote(&mut self, name: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        repo.remove_remote(name)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        self.refresh_status()?;
        Ok(())
    }

    // ========================================================================
    // 远程同步 —— Remote sync
    // ========================================================================

    /// 从 origin 远程获取更新 —— Fetch from origin
    pub fn fetch_origin(&mut self) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        tracing::info!("Fetching from origin");
        self.current_operation = Some("Fetching…".into());
        let result = repo.fetch("origin").map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
        }
        result
    }

    /// 从 origin 拉取当前分支 —— Pull current branch from origin
    pub fn pull_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.current_operation = Some("Pulling…".into());
        let result = repo
            .pull("origin", branch)
            .map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
            let _ = self.load_history_reset();
        }
        result
    }

    /// 推送当前分支到 origin —— Push current branch to origin
    pub fn push_origin(&mut self, branch: &str) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.current_operation = Some("Pushing…".into());
        let result = repo
            .push("origin", branch, false)
            .map_err(|e| anyhow::anyhow!("{}", e));
        self.current_operation = None;
        if result.is_ok() {
            self.refresh_status()?;
        }
        result
    }
}
