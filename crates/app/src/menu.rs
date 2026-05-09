//! 菜单系统 —— Menu system
//!
//! 构造应用的主菜单栏，包括：
//! - OpenGit 菜单：打开/克隆仓库、退出
//! - Repository 菜单：Fetch / Pull / Push
//!
//! 菜单项根据是否有打开的仓库动态启用/禁用。
//!
//! Builds the application menu bar with context-sensitive enabled/disabled states.

use gpui_component::menu::{Menu, MenuItem};

use crate::app_component::{CloneRepository, MenuFetch, MenuPull, MenuPush, OpenRepository, QuitApp};

/// 构造 OpenGit 主菜单 —— Build OpenGit main menus
///
/// 返回两个菜单：
/// 1. **OpenGit**：打开仓库、克隆仓库、退出
/// 2. **Repository**：Fetch、Pull、Push（无仓库时禁用）
///
/// Returns two menus: OpenGit (general) and Repository (git operations, disabled without repo).
pub fn build_open_git_menus(has_repo: bool) -> Vec<Menu> {
    vec![
        // OpenGit 菜单：应用级别的操作 —— App-level operations
        Menu::new("OpenGit").items([
            MenuItem::action("Open Repository…", OpenRepository),
            MenuItem::action("Clone Repository…", CloneRepository),
            MenuItem::separator(),
            MenuItem::action("Quit", QuitApp),
        ]),
        // Repository 菜单：Git 操作 —— Git operations
        Menu::new("Repository").items([
            MenuItem::action("Fetch", MenuFetch).disabled(!has_repo),
            MenuItem::action("Pull", MenuPull).disabled(!has_repo),
            MenuItem::action("Push", MenuPush).disabled(!has_repo),
        ]),
    ]
}
