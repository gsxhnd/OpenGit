//! 主应用组件 —— Main application component
//!
//! `OpenGitApp` 是 GPUI 框架下的顶层 Entity，负责：
//! 1. 应用生命周期管理（菜单同步、仓库打开/关闭）
//! 2. 视图切换（Commit / History / Branches / Diff）
//! 3. 动作分发（菜单操作 → AppState 方法调用）
//! 4. UI 渲染（欢迎页 vs 仓库视图、面板布局等）
//!
//! Uses GPUI Entity pattern as the root component managing lifecycle, view switching,
//! action dispatching, and top-level UI rendering.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::menu::AppMenuBar;
use gpui_component::resizable::{h_resizable, resizable_panel};
use gpui_component::*;
use std::path::PathBuf;

use crate::app::{AppState, ViewType};
use crate::menu::build_open_git_menus;
use crate::views::{
    render_branches_view, render_commit_view, render_diff_view, render_history_view, StatusBar,
    TitleBar,
};

// ============================================================================
// 动作定义 —— Action definitions
// ============================================================================
// 使用 gpui 的 `actions!` 宏声明应用级别的动作类型，
// 每个动作对应一个菜单项或快捷键操作。
//
// Defines app-level actions using gpui's `actions!` macro.
actions!(open_git, [OpenRepository, CloneRepository, QuitApp, MenuFetch, MenuPull, MenuPush]);

/// 窗口标题栏配置 —— Window titlebar options
///
/// 在 macOS 上，交通灯按钮被移到左侧以留出自定义标题栏空间。
/// 在 Linux 上使用客户端装饰（CSD）。
///
/// On macOS, traffic lights are shifted left to make room for custom chrome.
/// On Linux, uses client-side decorations.
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

/// OpenGit 主应用实体 —— OpenGit main application entity
///
/// 持有以下状态：
/// - `app_state`：仓库状态和业务逻辑
/// - `active_view`：当前活跃的视图标签
/// - `commit_message`：提交消息输入框
/// - `branch_name_input`：新分支名输入框
/// - `clone_url_input`：克隆仓库 URL 输入框
/// - `app_menu_bar`：菜单栏组件
/// - `_menu_sync`：菜单自动同步订阅（观察 AppState 变化）
///
/// Holds app state, active view tab, input fields, menu bar, and menu sync subscription.
pub struct OpenGitApp {
    /// 应用状态实体 —— Application state entity
    pub app_state: Entity<AppState>,
    /// 当前活跃视图 —— Currently active view tab
    pub active_view: ViewType,
    /// 提交消息输入框 —— Commit message input
    pub commit_message: Entity<InputState>,
    /// 新分支名输入框 —— New branch name input
    pub branch_name_input: Entity<InputState>,
    /// 克隆 URL 输入框 —— Clone URL input
    pub clone_url_input: Entity<InputState>,
    /// 菜单栏组件 —— Menu bar component
    pub app_menu_bar: Entity<AppMenuBar>,
    /// 菜单同步订阅（观察 AppState 变化以更新菜单状态） —— Subscription observing AppState for menu sync
    _menu_sync: Subscription,
}

impl OpenGitApp {
    /// 创建新的应用实例 —— Create new application instance
    ///
    /// 初始化所有输入框、菜单栏，并绑定快捷键（Cmd+O / Ctrl+O 打开仓库）。
    ///
    /// Initializes input fields, menu bar, and keyboard shortcuts.
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let app_state = cx.new(|_| AppState::new());
        let app_menu_bar = AppMenuBar::new(cx);

        // 订阅 AppState 变化以自动同步菜单状态 —— Subscribe to AppState changes for auto menu sync
        let _menu_sync = cx.observe(&app_state, |this, _, cx| {
            this.sync_app_menus(cx);
        });

