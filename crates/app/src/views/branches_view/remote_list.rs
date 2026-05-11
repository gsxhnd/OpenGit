//! 远程仓库列表渲染 —— Remote list rendering
//!
//! 渲染远程仓库列表（名称 + URL + Delete 按钮）和添加远程仓库表单。
//!
//! Renders remote list (name + URL + Delete) and add-remote form.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::Remote;

/// 渲染远程仓库添加表单 —— Render add-remote form
pub fn render_remote_form(
    remote_name_input: &Entity<InputState>,
    remote_url_input: &Entity<InputState>,
    weak_state: WeakEntity<AppState>,
) -> Div {
    div()
        .flex()
        .gap_2()
        .child(Input::new(remote_name_input).flex_1())
        .child(Input::new(remote_url_input).flex_1())
        .child({
            let ws = weak_state;
            let inp_name = remote_name_input.clone();
            let inp_url = remote_url_input.clone();
            Button::new("add-remote")
                .label("Add")
                .primary()
                .on_click(move |_, window, cx| {
                    let name: String = cx.read_entity(&inp_name, |i: &InputState, _| {
                        i.value().to_string()
                    });
                    let url: String =
                        cx.read_entity(&inp_url, |i: &InputState, _| i.value().to_string());
                    let success = ws
                        .update(cx, |s, _cx| {
                            if name.trim().is_empty() || url.trim().is_empty() {
                                s.set_error("Remote name and URL are required".into());
                                false
                            } else if let Err(e) = s.add_remote(name.trim(), url.trim()) {
                                s.set_error(e.to_string());
                                s.add_toast(
                                    format!("Add remote failed: {}", e),
                                    crate::app_state::ToastKind::Error,
                                );
                                false
                            } else {
                                s.add_toast(
                                    format!("Added remote '{}'", name.trim()),
                                    crate::app_state::ToastKind::Success,
                                );
                                true
                            }
                        })
                        .unwrap_or(false);
                    if success {
                        inp_name.update(cx, |i, _cx| {
                            i.set_value("", window, _cx);
                        });
                        inp_url.update(cx, |i, _cx| {
                            i.set_value("", window, _cx);
                        });
                    }
                })
        })
}

/// 渲染远程仓库列表 —— Render remote list
pub fn render_remote_list(remotes: &[Remote], weak_state: WeakEntity<AppState>) -> Div {
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
                                        crate::app_state::ToastKind::Error,
                                    );
                                } else {
                                    s.add_toast(
                                        format!("Removed remote '{}'", name),
                                        crate::app_state::ToastKind::Success,
                                    );
                                }
                                cx.notify();
                            });
                        }),
                )
        }))
}
