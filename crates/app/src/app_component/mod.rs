//! 主应用组件 —— Main application component
//!
//! `OpenGitApp` 是 GPUI 框架下的顶层 Entity，负责：
//! 1. 应用生命周期管理（菜单同步、仓库打开/关闭）
//! 2. 视图切换（Commit / History / Branches / Diff）
//! 3. 动作分发（菜单操作 → AppState 方法调用）
//! 4. UI 渲染（欢迎页 vs 仓库视图、面板布局等）
//!
//! 实现分散在多个子模块中：
//! - `handlers.rs`：菜单动作处理器
//! - `render.rs`：Render trait 实现 + 标签按钮
//!
//! Uses GPUI Entity pattern as the root component managing lifecycle, view switching,
//! action dispatching, and top-level UI rendering.

mod handlers;
mod render;

use gpui::*;
use gpui_component::input::InputState;
use gpui_component::menu::AppMenuBar;
use gpui_component::GlobalState;

use crate::app::{AppState, ViewType};
use crate::menu::build_open_git_menus;

// ============================================================================
// 动作定义 —— Action definitions
// ============================================================================

actions!(open_git, [OpenRepository, CloneRepository, QuitApp, MenuFetch, MenuPull, MenuPush]);

/// 窗口标题栏配置 —— Window titlebar options
///
/// - macOS / Linux: hides system titlebar for custom-drawn chrome
///   Linux uses Client decorations via window_border for resize
/// - Windows: hides system titlebar, resize via native WS_THICKFRAME + WM_NCHITTEST
///   Uses AppRoot (no window_border) to avoid interfering with native edge events
pub fn opengit_titlebar_options() -> TitlebarOptions {
    TitlebarOptions {
        title: Some("OpenGit".into()),
        appears_transparent: true,
        #[cfg(target_os = "macos")]
        traffic_light_position: Some(point(px(-200.), px(12.))),
        #[cfg(not(target_os = "macos"))]
        traffic_light_position: None,
    }
}

// ============================================================================
// OpenGitApp 主组件 —— Main component
// ============================================================================

pub struct OpenGitApp {
    pub app_state: Entity<AppState>,
    pub active_view: ViewType,
    pub commit_message: Entity<InputState>,
    pub branch_name_input: Entity<InputState>,
    pub clone_url_input: Entity<InputState>,
    pub app_menu_bar: Entity<AppMenuBar>,
    _menu_sync: Subscription,
}

impl OpenGitApp {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let app_state = cx.new(|_| AppState::new());
        let app_menu_bar = AppMenuBar::new(cx);

        let _menu_sync = cx.observe(&app_state, |this, _, cx| {
            this.sync_app_menus(cx);
        });

        let commit_message = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Commit message…")
                .multi_line(true)
        });

        let branch_name_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("New branch name…"));

        let clone_url_input =
            cx.new(|cx| {
                InputState::new(window, cx).placeholder("https://github.com/user/repo.git")
            });

        cx.bind_keys([
            KeyBinding::new("cmd-o", OpenRepository, None),
            KeyBinding::new("ctrl-o", OpenRepository, None),
        ]);

        let mut this = Self {
            app_state,
            active_view: ViewType::Commit,
            commit_message,
            branch_name_input,
            clone_url_input,
            app_menu_bar,
            _menu_sync,
        };
        this.sync_app_menus(cx);
        this
    }

    fn sync_app_menus(&mut self, cx: &mut Context<Self>) {
        let has_repo = self.app_state.read(cx).repository.is_some();
        let owned: Vec<OwnedMenu> = build_open_git_menus(has_repo)
            .into_iter()
            .map(|m| m.owned())
            .collect();
        GlobalState::global_mut(cx).set_app_menus(owned);
        self.app_menu_bar.update(cx, |bar, cx| {
            bar.reload(cx);
        });
    }
}
