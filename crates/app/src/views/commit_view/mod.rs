//! 提交视图 —— Commit view
//!
//! 显示工作区文件变更列表（unstaged / untracked / staged），
//! 提供 Stage/Unstage/Diff 操作按钮，以及提交消息输入和 amend 切换。
//!
//! ## 子模块 —— Sub-modules
//!
//! | 模块 | 功能 |
//! |------|------|
//! | `file_row` | 文件行组件（状态标签、操作按钮、Diff 按钮） |
//!
//! Displays working tree file changes with stage/unstage/diff actions,
//! commit message input, and amend toggle.

mod file_row;

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::FileEntry;

pub use file_row::{FileRowAction, file_status_label, render_file_row};
use file_row::{render_staged_file_row, render_unstaged_file_row};

/// 渲染提交视图 —— Render commit view
///
/// 布局结构：
/// 1. Unstaged 区域（未暂存文件 + 未跟踪文件）+ Stage All 按钮
/// 2. Staged 区域（已暂存文件）+ Unstage All 按钮
/// 3. 提交消息输入区域（含字符提示）
/// 4. 提交按钮 + Amend 切换
///
/// Layout: unstaged files → staged files → commit message → commit button + amend toggle.
#[allow(clippy::too_many_arguments)]
pub fn render_commit_view(
    unstaged: &[FileEntry],
    untracked: &[FileEntry],
    staged: &[FileEntry],
    amend: bool,
    commit_message: &Entity<InputState>,
    app_entity: Entity<AppState>,
    weak_state: WeakEntity<AppState>,
    weak_self: WeakEntity<crate::OpenGitApp>,
) -> AnyElement {
    let has_staged = !staged.is_empty();
    let has_unstaged = !unstaged.is_empty() || !untracked.is_empty();
    let has_any_changes = has_staged || has_unstaged;

    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- 空状态引导 —— Empty state guidance ---- //
        .when(!has_any_changes, |col: Div| {
            col.child(
                div()
                    .flex_1()
                    .min_h_0()
                    .v_flex()
                    .items_center()
                    .justify_center()
                    .gap_2()
                    .child(
                        div()
                            .text_sm()
                            .text_color(gpui::rgb(0x888888))
                            .child("No changes to commit"),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x666666))
                            .child("Modify files in your working tree to see them here"),
                    ),
            )
        })
        .when(has_any_changes, |col: Div| {
            col.child(
                div()
                    .text_xs()
                    .text_color(gpui::rgb(0xcccccc))
                    .child("Unstaged"),
            )
            .when(has_unstaged, |col: Div| {
                let ws = weak_state.clone();
                col.child(
                    Button::new("stage-all")
                        .label("Stage All")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.stage_all() {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        }),
                )
            })
            .child(
                div()
                    .flex_1()
                    .min_h_0()
                    .v_flex()
                    .gap_1()
                    .children(unstaged.iter().map(|e| {
                        render_unstaged_file_row("u", e, weak_state.clone(), weak_self.clone())
                    }))
                    .children(untracked.iter().map(|e| {
                        render_unstaged_file_row("n", e, weak_state.clone(), weak_self.clone())
                    })),
            )
            .child(
                div()
                    .text_xs()
                    .text_color(gpui::rgb(0xcccccc))
                    .child("Staged"),
            )
            .when(has_staged, |col: Div| {
                let ws = weak_state.clone();
                col.child(
                    Button::new("unstage-all")
                        .label("Unstage All")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.unstage_all() {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        }),
                )
            })
            .child(
                div().flex_1().min_h_0().v_flex().gap_1().children(
                    staged
                        .iter()
                        .map(|e| render_staged_file_row(e, weak_state.clone(), weak_self.clone())),
                ),
            )
        })
        // ---- 提交消息输入 ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Message"),
        )
        .child(Input::new(commit_message).w_full().h(px(100.)))
        // ---- 提交按钮 + Amend 切换 ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .child({
                    let app_e = app_entity.clone();
                    let msg_e = commit_message.clone();
                    Button::new("commit-btn")
                        .label("Commit")
                        .primary()
                        .on_click(move |_, window, cx| {
                            let msg = cx.read_entity(&msg_e, |i, _| i.value().to_string());
                            let staged_count = cx.read_entity(&app_e, |s, _| {
                                s.repo_status.status.staged_files.len()
                            });
                            if msg.trim().is_empty() {
                                app_e.update(cx, |s, cx| {
                                    s.set_error("Commit message is empty".into());
                                    cx.notify();
                                });
                                return;
                            }
                            if staged_count == 0 {
                                app_e.update(cx, |s, cx| {
                                    s.set_error("No staged files to commit".into());
                                    cx.notify();
                                });
                                return;
                            }
                            let amend = cx.read_entity(&app_e, |s, _| s.commit_amend);
                            app_e.update(cx, |s, cx| {
                                if let Err(e) = s.commit_staged(&msg, amend) {
                                    s.set_error(e.to_string());
                                    s.add_toast(
                                        format!("Commit failed: {}", e),
                                        crate::app_state::ToastKind::Error,
                                    );
                                    cx.notify();
                                    return;
                                }
                                s.add_toast(
                                    "Commit successful",
                                    crate::app_state::ToastKind::Success,
                                );
                                cx.notify();
                            });
                            if app_e.read(cx).error.is_none() {
                                msg_e.update(cx, |inp, cx| {
                                    inp.set_value("", window, cx);
                                });
                            }
                        })
                })
                .child({
                    let ws = weak_state.clone();
                    Button::new("amend-toggle")
                        .label(if amend { "Amend: on" } else { "Amend: off" })
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                s.commit_amend = !s.commit_amend;
                                cx.notify();
                            });
                        })
                }),
        )
        .child({
            div()
                .text_xs()
                .text_color(gpui::rgb(0x666666))
                .child("Tip: First line is the commit title (keep under 72 characters)")
        })
        .into_any_element()
}
