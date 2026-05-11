//! 配置模块测试 —— Settings module tests

use super::*;
use std::path::PathBuf;

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
