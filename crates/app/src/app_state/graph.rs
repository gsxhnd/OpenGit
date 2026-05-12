//! 提交图 —— Commit graph state methods
//!
//! Phase 4: 提交图数据加载方法。
//! Phase 4: commit graph data loading methods.

use crate::app_state::AppState;
use ogit::GitOps;

impl AppState {
    /// 加载提交图数据 —— Load commit graph data
    ///
    /// 从当前仓库加载指定数量的提交图数据。
    /// Loads graph data from the current repository.
    pub fn load_graph(&mut self, count: usize) -> anyhow::Result<()> {
        let repo = self
            .repository
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("No repository opened"))?;
        self.graph_data = Some(
            repo.get_graph(count)
                .map_err(|e| anyhow::anyhow!("{}", e))?,
        );
        Ok(())
    }
}
