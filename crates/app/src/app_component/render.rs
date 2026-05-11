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
use gpui_component::*;

use crate::app::ViewType;
use crate::views::{
    StatusBar, TitleBar, render_branches_view, render_commit_view, render_diff_view,
    render_history_view, render_project_sidebar,
};

use super::OpenGitApp;

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

        // 工作空间数据 —— Workspace data for sidebar
        let ws_entries = state.workspace.entries.clone();
        let ws_statuses = state.workspace.entry_statuses.clone();
        let ws_active_index = state.workspace.active_index;
        let ws_active_path = state.workspace.active_path().cloned();
        let _ = state;

        let clone_url_input = self.clone_url_input.clone();
        let recent_repos = self.settings.recent_repos.clone();

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
            .child(if has_repo {
                // ---- 仓库视图：项目侧边栏 + 内容面板 —— Repo view: project sidebar + content ---- //
                div()
                    .flex_1()
                    .flex()
                    .min_h_0()
                    .min_w_0()
                    .child(
                        div().flex_1().min_w_0().min_h_0().child(
                            h_resizable("opengit-main-split")
                                // ---- 左侧项目侧边栏 —— Left project sidebar ---- //
                                .child(
                                    resizable_panel()
                                        .size(px(200.))
                                        .size_range(px(140.)..px(360.))
                                        .flex_none()
                                        .child(render_project_sidebar(
                                            &ws_entries,
                                            &ws_statuses,
                                            ws_active_index,
                                            ws_active_path.as_ref(),
                                            "",
                                            weak_self.clone(),
                                        )),
                                )
                                // ---- 右侧内容面板 —— Right content panel ---- //
                                .child(
                                    resizable_panel().child(
                                        div()
                                            .flex_1()
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
                                                    )),
                                            )
                                            // 主视图内容 —— Main view content
                                            .child(
                                                div()
                                                    .flex_1()
                                                    .min_h_0()
                                                    .min_w_0()
                                                    .p_4()
                                                    .v_flex()
                                                    .gap_3()
                                                    .child(match active_view {
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
                                                        ViewType::History => render_history_view(
                                                            &history,
                                                            selected_hist,
                                                            weak_state.clone(),
                                                        ),
                                                        ViewType::Branches => render_branches_view(
                                                            &branches,
                                                            &self.branch_name_input,
                                                            weak_state.clone(),
                                                        ),
                                                        ViewType::Diff => render_diff_view(
                                                            diff_path.as_ref(),
                                                            staged_diff_path.as_ref(),
                                                            diff_preview.as_ref(),
                                                        ),
                                                        _ => div()
                                                            .child("Not implemented")
                                                            .into_any_element(),
                                                    }),
                                            ),
                                    ),
                                ),
                        ),
                    )
                    .into_any_element()
            } else {
                // ---- 欢迎页 —— Welcome page ---- //
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
                                                let wo_clone = wo;
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
                    .when(!recent_repos.is_empty(), |container: Div| {
                        let wo_recent = weak_self.clone();
                        container.child(
                            div()
                                .mt_8()
                                .flex()
                                .flex_col()
                                .gap_2()
                                .w(px(400.))
                                .child(
                                    div()
                                        .text_sm()
                                        .text_color(gpui::rgb(0x888888))
                                        .child("Recent Repositories"),
                                )
                                .child(div().v_flex().gap_2().children(recent_repos.iter().map(
                                    |r| {
                                        let path = r.path.clone();
                                        let w = wo_recent.clone();
                                        Button::new(gpui::SharedString::from(format!(
                                            "recent-{}",
                                            r.path.display()
                                        )))
                                        .label(r.name.clone())
                                        .secondary()
                                        .w_full()
                                        .on_click(
                                            move |_, _, cx| {
                                                let p = path.clone();
                                                let _ = w.update(cx, |app, cx| {
                                                    app.open_repo_to_workspace(cx, p.clone());
                                                });
                                            },
                                        )
                                    },
                                ))),
                        )
                    })
                    .into_any_element()
            })
            .child(status_bar)
    }
}
