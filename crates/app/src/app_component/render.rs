//! 渲染实现 —— Render implementation
//!
//! 包含 `OpenGitApp` 的 Render trait 实现和辅助函数。
//! 负责构建完整的应用 UI 树：标题栏 → 错误横幅 → 主内容区（项目侧边栏 + 内容面板） → 状态栏。
//! Phase 3: 多项目工作空间布局。
//!
//! Contains Render trait impl for OpenGitApp and helper functions.
//! Builds the full UI tree: title bar → error banner → main content → status bar.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::Input;
use gpui_component::resizable::{h_resizable, resizable_panel};
use gpui_component::scroll::ScrollableElement as _;
use gpui_component::*;

use crate::app_state::ViewType;
use crate::views::{
    StatusBar, TitleBar, render_branches_view, render_commit_view, render_diff_view,
    render_history_view, render_project_sidebar, render_stash_view, render_tag_view,
};

use super::OpenGitApp;
use super::welcome::render_welcome_page;

/// 渲染视图标签按钮 —— Render view tab button (horizontal, for content area)
fn render_content_tab(
    id: &'static str,
    label: &'static str,
    view_type: ViewType,
    current_view: ViewType,
    cx: &mut Context<OpenGitApp>,
) -> impl IntoElement {
    let is_active = current_view == view_type;
    let weak_self = cx.entity().downgrade();

    let button = Button::new(id)
        .label(label)
        .small()
        .on_click(move |_, _, cx| {
            let _ = weak_self.update(cx, |app, cx| {
                app.active_view = view_type;
                cx.notify();
            });
        });

    if is_active {
        button.primary()
    } else {
        button.secondary()
    }
}

impl Render for OpenGitApp {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        // 处理文件系统事件 —— Process filesystem events for auto-refresh
        self.process_file_events(cx);

        // 清理过期 toast —— Clean up expired toasts
        self.app_state.update(cx, |s, _cx| {
            s.expire_toasts();
        });

        // ========================================================================
        // 阶段 1：从 AppState 提取所有数据 —— Extract all data from AppState
        // ========================================================================
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
        let staged_diff_path = state.selected_staged_diff_path.clone();
        let current_op = state.current_operation.clone();
        let amend = state.commit_amend;
        let stash_list = state.stash_list.clone();
        let tag_list = state.tag_list.clone();
        let remote_list = state.remote_list.clone();

        // 工作空间数据 —— Workspace data for sidebar
        let ws_entries = state.workspace.entries.clone();
        let ws_statuses = state.workspace.entry_statuses.clone();
        let ws_active_index = state.workspace.active_index;
        let ws_active_path = state.workspace.active_path().cloned();
        let _ = state;

        let clone_url_input = self.clone_url_input.clone();
        let recent_repos = self.settings.recent_repos.clone();
        let project_search_input = self.project_search_input.clone();
        let search_query = self.project_search_input.read(cx).value().to_string();

        let weak_state = self.app_state.downgrade();
        let weak_self = cx.entity().downgrade();
        let app_entity = self.app_state.clone();

        // ========================================================================
        // 阶段 2：构建 UI 子组件 —— Build UI sub-components
        // ========================================================================

