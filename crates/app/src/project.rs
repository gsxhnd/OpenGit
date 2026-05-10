//! 项目实体 —— Project entity
//!
//! 封装单个 Git 仓库项目的路径、名称和状态。
//! 预留用于未来的多项目工作空间支持。
//!
//! Wraps project path, name, and associated repository. Reserved for multi-project workspace support.

use ogit::GitOps;
use ogit::{Repository, RepositoryStatus};
use std::path::PathBuf;
use std::sync::Arc;

/// 项目实体（单个仓库项目） —— Project entity (single repository project)
#[allow(dead_code)]
pub struct Project {
    pub path: PathBuf,
    pub name: String,
    pub repository: Option<Arc<Repository>>,
    pub status: RepositoryStatus,
}

#[allow(dead_code)]
impl Project {
    pub fn new(path: PathBuf) -> anyhow::Result<Self> {
        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Project".to_string());

        let repo = Arc::new(Repository::open(&path)?);
        let status = repo.get_status()?;

        Ok(Self {
            path,
            name,
            repository: Some(repo),
            status,
        })
    }

    pub fn refresh(&mut self) -> anyhow::Result<()> {
        if let Some(repo) = &self.repository {
            self.status = repo.get_status()?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("No repository"))
        }
    }
}
