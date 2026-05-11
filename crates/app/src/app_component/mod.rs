//! 主应用组件 —— Main application component
//!
//! `OpenGitApp` 是 GPUI 框架下的顶层 Entity，负责：
//! 1. 应用生命周期管理（菜单同步、仓库打开/关闭、窗口关闭保存配置）
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
mod welcome;

use gpui::*;
use gpui_component::GlobalState;
use gpui_component::input::InputState;
use gpui_component::menu::AppMenuBar;
use notify::Watcher as _;

use crate::app_state::{AppState, ViewType};
use crate::menu::build_open_git_menus;
use crate::settings::AppSettings;

// ============================================================================
// 动作定义 —— Action definitions
// ============================================================================

actions!(
    open_git,
    [
        OpenRepository,
        CloneRepository,
        QuitApp,
        MenuFetch,
        MenuPull,
        MenuPush
    ]
);

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
        traffic_light_position: Some(point(px(12.), px(12.))),
        #[cfg(not(target_os = "macos"))]
        traffic_light_position: None,
    }
}

// ============================================================================
// OpenGitApp 主组件 —— Main component
// ============================================================================

pub struct OpenGitApp {
    pub app_state: Entity<AppState>,
    pub settings: AppSettings,
    pub active_view: ViewType,
    pub commit_message: Entity<InputState>,
    pub branch_name_input: Entity<InputState>,
    pub clone_url_input: Entity<InputState>,
    pub project_search_input: Entity<InputState>,
    pub tag_name_input: Entity<InputState>,
    pub tag_message_input: Entity<InputState>,
    pub remote_name_input: Entity<InputState>,
    pub remote_url_input: Entity<InputState>,
    pub app_menu_bar: Entity<AppMenuBar>,
    _menu_sync: Subscription,
    /// 文件系统监听器 —— Filesystem watcher for auto-refresh
    #[allow(dead_code)]
    _file_watcher: Option<notify::RecommendedWatcher>,
    /// 文件系统事件队列（共享） —— File event queue (shared)
    file_events: std::sync::Arc<std::sync::Mutex<Vec<notify::Event>>>,
    /// 上次自动刷新时间（防抖） —— Last auto-refresh time for debounce
    last_file_refresh: std::time::Instant,
}

impl OpenGitApp {
    pub fn new(window: &mut Window, cx: &mut Context<Self>, settings: AppSettings) -> Self {
        let ws = settings.workspace.clone();
        let app_state = cx.new(|_| {
            AppState::new_with_workspace(ws.entries.clone(), ws.groups.clone(), ws.active_index)
        });

        // 恢复上次活跃项目 —— Restore last active project
        if !ws.entries.is_empty() && ws.active_index < ws.entries.len() {
            let last_path = ws.entries[ws.active_index].path.clone();
            app_state.update(cx, |s, cx| {
                if let Err(e) = s.open_repository(last_path) {
                    s.set_error(e.to_string());
                }
                cx.notify();
            });
        }
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

        let clone_url_input = cx
            .new(|cx| InputState::new(window, cx).placeholder("https://github.com/user/repo.git"));

        let project_search_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("Search projects…"));

        let tag_name_input = cx.new(|cx| InputState::new(window, cx).placeholder("v1.0.0"));
        let tag_message_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("Tag message (optional)…"));

        let remote_name_input = cx.new(|cx| InputState::new(window, cx).placeholder("origin"));
        let remote_url_input = cx
            .new(|cx| InputState::new(window, cx).placeholder("https://github.com/user/repo.git"));

        cx.bind_keys([
            KeyBinding::new("cmd-o", OpenRepository, None),
            KeyBinding::new("ctrl-o", OpenRepository, None),
        ]);

        let mut this = Self {
            app_state,
            settings,
            active_view: ViewType::Commit,
            commit_message,
            branch_name_input,
            clone_url_input,
            project_search_input,
            tag_name_input,
            tag_message_input,
            remote_name_input,
            remote_url_input,
            app_menu_bar,
            _menu_sync,
            _file_watcher: None,
            file_events: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            last_file_refresh: std::time::Instant::now(),
        };
        this.sync_app_menus(cx);
        this.setup_file_watcher(cx);
        this
    }

    pub fn save_settings(&mut self, cx: &mut Context<Self>) {
        self.app_state.read(cx).sync_to_settings(&mut self.settings);
        if let Err(e) = self.settings.save() {
            tracing::error!("Failed to save settings: {}", e);
        }
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

    /// 设置文件系统监听器 —— Setup filesystem watcher for auto-refresh
    ///
    /// 监听当前仓库目录的文件变化，将事件存入共享队列。
    /// 在 Render 中检查队列并防抖刷新仓库状态。
    /// 忽略 `.git` 目录内的事件以减少噪音。
    pub fn setup_file_watcher(&mut self, cx: &mut Context<Self>) {
        let Some(repo_path) = self.app_state.read(cx).repo_path.clone() else {
            self._file_watcher = None;
            return;
        };

        let events = std::sync::Arc::new(std::sync::Mutex::new(Vec::new()));
        let events_clone = events.clone();
        let mut watcher =
            match notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
                if let Ok(event) = res {
                    // 忽略 .git 目录内的事件 —— Ignore .git directory events
                    let is_git_internal = event.paths.iter().any(|p| {
                        p.components()
                            .any(|c| c.as_os_str().to_string_lossy().starts_with(".git"))
                    });
                    if !is_git_internal {
                        events_clone.lock().unwrap().push(event);
                    }
                }
            }) {
                Ok(w) => w,
                Err(e) => {
                    tracing::error!("Failed to create file watcher: {}", e);
                    return;
                }
            };

        if let Err(e) = watcher.watch(&repo_path, notify::RecursiveMode::Recursive) {
            tracing::error!("Failed to watch repository: {}", e);
            return;
        }

        self._file_watcher = Some(watcher);
        self.file_events = events;
        self.last_file_refresh = std::time::Instant::now();
    }

    /// 处理文件系统事件队列并刷新状态 —— Process file events and refresh status
    pub fn process_file_events(&mut self, cx: &mut Context<Self>) {
        let has_events = {
            let mut events = self.file_events.lock().unwrap();
            let has = !events.is_empty();
            events.clear();
            has
        };
        if has_events {
            let now = std::time::Instant::now();
            if now.duration_since(self.last_file_refresh).as_millis() >= 500 {
                self.last_file_refresh = now;
                self.app_state.update(cx, |state, cx| {
                    if state.repository.is_some() {
                        if let Err(e) = state.refresh_status() {
                            tracing::warn!("Auto-refresh failed: {}", e);
                        } else {
                            tracing::debug!("Auto-refreshed repository status from file events");
                        }
                        cx.notify();
                    }
                });
            }
        }
    }
}
