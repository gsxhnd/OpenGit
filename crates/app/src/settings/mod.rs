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
//! ## 模块结构 —— Module Structure
//!
//! | 子模块 | 功能 |
//! |--------|------|
//! | `types` | 配置类型定义（AppSettings、WindowSettings 等） |
//! | `persistence` | 加载/保存/路径解析逻辑 |
//!
//! ## Fault Tolerance
//!
//! - Missing config: creates defaults automatically (first-launch friendly).
//! - Corrupted config: renamed to `config.json.bak`, falls back to defaults,
//!   and surfaces a user-visible error.
//! - Save failures: non-fatal, logged but does not crash the application.

mod persistence;
#[cfg(test)]
mod tests;
mod types;

pub use persistence::LoadResult;
pub use types::*;