        // 标题栏 —— Title bar
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
                        a.update(cx, |s, cx| {
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
                        a.update(cx, |s, cx| {
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
                        a.update(cx, |s, cx| {
                            if let Err(e) = s.push_origin(&b) {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }
                })
        };

        // 状态栏 —— Status bar
        let status_bar = StatusBar::new(
            current_branch.clone(),
            ahead,
            behind,
            changed_count,
            staged_count,
            current_op,
        );

        // ========================================================================
        // 阶段 3：组装完整的应用 UI 树 —— Assemble full UI tree
        // ========================================================================
        div()
            .v_flex()
            .size_full()
            .relative()
            .on_action(cx.listener(Self::on_menu_open_repository))
            .on_action(cx.listener(Self::on_menu_clone_repository))
            .on_action(cx.listener(Self::on_menu_quit))
            .on_action(cx.listener(Self::on_menu_fetch))
            .on_action(cx.listener(Self::on_menu_pull))
            .on_action(cx.listener(Self::on_menu_push))
            .bg(gpui::rgb(0x121212))
            .text_color(gpui::rgb(0xffffff))
            .child(title_bar)
            .when_some(err, |col: Div, e: String| {
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
            // ---- Toast 通知区域 —— Toast notification area ---- //
            .child({
                let toasts = self.app_state.read(cx).toasts.clone();
                div()
                    .absolute()
                    .bottom(px(48.))
                    .right(px(16.))
                    .v_flex()
                    .gap_2()
                    .children(toasts.into_iter().map(|t| {
                        let (bg, border) = match t.kind {
                            crate::app_state::ToastKind::Success => {
                                (gpui::rgb(0x1a3a1a), gpui::rgb(0x4caf50))
                            }
                            crate::app_state::ToastKind::Error => {
                                (gpui::rgb(0x3a1a1a), gpui::rgb(0xe57373))
                            }
                            crate::app_state::ToastKind::Info => {
                                (gpui::rgb(0x1a1a3a), gpui::rgb(0x64b5f6))
                            }
                        };
                        div()
                            .px_3()
                            .py_2()
                            .rounded(px(4.))
                            .bg(bg)
                            .border(px(1.))
                            .border_color(border)
                            .text_sm()
                            .child(t.message)
                    }))
            })
            .child(if has_repo {
                // ---- 仓库视图：项目侧边栏 + 内容面板 —— Repo view: project sidebar + content ---- //
                div()
                    .flex_1()
                    .flex()
                    .min_h_0()
                    .min_w_0()
                    .child(
                        h_resizable("opengit-main-split")
                            // ---- 左侧项目侧边栏 —— Left project sidebar ---- //
                            .child(
                                resizable_panel()
                                    .size(px(200.))
                                    .size_range(px(140.)..px(360.))
                                    .flex_none()
                                    .child(
                                        div()
                                            .size_full()
                                            .min_w_0()
                                            .v_flex()
                                            .gap_2()
                                            .bg(gpui::rgb(0x161616))
                                            .border_r(px(1.))
                                            .border_color(gpui::rgb(0x333333))
                                            .p_2()
                                            // ---- 搜索框 —— Search input ---- //
                                            .child(Input::new(&project_search_input).w_full())
                                            .child(render_project_sidebar(
                                                &ws_entries,
                                                &ws_statuses,
                                                ws_active_index,
                                                ws_active_path.as_ref(),
                                                &search_query,
                                                weak_self.clone(),
                                            )),
                                    ),
                            )
                            // ---- 右侧内容面板 —— Right content panel ---- //
                            .child(
                                resizable_panel().size_range(px(100.)..Pixels::MAX).child(
                                    div()
                                        .size_full()
                                        .min_h_0()
                                        .min_w_0()
                                        .v_flex()
                                        // 视图标签栏 —— View tab bar
                                        .child(
                                            div()
                                                .flex()
                                                .gap_1()
                                                .p_2()
                                                .bg(gpui::rgb(0x1a1a1a))
                                                .border_b(px(1.))
                                                .border_color(gpui::rgb(0x333333))
                                                .child(render_content_tab(
                                                    "commit",
                                                    "Commit",
                                                    ViewType::Commit,
                                                    active_view,
                                                    cx,
                                                ))
                                                .child(render_content_tab(
                                                    "history",
                                                    "History",
                                                    ViewType::History,
                                                    active_view,
                                                    cx,
                                                ))
                                                .child(render_content_tab(
                                                    "branches",
                                                    "Branches",
                                                    ViewType::Branches,
                                                    active_view,
                                                    cx,
                                                ))
                                                .child(render_content_tab(
                                                    "diff",
                                                    "Diff",
                                                    ViewType::Diff,
                                                    active_view,
                                                    cx,
                                                ))
                                                .child(render_content_tab(
                                                    "stash",
                                                    "Stash",
                                                    ViewType::Stash,
                                                    active_view,
                                                    cx,
                                                ))
                                                .child(render_content_tab(
                                                    "tags",
                                                    "Tags",
                                                    ViewType::Tags,
                                                    active_view,
                                                    cx,
                                                )),
                                        )
                                        // 主视图内容 —— Main view content
                                        .child(
                                            div()
                                                .flex_1()
                                                .min_h_0()
                                                .min_w_0()
                                                .overflow_y_scrollbar()
                                                .child(
                                                    div().p_4().v_flex().gap_3().child(
                                                        match active_view {
                                                            ViewType::Commit => render_commit_view(
                                                                &unstaged,
                                                                &untracked,
                                                                &staged,
                                                                amend,
                                                                &self.commit_message,
                                                                app_entity.clone(),
                                                                weak_state.clone(),
                                                                weak_self.clone(),
                                                            ),
                                                            ViewType::History => {
                                                                render_history_view(
                                                                    &history,
                                                                    selected_hist,
                                                                    weak_state.clone(),
                                                                )
                                                            }
                                                            ViewType::Branches => {
                                                                render_branches_view(
                                                                    &branches,
                                                                    &remote_list,
                                                                    &self.branch_name_input,
                                                                    &self.remote_name_input,
                                                                    &self.remote_url_input,
                                                                    weak_state.clone(),
                                                                )
                                                            }
                                                            ViewType::Diff => render_diff_view(
                                                                diff_path.as_ref(),
                                                                staged_diff_path.as_ref(),
                                                                diff_preview.as_ref(),
                                                            ),
                                                            ViewType::Stash => render_stash_view(
                                                                &stash_list,
                                                                weak_state.clone(),
                                                            ),
                                                            ViewType::Tags => render_tag_view(
                                                                &tag_list,
                                                                &self.tag_name_input,
                                                                &self.tag_message_input,
                                                                weak_state.clone(),
                                                            ),
                                                            _ => div()
                                                                .child("Not implemented")
                                                                .into_any_element(),
                                                        },
                                                    ),
                                                ),
                                        ),
                                ),
                            ),
                    )
                    .into_any_element()
            } else {
                // ---- 欢迎页 —— Welcome page ---- //
                render_welcome_page(&clone_url_input, &recent_repos, weak_self.clone())
            })
            .child(status_bar)
    }
}
