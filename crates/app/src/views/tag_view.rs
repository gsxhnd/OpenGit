//! 标签管理视图 —— Tag management view
//!
//! 显示标签列表，支持创建和删除标签。
//!
//! Shows tag list with create and delete actions.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::Tag;

/// 渲染标签管理视图 —— Render tag management view
pub fn render_tag_view(
    tags: &[Tag],
    tag_name_input: &Entity<InputState>,
    tag_message_input: &Entity<InputState>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- 创建标签区域 —— Tag creation area ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .child(Input::new(tag_name_input).flex_1())
                .child(Input::new(tag_message_input).flex_1())
                .child({
                    let ws = weak_state.clone();
                    let inp_name = tag_name_input.clone();
                    let inp_msg = tag_message_input.clone();
                    Button::new("new-tag")
                        .label("Create tag")
                        .primary()
                        .on_click(move |_, window, cx| {
                            let name: String = cx
                                .read_entity(&inp_name, |i: &InputState, _| i.value().to_string());
                            let msg: String =
                                cx.read_entity(&inp_msg, |i: &InputState, _| i.value().to_string());
                            let success = ws
                                .update(cx, |s, _cx| {
                                    if name.trim().is_empty() {
                                        s.set_error("Tag name is empty".into());
                                        false
                                    } else {
                                        let message = if msg.trim().is_empty() {
                                            None
                                        } else {
                                            Some(msg.trim())
                                        };
                                        if let Err(e) = s.create_tag(name.trim(), message) {
                                            s.set_error(e.to_string());
                                            s.add_toast(
                                                format!("Create tag failed: {}", e),
                                                crate::app_state::ToastKind::Error,
                                            );
                                            false
                                        } else {
                                            s.add_toast(
                                                format!("Created tag '{}'", name.trim()),
                                                crate::app_state::ToastKind::Success,
                                            );
                                            true
                                        }
                                    }
                                })
                                .unwrap_or(false);
                            if success {
                                inp_name.update(cx, |i, _cx| {
                                    i.set_value("", window, _cx);
                                });
                                inp_msg.update(cx, |i, _cx| {
                                    i.set_value("", window, _cx);
                                });
                            }
                        })
                }),
        )
        // ---- 标签列表 —— Tag list ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .when(tags.is_empty(), |col: Div| {
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
                                    .child("No tags"),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(gpui::rgb(0x666666))
                                    .child("Create a tag to mark a specific commit"),
                            ),
                    )
                })
                .children(tags.iter().map(|t| {
                    let ws = weak_state.clone();
                    let name = t.name.clone();
                    let is_annotated = t.message.is_some();
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
                                .child(
                                    div()
                                        .flex()
                                        .gap_2()
                                        .child(div().text_sm().child(name.clone()))
                                        .child(
                                            div().text_xs().text_color(gpui::rgb(0x888888)).child(
                                                if is_annotated {
                                                    "annotated"
                                                } else {
                                                    "lightweight"
                                                },
                                            ),
                                        ),
                                )
                                .when_some(t.message.clone(), |col, msg| {
                                    col.child(
                                        div().text_xs().text_color(gpui::rgb(0xaaaaaa)).child(msg),
                                    )
                                }),
                        )
                        .child(
                            Button::new(gpui::SharedString::from(format!("del-tag-{}", name)))
                                .label("Delete")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let name = name.clone();
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.delete_tag(&name) {
                                            s.set_error(e.to_string());
                                            s.add_toast(
                                                format!("Delete tag failed: {}", e),
                                                crate::app_state::ToastKind::Error,
                                            );
                                        } else {
                                            s.add_toast(
                                                format!("Deleted tag '{}'", name),
                                                crate::app_state::ToastKind::Success,
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
