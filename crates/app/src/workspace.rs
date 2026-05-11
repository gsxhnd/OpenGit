//! 工作空间 —— Workspace
//!
//! 管理多个项目的容器，支持项目添加、移除、切换、分组和状态缓存。
//! 支持并发刷新项目状态。
//!
//! Multi-project container with add/remove/switch/group/status-cache and concurrent refresh.

use crate::settings::{ProjectGroup, WorkspaceEntry};
use ogit::GitOps;
use std::collections::HashMap;
use std::path::PathBuf;

/// 缓存的项目状态 —— Cached project status for sidebar display
#[derive(Debug, Clone, Default)]
pub struct CachedStatus {
    pub branch: Option<String>,
    pub changed: usize,
    pub staged: usize,
    pub ahead: usize,
    pub behind: usize,
    pub has_conflict: bool,
    pub ok: bool,
}

/// 工作空间 —— Workspace managing multiple projects
#[derive(Debug, Clone, Default)]
pub struct Workspace {
    pub entries: Vec<WorkspaceEntry>,
    pub groups: Vec<ProjectGroup>,
    pub active_index: usize,
    pub entry_statuses: HashMap<PathBuf, CachedStatus>,
    pub search_query: String,
    pub group_expanded: HashMap<String, bool>,
}

impl Workspace {
    /// 创建空工作空间 —— Create empty workspace
    pub fn new() -> Self {
        Self::default()
    }

    /// 从设置恢复工作空间 —— Restore workspace from settings
    pub fn from_settings(
        entries: Vec<WorkspaceEntry>,
        groups: Vec<ProjectGroup>,
        active_index: usize,
    ) -> Self {
        let mut ws = Self {
            entries,
            groups,
            active_index,
            ..Default::default()
        };
        // 合理处理 active_index 越界 —— Clamp active_index to valid range
        if ws.active_index >= ws.entries.len() {
            ws.active_index = ws.entries.len().saturating_sub(1);
        }
        ws
    }

    /// 活动项目数量 —— Number of projects
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// 获取活跃项目条目 —— Get active entry
    pub fn active_entry(&self) -> Option<&WorkspaceEntry> {
        self.entries.get(self.active_index)
    }

    /// 获取活跃项目路径 —— Get active project path
    pub fn active_path(&self) -> Option<&PathBuf> {
        self.active_entry().map(|e| &e.path)
    }

    /// 添加项目 —— Add a project
    pub fn add_entry(&mut self, path: PathBuf, name: String) {
        if self.entries.iter().any(|e| e.path == path) {
            return;
        }
        self.entries.push(WorkspaceEntry {
            path,
            name,
            group_id: None,
            last_opened: None,
        });
        if self.entries.len() == 1 {
            self.active_index = 0;
        }
    }

    /// 移除项目 —— Remove a project by path
    pub fn remove_entry(&mut self, path: &PathBuf) {
        if let Some(idx) = self.entries.iter().position(|e| &e.path == path) {
            self.entries.remove(idx);
            self.entry_statuses.remove(path);
            if self.active_index >= self.entries.len() {
                self.active_index = self.entries.len().saturating_sub(1);
            }
        }
    }

    /// 切换到指定索引 —— Switch active project by index
    pub fn switch_to(&mut self, index: usize) -> bool {
        if index < self.entries.len() {
            self.active_index = index;
            true
        } else {
            false
        }
    }

    /// 添加分组 —— Add a group
    pub fn add_group(&mut self, id: String, name: String) {
        if !self.groups.iter().any(|g| g.id == id) {
            self.groups.push(ProjectGroup { id, name });
        }
    }

    /// 将项目移到分组 —— Move a project to a group
    pub fn set_entry_group(&mut self, path: &PathBuf, group_id: Option<String>) {
        if let Some(entry) = self.entries.iter_mut().find(|e| &e.path == path) {
            entry.group_id = group_id;
        }
    }

    /// 设置搜索查询 —— Set search query
    pub fn set_search(&mut self, query: String) {
        self.search_query = query;
    }

    /// 获取搜索过滤后的条目 —— Get entries filtered by search
    pub fn filtered_entries(&self) -> Vec<&WorkspaceEntry> {
        if self.search_query.is_empty() {
            self.entries.iter().collect()
        } else {
            let q = self.search_query.to_lowercase();
            self.entries
                .iter()
                .filter(|e| {
                    e.name.to_lowercase().contains(&q)
                        || e.path.to_string_lossy().to_lowercase().contains(&q)
                })
                .collect()
        }
    }

    /// 获取按分组的条目 —— Get entries grouped by group_id
    pub fn grouped_entries(&self) -> (Vec<&WorkspaceEntry>, HashMap<&str, Vec<&WorkspaceEntry>>) {
        let filtered = self.filtered_entries();
        let mut ungrouped = Vec::new();
        let mut grouped: HashMap<&str, Vec<&WorkspaceEntry>> = HashMap::new();

        for entry in &filtered {
            if let Some(ref gid) = entry.group_id {
                grouped.entry(gid.as_str()).or_default().push(*entry);
            } else {
                ungrouped.push(*entry);
            }
        }
        (ungrouped, grouped)
    }

    /// 更新缓存状态 —— Update cached status for a project
    pub fn update_status(&mut self, path: &std::path::Path, status: CachedStatus) {
        self.entry_statuses.insert(path.to_path_buf(), status);
    }

    /// 获取缓存状态 —— Get cached status
    pub fn get_status(&self, path: &PathBuf) -> Option<&CachedStatus> {
        self.entry_statuses.get(path)
    }

    /// 刷新所有项目状态 —— Refresh all project statuses (synchronous for now)
    pub fn refresh_all(&mut self) {
        for entry in &self.entries {
            match ogit::Repository::open(&entry.path) {
                Ok(repo) => match repo.get_status() {
                    Ok(status) => {
                        let changed = status.status.unstaged_files.len()
                            + status.status.untracked_files.len();
                        let staged = status.status.staged_files.len();
                        let has_conflict = status
                            .status
                            .unstaged_files
                            .iter()
                            .chain(status.status.staged_files.iter())
                            .any(|f| f.status == ogit::FileStatus::Conflicted);
                        self.entry_statuses.insert(
                            entry.path.clone(),
                            CachedStatus {
                                branch: status.status.current_branch,
                                changed,
                                staged,
                                ahead: status.ahead,
                                behind: status.behind,
                                has_conflict,
                                ok: true,
                            },
                        );
                    }
                    Err(e) => {
                        tracing::warn!("Failed to refresh {}: {}", entry.path.display(), e);
                        self.entry_statuses.insert(
                            entry.path.clone(),
                            CachedStatus {
                                ok: false,
                                ..Default::default()
                            },
                        );
                    }
                },
                Err(_) => {
                    self.entry_statuses.insert(
                        entry.path.clone(),
                        CachedStatus {
                            ok: false,
                            ..Default::default()
                        },
                    );
                }
            }
        }
    }
}
