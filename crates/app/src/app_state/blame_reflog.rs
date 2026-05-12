//! Blame 与 Reflog —— Blame and Reflog state methods

use crate::app_state::AppState;
use ogit::GitOps;

impl AppState {
    /// 加载文件 blame 信息 —— Load blame information for a file
    pub fn load_blame(&mut self, path: &std::path::Path) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        self.blame_path = Some(path.to_path_buf());
        self.blame_data = repo
            .get_blame(&path.to_string_lossy())
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }

    /// 加载引用日志 —— Load reflog entries
    pub fn load_reflog(&mut self, count: usize) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;

        self.reflog_entries = repo
            .get_reflog(count)
            .map_err(|e| anyhow::anyhow!("{}", e))?;
        Ok(())
    }
}