        // 初始化提交消息输入框（多行输入） —— Initialize multi-line commit message input
        let commit_message = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Commit message…")
                .multi_line(true)
        });

        // 初始化分支名输入框 —— Initialize branch name input
        let branch_name_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("New branch name…"));

        // 初始化克隆 URL 输入框 —— Initialize clone URL input
        let clone_url_input =
            cx.new(|cx| {
                InputState::new(window, cx).placeholder("https://github.com/user/repo.git")
            });

        // 绑定快捷键 —— Bind keyboard shortcuts
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

    /// 同步菜单状态 —— Sync menu enabled/disabled state
    ///
    /// 根据是否有打开的仓库，启用或禁用 Repository 菜单项。
    ///
    /// Enables/disables Repository menu items based on whether a repo is open.
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

    // ========================================================================
    // 菜单动作处理器 —— Menu action handlers
    // ========================================================================

    /// 弹出文件选择对话框打开仓库 —— Prompt to open a repository
    ///
    /// 使用异步文件对话框让用户选择 Git 仓库目录。
    /// 选择后通过 `spawn` 在线程池中打开仓库，避免阻塞 UI。
    ///
    /// Opens a file dialog asynchronously and loads the repo on a background task.
    fn prompt_open_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let paths = cx.prompt_for_paths(PathPromptOptions {
            files: false,
            directories: true,
            multiple: false,
            prompt: Some("Select a Git repository folder".into()),
        });
        let ws = self.app_state.clone();
        let wo = cx.entity().downgrade();
        window
            .spawn(cx, async move |async_cx| {
                let picked = paths
                    .await
                    .ok()
                    .and_then(|r| r.ok())
                    .flatten()
                    .and_then(|v| v.into_iter().next());
                if let Some(path) = picked {
                    // 在主线程上更新状态 —— Update state on the main thread
                    let _ = async_cx.update(|_w, app| {
                        let _ = ws.update(app, |st, cx| {
                            if let Err(e) = st.open_repository(path) {
                                st.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                        let _ = wo.update(app, |_o, cx| {
                            cx.notify();
                        });
                    });
                }
                None::<()>
            })
            .detach();
    }

    /// 处理"打开仓库"菜单动作 —— Handle OpenRepository menu action
    fn on_menu_open_repository(
        &mut self,
        _: &OpenRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_open_repository(window, cx);
    }

    /// 处理"克隆仓库"菜单动作 —— Handle CloneRepository menu action
    fn on_menu_clone_repository(
        &mut self,
        _: &CloneRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_clone_repository(window, cx);
    }

    /// 弹窗引导克隆仓库 —— Prompt to clone a repository
    ///
    /// 读取输入框中的 URL，验证非空后弹出目录选择对话框。
    /// 从 URL 中提取仓库名作为本地目录名。
    ///
    /// Reads URL from input, validates, opens directory picker, extracts repo name from URL.
    fn prompt_clone_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let url = self.clone_url_input.read(cx).value().to_string();
        if url.trim().is_empty() {
            let _ = self.app_state.update(cx, |s, cx| {
                s.set_error("Please enter a repository URL to clone".into());
                cx.notify();
            });
            return;
        }
        let url = url.trim().to_string();
        let ws = self.app_state.clone();
        let wo = cx.entity().downgrade();
        let paths = cx.prompt_for_paths(PathPromptOptions {
            files: false,
            directories: true,
            multiple: false,
            prompt: Some(format!("Select parent directory to clone {} into", url).into()),
        });
        window
            .spawn(cx, async move |async_cx| {
                let picked = paths
                    .await
                    .ok()
                    .and_then(|r| r.ok())
                    .flatten()
                    .and_then(|v| v.into_iter().next());
                if let Some(parent_dir) = picked {
                    // 从 URL 提取仓库名作为目标目录 —— Extract repo name from URL as target dir
                    let repo_name = url
                        .rsplit('/')
                        .next()
                        .unwrap_or(&url)
                        .trim_end_matches(".git");
                    let target = parent_dir.join(repo_name);
                    let _ = async_cx.update(|_w, app| {
                        let _ = ws.update(app, |st, cx| {
                            if let Err(e) = st.clone_repository(&url, target) {
                                st.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                        let _ = wo.update(app, |_o, cx| {
                            cx.notify();
                        });
                    });
                }
                None::<()>
            })
            .detach();
    }

    /// 处理"退出"动作 —— Handle Quit action
    fn on_menu_quit(&mut self, _: &QuitApp, _: &mut Window, cx: &mut Context<Self>) {
        cx.quit();
    }

    /// 处理 Fetch 动作 —— Handle Fetch action
    ///
    /// 从 origin 远程获取最新数据。fetch 结果可通过后续 refresh_status 查看。
    ///
    /// Fetches from origin remote.
    fn on_menu_fetch(&mut self, _: &MenuFetch, _: &mut Window, cx: &mut Context<Self>) {
        let _ = self.app_state.update(cx, |s, cx| {
            if s.repository.is_none() {
                return;
            }
            if let Err(e) = s.fetch_origin() {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    /// 处理 Pull 动作 —— Handle Pull action
    ///
    /// 从 origin 拉取当前分支并自动合并。
    ///
    /// Pulls current branch from origin with auto-merge.
    fn on_menu_pull(&mut self, _: &MenuPull, _: &mut Window, cx: &mut Context<Self>) {
        let branch = self
            .app_state
            .read(cx)
            .repo_status
            .status
            .current_branch
            .clone();
        let Some(branch) = branch else {
            return;
        };
        let _ = self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.pull_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    /// 处理 Push 动作 —— Handle Push action
    ///
    /// 推送当前分支到 origin 远程。
    ///
    /// Pushes current branch to origin remote.
    fn on_menu_push(&mut self, _: &MenuPush, _: &mut Window, cx: &mut Context<Self>) {
        let branch = self
            .app_state
            .read(cx)
            .repo_status
            .status
            .current_branch
            .clone();
        let Some(branch) = branch else {
            return;
        };
        let _ = self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.push_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }
}

// ============================================================================
// 标签按钮渲染 —— Tab button renderer
// ============================================================================

/// 渲染视图标签按钮 —— Render view tab button
///
/// 根据当前激活的视图类型高亮对应的按钮。
/// 点击按钮切换 `active_view` 并触发重绘。
///
/// Highlights the active tab button. Clicking switches `active_view` and triggers re-render.
fn render_tab_button(
    id: &'static str,
    label: &'static str,
    view_type: ViewType,
    current_view: ViewType,
    cx: &mut Context<OpenGitApp>,
) -> impl IntoElement {
    use gpui::Styled as _;

    let is_active = current_view == view_type;
    let weak_self = cx.entity().downgrade();

    let button = Button::new(id).label(label).on_click(move |_, _, cx| {
        let _ = weak_self.update(cx, |app, cx| {
            app.active_view = view_type;
            cx.notify();
        });
    });

    if is_active {
        button.primary().w_full()
    } else {
        button.secondary().w_full()
    }
}

// ============================================================================
// Render 实现 —— Render implementation
// ============================================================================

impl Render for OpenGitApp {
    /// 渲染整个应用 UI —— Render the full application UI
    ///
    /// UI 结构（从上到下）： —— UI structure (top to bottom):
    /// 1. 标题栏（菜单 + 仓库名 + Fetch/Pull/Push 按钮 + 窗口控制按钮）
    /// 2. 错误横幅（如果有错误）
    /// 3. 主内容区：
    ///    - 无仓库时：欢迎页（打开/克隆仓库入口）
    ///    - 有仓库时：左侧标签栏 + 右侧面板（可调整大小）
    /// 4. 底部状态栏
    ///
    /// Layout: title bar → error banner → main content (welcome or repo views) → status bar.
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let state = self.app_state.read(cx);
        let repo_name = state
            .repo_path
            .as_ref()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Repository".to_string());
        let current_branch = state
            .repo_status
            .status
            .current_branch
            .clone()
            .unwrap_or_else(|| "No branch".to_string());
        let changed_count = state.repo_status.status.unstaged_files.len()
            + state.repo_status.status.untracked_files.len();
        let staged_count = state.repo_status.status.staged_files.len();
        let has_repo = state.repository.is_some();
        let active_view = self.active_view;
        let ahead = state.repo_status.ahead;
        let behind = state.repo_status.behind;
        let err = state.error.clone();
        let unstaged = state.repo_status.status.unstaged_files.clone();
        let untracked = state.repo_status.status.untracked_files.clone();
        let staged = state.repo_status.status.staged_files.clone();
        let history = state.history_commits.clone();
        let selected_hist = state.selected_history;
        let branches = state.repo_status.branches.clone();
        let diff_preview = state.diff_preview.clone();
        let diff_path = state.selected_diff_path.clone();
        let amend = state.commit_amend;
        let clone_url_input = self.clone_url_input.clone();
        drop(state); // 释放读锁 —— Release read lock

        let weak_state = self.app_state.downgrade();
        let weak_self = cx.entity().downgrade();
        let app_entity = self.app_state.clone();

        // ============================
        // 标题栏 —— Title bar
        // ============================
        let title_bar = {
            let ws = weak_self.clone();
            let app = self.app_state.clone();
            let branch = current_branch.clone();
            TitleBar::new(repo_name, has_repo, self.app_menu_bar.clone())
                .on_open_repo(move |window, cx| {
                    let _ = ws.update(cx, |app, cx| {
                        app.prompt_open_repository(window, cx);
                    });
                })
                .on_fetch({
                    let a = app.clone();
                    move |_, cx| {
                        let _ = a.update(cx, |s, cx| {
                            if let Err(e) = s.fetch_origin() {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }
                })
                .on_pull({
                    let a = app.clone();
                    let b = branch.clone();
                    move |_, cx| {
                        let _ = a.update(cx, |s, cx| {
                            if let Err(e) = s.pull_origin(&b) {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }
                })
                .on_push({
                    let a = app;
                    let b = branch;
                    move |_, cx| {
                        let _ = a.update(cx, |s, cx| {
                            if let Err(e) = s.push_origin(&b) {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }
                })
        };

        // ============================
        // 状态栏 —— Status bar
        // ============================
        let status_bar = StatusBar::new(
            current_branch.clone(),
            ahead,
            behind,
            changed_count,
            staged_count,
        );

        // ============================
        // 完整布局 —— Full layout
        // ============================
        div()
            .v_flex()
            .size_full()
            // 注册所有菜单动作监听器 —— Register all menu action listeners
            .on_action(cx.listener(Self::on_menu_open_repository))
            .on_action(cx.listener(Self::on_menu_clone_repository))
            .on_action(cx.listener(Self::on_menu_quit))
            .on_action(cx.listener(Self::on_menu_fetch))
            .on_action(cx.listener(Self::on_menu_pull))
            .on_action(cx.listener(Self::on_menu_push))
            .bg(gpui::rgb(0x121212))
            .text_color(gpui::rgb(0xffffff))
            // 标题栏 —— Title bar
            .child(title_bar)
            // 错误横幅 —— Error banner (shown when error exists)
            .when_some(err, |col, e| {
                col.child(
                    div()
                        .w_full()
                        .px_4()
                        .py_2()
                        .bg(gpui::rgb(0x4a1515))
                        .text_sm()
                        .child(e),
                )
            })
            // 主内容区 —— Main content area
            .child(if has_repo {
                // ============================================================
                // 仓库视图（左侧标签 + 右侧内容） —— Repo view (tabs + content)
                // ============================================================
                div()
                    .flex_1()
                    .flex()
                    .min_h_0()
                    .min_w_0()
                    .child(
                        div()
                            .flex_1()
                            .min_w_0()
                            .min_h_0()
                            .child(
                                // 可调整大小的水平分栏 —— Horizontally resizable split
                                h_resizable("opengit-main-split")
                                    // 左侧标签面板 —— Left tab panel
                                    .child(
                                        resizable_panel()
                                            .size(px(250.))
                                            .size_range(px(160.)..px(560.))
                                            .flex_none()
                                            .child(
                                                div()
                                                    .h_full()
                                                    .min_w_0()
                                                    .bg(gpui::rgb(0x1e1e1e))
                                                    .border_r(px(1.))
                                                    .border_color(gpui::rgb(0x333333))
                                                    .p_2()
                                                    .v_flex()
                                                    .gap_1()
                                                    .child(render_tab_button(
                                                        "commit", "Commit",
                                                        ViewType::Commit,
                                                        active_view, cx,
                                                    ))
                                                    .child(render_tab_button(
                                                        "history", "History",
                                                        ViewType::History,
                                                        active_view, cx,
                                                    ))
                                                    .child(render_tab_button(
                                                        "branches", "Branches",
                                                        ViewType::Branches,
                                                        active_view, cx,
                                                    ))
                                                    .child(render_tab_button(
                                                        "diff", "Diff",
                                                        ViewType::Diff,
                                                        active_view, cx,
                                                    )),
                                            ),
                                    )
                                    // 右侧内容面板 —— Right content panel
                                    .child(resizable_panel().child(
                                        div()
                                            .flex_1()
                                            .min_h_0()
                                            .min_w_0()
                                            .p_4()
                                            .v_flex()
                                            .gap_3()
                                            .child(match active_view {
                                                ViewType::Commit => render_commit_view(
                                                    &unstaged, &untracked, &staged,
                                                    amend,
                                                    &self.commit_message,
                                                    app_entity.clone(),
                                                    weak_state.clone(),
                                                    weak_self.clone(),
                                                ),
                                                ViewType::History => render_history_view(
                                                    &history, selected_hist,
                                                    weak_state.clone(),
                                                ),
                                                ViewType::Branches => render_branches_view(
                                                    &branches,
                                                    &self.branch_name_input,
                                                    weak_state.clone(),
                                                ),
                                                ViewType::Diff => render_diff_view(
                                                    diff_path.as_ref(),
                                                    diff_preview.as_ref(),
                                                ),
                                                _ => div().child("Not implemented").into_any_element(),
                                            }),
                                    )),
                            ),
                    )
                    .into_any_element()
            } else {
                // ============================================================
                // 欢迎页（无仓库时） —— Welcome page (no repo open)
                // ============================================================
                let wo = weak_self.clone();
                div()
                    .flex_1()
                    .v_flex()
                    .gap_6()
                    .size_full()
                    .items_center()
                    .justify_center()
                    .p_4()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .items_center()
                            .gap_4()
                            .child(div().text_lg().child("Welcome to OpenGit"))
                            .child(
                                div()
                                    .text_color(gpui::rgb(0xcccccc))
                                    .child("A modern Git client built with Rust and GPUI"),
                            )
                            .child(
                                div()
                                    .text_color(gpui::rgb(0xaaaaaa))
                                    .child("Open a Git repository to get started"),
                            )
                            .child({
                                let wo_open = wo.clone();
                                Button::new("open-repo-welcome")
                                    .label("Open Repository")
                                    .primary()
                                    .on_click(move |_, window, cx| {
                                        let _ = wo_open.update(cx, |app, cx| {
                                            app.prompt_open_repository(window, cx);
                                        });
                                    })
                            })
                            .child(
                                div()
                                    .mt_4()
                                    .flex()
                                    .flex_col()
                                    .gap_2()
                                    .w(px(400.))
                                    .child(
                                        div()
                                            .text_sm()
                                            .text_color(gpui::rgb(0xcccccc))
                                            .child("Clone a remote repository"),
                                    )
                                    .child(
                                        div()
                                            .flex()
                                            .gap_2()
                                            .child(Input::new(&clone_url_input).flex_1())
                                            .child({
                                                let wo_clone = wo.clone();
                                                Button::new("clone-repo-btn")
                                                    .label("Clone")
                                                    .primary()
                                                    .on_click(move |_, window, cx| {
                                                        let _ = wo_clone.update(cx, |app, cx| {
                                                            app.prompt_clone_repository(window, cx);
                                                        });
                                                    })
                                            }),
                                    ),
                            ),
                    )
                    .into_any_element()
            })
            // 底部状态栏 —— Bottom status bar
            .child(status_bar)
    }
}
