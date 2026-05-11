//! 配置类型定义 —— Configuration type definitions
//!
//! 包含所有持久化配置相关的结构体和枚举。
//!
//! Contains all persistent configuration structs and enums.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub(super) const DEFAULT_THEME: &str = "Ayu Dark";
pub(super) const DEFAULT_WINDOW_WIDTH: f32 = 1100.0;
pub(super) const DEFAULT_WINDOW_HEIGHT: f32 = 720.0;
pub(super) const MAX_RECENT_REPOS: usize = 10;

/// Git 后端类型 —— Git backend type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub enum GitBackendType {
    /// git2 (libgit2) — 默认后端
    #[serde(rename = "git2")]
    #[default]
    Git2,
    /// 系统 git 命令行 —— System git command
    #[serde(rename = "git_cmd")]
    GitCmd,
}

/// 窗口设置 —— Window settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSettings {
    pub width: f32,
    pub height: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<f32>,
}

impl Default for WindowSettings {
    fn default() -> Self {
        Self {
            width: DEFAULT_WINDOW_WIDTH,
            height: DEFAULT_WINDOW_HEIGHT,
            x: None,
            y: None,
        }
    }
}

/// 最近仓库记录 —— Recent repository record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentRepo {
    pub path: PathBuf,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_opened: Option<String>,
}

/// 项目分组 —— Project group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectGroup {
    pub id: String,
    pub name: String,
}

/// 工作区项目条目 —— Workspace project entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceEntry {
    pub path: PathBuf,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_opened: Option<String>,
}

/// 工作区设置 —— Workspace settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkspaceSettings {
    #[serde(default)]
    pub entries: Vec<WorkspaceEntry>,
    #[serde(default)]
    pub groups: Vec<ProjectGroup>,
    #[serde(default)]
    pub active_index: usize,
}

/// 应用设置 —— Application settings
///
/// Central configuration model. Persisted as JSON.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(default)]
    pub window: WindowSettings,

    #[serde(default)]
    pub recent_repos: Vec<RecentRepo>,

    #[serde(default = "default_theme")]
    pub theme: String,

    #[serde(default)]
    pub git_backend: GitBackendType,

    #[serde(default)]
    pub workspace: WorkspaceSettings,
}

fn default_theme() -> String {
    DEFAULT_THEME.to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            window: WindowSettings::default(),
            recent_repos: Vec::new(),
            theme: DEFAULT_THEME.to_string(),
            git_backend: GitBackendType::default(),
            workspace: WorkspaceSettings::default(),
        }
    }
}

impl AppSettings {
    /// 添加或更新最近仓库记录 —— Add or update recent repo entry
    pub fn add_recent_repo(&mut self, path: PathBuf) {
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string());

        self.recent_repos.retain(|r| r.path != path);
        self.recent_repos.insert(
            0,
            RecentRepo {
                path,
                name,
                last_opened: None,
            },
        );
        self.recent_repos.truncate(MAX_RECENT_REPOS);
    }

    /// 更新窗口尺寸和位置 —— Update window size and position
    pub fn update_window(&mut self, width: f32, height: f32, x: Option<f32>, y: Option<f32>) {
        self.window.width = width;
        self.window.height = height;
        self.window.x = x;
        self.window.y = y;
    }

    /// 添加工作区项目 —— Add a workspace project entry
    pub fn add_workspace_entry(&mut self, path: PathBuf) {
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string());

        if !self.workspace.entries.iter().any(|e| e.path == path) {
            self.workspace.entries.push(WorkspaceEntry {
                path,
                name,
                group_id: None,
                last_opened: None,
            });
        }
    }

    /// 移除工作区项目 —— Remove a workspace project entry
    pub fn remove_workspace_entry(&mut self, path: &std::path::Path) {
        self.workspace.entries.retain(|e| e.path != path);
        if self.workspace.active_index >= self.workspace.entries.len() {
            self.workspace.active_index = self.workspace.entries.len().saturating_sub(1);
        }
    }

    /// 添加项目分组 —— Add a project group
    pub fn add_workspace_group(&mut self, name: &str) -> String {
        let id = uuid_simple(name);
        self.workspace.groups.push(ProjectGroup {
            id: id.clone(),
            name: name.to_string(),
        });
        id
    }

    /// 设置工作区活跃项目索引 —— Set active workspace index
    pub fn set_workspace_active(&mut self, index: usize) {
        if index < self.workspace.entries.len() {
            self.workspace.active_index = index;
        }
    }
}

/// 简单 UUID 生成（基于名称哈希） —— Simple UUID-like ID from name hash
fn uuid_simple(name: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    name.hash(&mut h);
    format!("{:x}", h.finish())
}
