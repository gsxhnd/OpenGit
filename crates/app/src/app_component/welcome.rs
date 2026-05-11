//! 欢迎页渲染 —— Welcome page rendering
//!
//! 当没有打开的仓库时，显示欢迎页：
//! - 应用名称和描述
//! - "Open Repository" 按钮
//! - 克隆仓库输入框
//! - 最近打开的仓库列表
//!
//! Displays welcome page when no repository is open:
//! app name, Open Repository button, clone input, and recent repos list.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::StyledExt;

use crate::settings::RecentRepo;

use super::OpenGitApp;

/// 渲染欢迎页 —— Render welcome page
pub fn render_welcome_page(
    clone_url_input: &Entity<InputState>,
    recent_repos: &[RecentRepo],
    weak_self: WeakEntity<OpenGitApp>,
) -> AnyElement {
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
                                .child(Input::new(clone_url_input).flex_1())
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
                    .child(
                        div()
                            .v_flex()
                            .gap_2()
                            .children(recent_repos.iter().map(|r| {
                                let path = r.path.clone();
                                let w = wo_recent.clone();
                                Button::new(gpui::SharedString::from(format!(
                                    "recent-{}",
                                    r.path.display()
                                )))
                                .label(r.name.clone())
                                .secondary()
                                .w_full()
                                .on_click(move |_, _, cx| {
                                    let p = path.clone();
                                    let _ = w.update(cx, |app, cx| {
                                        app.open_repo_to_workspace(cx, p.clone());
                                    });
                                })
                            })),
                    ),
            )
        })
        .into_any_element()
}
