//! 分支管理视图 —— Branch management view
//!
//! 提供分支的创建和切换功能。
//! 列表显示所有本地分支，高亮当前 HEAD 分支，
//! 每个分支旁边有"Checkout"按钮用于切换。
//!
//! Provides branch creation and checkout. Lists local branches with HEAD highlighting
//! and "Checkout" buttons for switching.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app::AppState;
use ogit::{Branch, Remote};

/// 渲染分支管理视图 —— Render branch management view
///
/// 布局：
/// 1. 输入框 + "Create branch" 按钮
/// 2. 分支列表（HEAD 标记 + Checkout 按钮）
/// 3. Remote 列表（名称 + URL + Delete 按钮）
///
/// Layout: input + create button → branch list → remote list.
pub fn render_branches_view(
    branches: &[Branch],
    remotes: &[Remote],
    branch_name_input: &Entity<InputState>,
    remote_name_input: &Entity<InputState>,
    remote_url_input: &Entity<InputState>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- 创建分支区域 —— Branch creation area ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .child(Input::new(branch_name_input).flex_1())
                .child({
                    let ws = weak_state.clone();
                    let inp = branch_name_input.clone();
                    Button::new("new-branch")
                        .label("Create branch")
                        .primary()
                        .on_click(move |_, _, cx| {
                            let name = cx.read_entity(&inp, |i, _| i.value().to_string());
                            let _ = ws.update(cx, |s, cx| {
                                if name.trim().is_empty() {
                                    s.set_error("Branch name is empty".into());
                                } else if let Err(e) = s.create_branch(name.trim()) {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        })
                }),
        )
        // ---- 分支列表 —— Branch list ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .children(branches.iter().map(|b| {
                    let ws = weak_state.clone();
                    let nm = b.name.clone();
                    let cur = b.is_head;
                    div()
                        .flex()
                        .justify_between()
                        .items_center()
                        .p_2()
                        .rounded(px(2.))
                        .bg(gpui::rgb(0x1e1e1e))
                        .child(
                            div()
                                .flex()
                                .gap_2()
                                // HEAD 标记（青色标签） —— HEAD marker (cyan label)
                                .child(if cur {
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x4dd0e1))
                                        .child("HEAD")
                                } else {
                                    div().text_xs().child(" ")
                                })
                                .child(b.name.clone()),
                        )
                        // Checkout / Delete 按钮 —— Checkout and Delete buttons
                        .child(
                            div()
                                .flex()
                                .gap_1()
                                .child(
                                    Button::new(gpui::SharedString::from(format!("sw-{}", b.name)))
                                        .label("Checkout")
                                        .small()
                                        .on_click(move |_, _, cx| {
                                            let name = nm.clone();
                                            let _ = ws.update(cx, |s, cx| {
                                                if !cur && s.has_uncommitted_changes() {
                                                    s.set_error(format!(
                                                        "Uncommitted changes exist. Please commit or stash before switching to '{}'.",
                                                        name
                                                    ));
                                                } else if let Err(e) = s.checkout_branch(&name) {
                                                    s.set_error(e.to_string());
                                                } else {
                                                    s.add_toast(
                                                        format!("Switched to branch '{}'", name),
                                                        crate::app::ToastKind::Success,
                                                    );
                                                }
                                                cx.notify();
                                            });
                                        }),
                                )
                                .child(
                                    {
                                        let ws = weak_state.clone();
                                        let nm = b.name.clone();
                                        Button::new(gpui::SharedString::from(format!(
                                            "del-{}",
                                            b.name
                                        )))
                                        .label("Delete")
                                        .small()
                                        .on_click(move |_, _, cx| {
                                            let name = nm.clone();
                                            let _ = ws.update(cx, |s, cx| {
                                                if let Err(e) = s.delete_branch(&name) {
                                                    s.set_error(e.to_string());
                                                    s.add_toast(
                                                        format!("Failed to delete branch '{}': {}", name, e),
                                                        crate::app::ToastKind::Error,
                                                    );
                                                } else {
                                                    s.add_toast(
                                                        format!("Deleted branch '{}'", name),
                                                        crate::app::ToastKind::Success,
                                                    );
                                                }
                                                cx.notify();
                                            });
                                        })
                                    }
                                ),
                        )
                })),
        )
        // ---- Remote 列表 —— Remote list ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Remotes"),
        )
        .child(
            div()
                .flex()
                .gap_2()
                .child(Input::new(remote_name_input).flex_1())
                .child(Input::new(remote_url_input).flex_1())
                .child({
                    let ws = weak_state.clone();
                    let inp_name = remote_name_input.clone();
                    let inp_url = remote_url_input.clone();
                    Button::new("add-remote")
                        .label("Add")
                        .primary()
                        .on_click(move |_, window, cx| {
                            let name: String = cx.read_entity(&inp_name, |i: &gpui_component::input::InputState, _| i.value().to_string());
                            let url: String = cx.read_entity(&inp_url, |i: &gpui_component::input::InputState, _| i.value().to_string());
                            let success = ws.update(cx, |s, _cx| {
                                if name.trim().is_empty() || url.trim().is_empty() {
                                    s.set_error("Remote name and URL are required".into());
                                    false
                                } else if let Err(e) = s.add_remote(name.trim(), url.trim()) {
                                    s.set_error(e.to_string());
                                    s.add_toast(
                                        format!("Add remote failed: {}", e),
                                        crate::app::ToastKind::Error,
                                    );
                                    false
                                } else {
                                    s.add_toast(
                                        format!("Added remote '{}'", name.trim()),
                                        crate::app::ToastKind::Success,
                                    );
                                    true
                                }
                            }).unwrap_or(false);
                            if success {
                                inp_name.update(cx, |i, _cx| {
                                    i.set_value("", window, _cx);
                                });
                                inp_url.update(cx, |i, _cx| {
                                    i.set_value("", window, _cx);
                                });
                            }
                        })
                }),
        )
        .child(
            div()
                .min_h(px(80.))
                .v_flex()
                .gap_1()
                .when(remotes.is_empty(), |col: Div| {
                    col.child(
                        div()
                            .text_sm()
                            .text_color(gpui::rgb(0x888888))
                            .child("No remotes configured"),
                    )
                })
                .children(remotes.iter().map(|r| {
                    let ws = weak_state.clone();
                    let name = r.name.clone();
                    div()
                        .flex()
                        .justify_between()
                        .items_center()
                        .p_2()
                        .rounded(px(2.))
                        .bg(gpui::rgb(0x1e1e1e))
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .gap_1()
                                .child(div().text_sm().child(name.clone()))
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x888888))
                                        .child(r.fetch_url.clone()),
                                ),
                        )
                        .child(
                            Button::new(gpui::SharedString::from(format!("del-remote-{}", name)))
                                .label("Delete")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let name = name.clone();
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.remove_remote(&name) {
                                            s.set_error(e.to_string());
                                            s.add_toast(
                                                format!("Remove remote failed: {}", e),
                                                crate::app::ToastKind::Error,
                                            );
                                        } else {
                                            s.add_toast(
                                                format!("Removed remote '{}'", name),
                                                crate::app::ToastKind::Success,
                                            );
                                        }
                                        cx.notify();
                                    });
                                }),
                        )
                })),
        )
        .into_any_element()
}
