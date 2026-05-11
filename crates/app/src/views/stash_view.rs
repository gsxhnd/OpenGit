//! 储藏管理视图 —— Stash management view
//!
//! 显示储藏列表，支持 apply / pop / delete 操作。
//!
//! Shows stash list with apply, pop, and delete actions.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app::AppState;
use ogit::Stash;

/// 渲染储藏管理视图 —— Render stash management view
pub fn render_stash_view(stashes: &[Stash], weak_state: WeakEntity<AppState>) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- 储藏列表 —— Stash list ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .when(stashes.is_empty(), |col: Div| {
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
                                    .child("No stashes"),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(gpui::rgb(0x666666))
                                    .child("Stash your working tree changes to see them here"),
                            ),
                    )
                })
                .children(stashes.iter().map(|s| {
                    let ws = weak_state.clone();
                    let stash_id = s.id.clone();
                    let desc = s.description.clone();
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
                                .child(div().text_sm().child(desc.clone()))
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x888888))
                                        .child(stash_id.clone()),
                                ),
                        )
                        .child(
                            div()
                                .flex()
                                .gap_1()
                                .child(
                                    Button::new(gpui::SharedString::from(format!(
                                        "apply-{}",
                                        stash_id
                                    )))
                                    .label("Apply")
                                    .small()
                                    .on_click({
                                        let ws = ws.clone();
                                        let stash_id = stash_id.clone();
                                        move |_, _, cx| {
                                            let _ = ws.update(cx, |s, cx| {
                                                if let Err(e) = s.apply_stash(&stash_id) {
                                                    s.set_error(e.to_string());
                                                    s.add_toast(
                                                        format!("Apply stash failed: {}", e),
                                                        crate::app::ToastKind::Error,
                                                    );
                                                } else {
                                                    s.add_toast(
                                                        "Stash applied",
                                                        crate::app::ToastKind::Success,
                                                    );
                                                }
                                                cx.notify();
                                            });
                                        }
                                    }),
                                )
                                .child(
                                    Button::new(gpui::SharedString::from(format!(
                                        "pop-{}",
                                        stash_id
                                    )))
                                    .label("Pop")
                                    .small()
                                    .on_click({
                                        let ws = ws.clone();
                                        let stash_id = stash_id.clone();
                                        move |_, _, cx| {
                                            let _ = ws.update(cx, |s, cx| {
                                                if let Err(e) = s.pop_stash(&stash_id) {
                                                    s.set_error(e.to_string());
                                                    s.add_toast(
                                                        format!("Pop stash failed: {}", e),
                                                        crate::app::ToastKind::Error,
                                                    );
                                                } else {
                                                    s.add_toast(
                                                        "Stash popped",
                                                        crate::app::ToastKind::Success,
                                                    );
                                                }
                                                cx.notify();
                                            });
                                        }
                                    }),
                                )
                                .child(
                                    Button::new(gpui::SharedString::from(format!(
                                        "del-{}",
                                        stash_id
                                    )))
                                    .label("Delete")
                                    .small()
                                    .on_click({
                                        let ws = ws.clone();
                                        let stash_id = stash_id.clone();
                                        move |_, _, cx| {
                                            let _ = ws.update(cx, |s, cx| {
                                                if let Err(e) = s.delete_stash(&stash_id) {
                                                    s.set_error(e.to_string());
                                                    s.add_toast(
                                                        format!("Delete stash failed: {}", e),
                                                        crate::app::ToastKind::Error,
                                                    );
                                                } else {
                                                    s.add_toast(
                                                        "Stash deleted",
                                                        crate::app::ToastKind::Success,
                                                    );
                                                }
                                                cx.notify();
                                            });
                                        }
                                    }),
                                ),
                        )
                })),
        )
        .into_any_element()
}
