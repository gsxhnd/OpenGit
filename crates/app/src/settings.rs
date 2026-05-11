//! 应用配置管理 —— Application configuration management
//!
//! Handles loading, saving, and validating persistent application settings.
//! Config is stored as JSON in the platform-appropriate config directory:
//!
//! | Platform | Config Dir |
//! |----------|-----------|
//! | Windows  | `%APPDATA%/OpenGit/` |
//! | macOS    | `~/Library/Application Support/OpenGit/` |
//! | Linux    | `$XDG_CONFIG_HOME/OpenGit/` or `~/.config/OpenGit/` |
//!
//! ## Fault Tolerance
//!
//! - Missing config: creates defaults automatically (first-launch friendly).
//! - Corrupted config: renamed to `config.json.bak`, falls back to defaults,
//!   and surfaces a user-visible error.
//! - Save failures: non-fatal, logged but does not crash the application.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const DEFAULT_THEME: &str = "Ayu Dark";
const DEFAULT_WINDOW_WIDTH: f32 = 1100.0;
const DEFAULT_WINDOW_HEIGHT: f32 = 720.0;
const MAX_RECENT_REPOS: usize = 10;
const CONFIG_FILE: &str = "config.json";

/// 加载配置的结果 —— Result type for config loading
///
/// Variants cover all states: first-launch, normal, and corrupted.
/// - `Fresh`: No config file exists (first launch)
/// - `Loaded`: Config loaded successfully
/// - `Corrupted`: Config existed but failed to parse (backup created, defaults used)
#[derive(Debug)]
pub enum LoadResult {
    /// 首次启动，无配置文件 —— First launch, no config file
    Fresh(AppSettings),
    /// 配置加载成功 —— Config loaded successfully
    Loaded(AppSettings),
    /// 配置已损坏已回退到默认 —— Config corrupted, fell back to defaults
    Corrupted {
        settings: AppSettings,
        error: String,
    },
}

// ============================================================================
// 设置类型 —— Setting types
// ============================================================================

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

// ============================================================================
// 平台目录解析 —— Platform-specific directory resolution
// ============================================================================

impl AppSettings {
    /// 获取平台相关的配置目录 —— Get platform-specific config directory
    pub fn config_dir() -> PathBuf {
        #[cfg(target_os = "windows")]
        {
            std::env::var("APPDATA")
                .map(PathBuf::from)
                .unwrap_or_else(|_| {
                    std::env::var("USERPROFILE")
                        .map(PathBuf::from)
                        .unwrap_or_else(|_| PathBuf::from("."))
                        .join("AppData")
                        .join("Roaming")
                })
                .join("OpenGit")
        }

        #[cfg(target_os = "macos")]
        {
            std::env::var("HOME")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("Library")
                .join("Application Support")
                .join("OpenGit")
        }

        #[cfg(all(
            target_os = "linux",
            not(target_os = "macos"),
            not(target_os = "windows")
        ))]
        {
            if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
                PathBuf::from(xdg).join("OpenGit")
            } else {
                std::env::var("HOME")
                    .map(PathBuf::from)
                    .unwrap_or_else(|_| PathBuf::from("."))
                    .join(".config")
                    .join("OpenGit")
            }
        }
    }

    /// 获取日志目录 —— Get platform-specific log directory
    pub fn log_dir() -> PathBuf {
        Self::config_dir().join("logs")
    }

    /// 获取配置文件路径 —— Get config file path
    pub fn config_path() -> PathBuf {
        Self::config_dir().join(CONFIG_FILE)
    }

    /// 加载或初始化配置 —— Load or initialize config
    ///
    /// Handles three cases:
    /// 1. No config file → returns `LoadResult::Fresh` with defaults
    /// 2. Valid config file → returns `LoadResult::Loaded` with parsed settings
    /// 3. Corrupted config file → renames to `.bak`, returns `LoadResult::Corrupted` with defaults
    pub fn load_or_default() -> LoadResult {
        let config_path = Self::config_path();
        tracing::info!("Config path: {}", config_path.display());

        if !config_path.exists() {
            tracing::info!("No config file found — creating defaults");
            let settings = AppSettings::default();
            if let Err(e) = settings.save() {
                tracing::error!("Failed to save initial config: {}", e);
            }
            return LoadResult::Fresh(settings);
        }

        match std::fs::read_to_string(&config_path) {
            Ok(content) => match serde_json::from_str::<AppSettings>(&content) {
                Ok(settings) => {
                    tracing::info!("Config loaded successfully");
                    LoadResult::Loaded(settings)
                }
                Err(e) => {
                    let err_msg = format!("Config file is corrupted: {}", e);
                    tracing::error!("{}", err_msg);

                    let bak_path = config_path.with_extension("json.bak");
                    if let Err(rename_err) = std::fs::rename(&config_path, &bak_path) {
                        tracing::error!("Failed to backup corrupted config: {}", rename_err);
                    } else {
                        tracing::info!("Corrupted config backed up to {}", bak_path.display());
                    }

                    let settings = AppSettings::default();
                    if let Err(save_err) = settings.save() {
                        tracing::error!("Failed to save fallback config: {}", save_err);
                    }

                    LoadResult::Corrupted {
                        settings,
                        error: err_msg,
                    }
                }
            },
            Err(e) => {
                let err_msg = format!("Failed to read config file: {}", e);
                tracing::error!("{}", err_msg);

                let settings = AppSettings::default();
                if let Err(save_err) = settings.save() {
                    tracing::error!("Failed to save fallback config: {}", save_err);
                }

                LoadResult::Corrupted {
                    settings,
                    error: err_msg,
                }
            }
        }
    }

    /// 保存配置到磁盘 —— Save settings to disk
    pub fn save(&self) -> Result<(), String> {
        let config_dir = Self::config_dir();
        std::fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        let config_path = Self::config_path();
        std::fs::write(&config_path, content)
            .map_err(|e| format!("Failed to write config file: {}", e))?;

        tracing::info!("Config saved to {}", config_path.display());
        Ok(())
    }

    /// 初始化配置目录和日志目录 —— Initialize config and log directories
    pub fn init_dirs() -> Result<(), String> {
        let config_dir = Self::config_dir();
        let log_dir = Self::log_dir();

        std::fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
        std::fs::create_dir_all(&log_dir)
            .map_err(|e| format!("Failed to create log directory: {}", e))?;

        tracing::info!("Config directory: {}", config_dir.display());
        tracing::info!("Log directory: {}", log_dir.display());
        Ok(())
    }

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

