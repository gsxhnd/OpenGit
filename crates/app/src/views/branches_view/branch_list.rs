//! 分支列表渲染 —— Branch list rendering
//!
//! 渲染本地分支列表，每个分支显示 HEAD 标记、Checkout 和 Delete 按钮。
//!
//! Renders local branch list with HEAD marker, Checkout and Delete buttons.

use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::Branch;

/// 渲染分支列表 —— Render branch list
pub fn render_branch_list(branches: &[Branch], weak_state: WeakEntity<AppState>) -> Div {
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
                                                crate::app_state::ToastKind::Success,
                                            );
                                        }
                                        cx.notify();
                                    });
                                }),
                        )
                        .child({
                            let ws = weak_state.clone();
                            let nm = b.name.clone();
                            Button::new(gpui::SharedString::from(format!("del-{}", b.name)))
                                .label("Delete")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let name = nm.clone();
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.delete_branch(&name) {
                                            s.set_error(e.to_string());
                                            s.add_toast(
                                                format!(
                                                    "Failed to delete branch '{}': {}",
                                                    name, e
                                                ),
                                                crate::app_state::ToastKind::Error,
                                            );
                                        } else {
                                            s.add_toast(
                                                format!("Deleted branch '{}'", name),
                                                crate::app_state::ToastKind::Success,
                                            );
                                        }
                                        cx.notify();
                                    });
                                })
                        }),
                )
        }))
}
