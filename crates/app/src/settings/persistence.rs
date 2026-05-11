//! 配置持久化 —— Configuration persistence
//!
//! 负责配置文件的加载、保存和平台目录解析。
//!
//! Handles loading, saving config files and platform-specific directory resolution.

use std::path::PathBuf;

use super::types::AppSettings;

pub(super) const CONFIG_FILE: &str = "config.json";

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
}