// ============================================================================
// 测试 —— Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert_eq!(settings.theme, "Ayu Dark");
        assert_eq!(settings.window.width, 1100.0);
        assert_eq!(settings.window.height, 720.0);
        assert_eq!(settings.git_backend, GitBackendType::Git2);
        assert!(settings.recent_repos.is_empty());
    }

    #[test]
    fn test_serialize_deserialize_default() {
        let settings = AppSettings::default();
        let json = serde_json::to_string_pretty(&settings).expect("Serialize");
        let parsed: AppSettings = serde_json::from_str(&json).expect("Deserialize");
        assert_eq!(parsed.theme, settings.theme);
        assert_eq!(parsed.window.width, settings.window.width);
        assert_eq!(parsed.window.height, settings.window.height);
        assert_eq!(parsed.git_backend, settings.git_backend);
    }

    #[test]
    fn test_deserialize_minimal_json() {
        let json = r#"{"theme": "Solarized Dark"}"#;
        let settings: AppSettings = serde_json::from_str(json).expect("Deserialize");
        assert_eq!(settings.theme, "Solarized Dark");
        assert_eq!(settings.window.width, 1100.0);
        assert_eq!(settings.window.height, 720.0);
        assert_eq!(settings.git_backend, GitBackendType::Git2);
    }

    #[test]
    fn test_deserialize_invalid_backend() {
        let json = r#"{"git_backend": "invalid"}"#;
        let result = serde_json::from_str::<AppSettings>(json);
        assert!(result.is_err());
    }

    #[test]
    fn test_deserialize_corrupted_json() {
        let json = r#"{"theme": "Ayu Dark", "window": {invalid}}"#;
        let result = serde_json::from_str::<AppSettings>(json);
        assert!(result.is_err());
    }

    #[test]
    fn test_add_recent_repo() {
        let mut settings = AppSettings::default();
        let path = PathBuf::from("/home/user/repos/my-project");
        settings.add_recent_repo(path.clone());
        assert_eq!(settings.recent_repos.len(), 1);
        assert_eq!(settings.recent_repos[0].path, path);
        assert_eq!(settings.recent_repos[0].name, "my-project");
    }

    #[test]
    fn test_add_recent_repo_dedup() {
        let mut settings = AppSettings::default();
        let path = PathBuf::from("/home/user/repos/my-project");
        settings.add_recent_repo(path.clone());
        settings.add_recent_repo(path.clone());
        assert_eq!(settings.recent_repos.len(), 1);
    }

    #[test]
    fn test_add_recent_repo_max_limit() {
        let mut settings = AppSettings::default();
        for i in 0..15 {
            settings.add_recent_repo(PathBuf::from(format!("/repo/{}", i)));
        }
        assert_eq!(settings.recent_repos.len(), 10);
        assert_eq!(settings.recent_repos[0].name, "14");
    }

    #[test]
    fn test_update_window() {
        let mut settings = AppSettings::default();
        settings.update_window(1280.0, 800.0, Some(100.0), Some(200.0));
        assert_eq!(settings.window.width, 1280.0);
        assert_eq!(settings.window.height, 800.0);
        assert_eq!(settings.window.x, Some(100.0));
        assert_eq!(settings.window.y, Some(200.0));
    }

    #[test]
    fn test_window_serialize_skip_none_position() {
        let settings = AppSettings::default();
        let json = serde_json::to_string_pretty(&settings).expect("Serialize");
        assert!(!json.contains("\"x\""));
        assert!(!json.contains("\"y\""));
    }

    #[test]
    fn test_config_dir_is_absolute() {
        let dir = AppSettings::config_dir();
        assert!(!dir.as_os_str().is_empty());
        assert!(dir.is_absolute());
    }
}
