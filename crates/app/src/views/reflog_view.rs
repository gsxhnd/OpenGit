//! 引用日志视图 —— Reflog view
//!
//! 显示 HEAD 引用的变动历史。
//! Phase 4: 实现 reflog 视图。

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::ReflogEntry;

/// 渲染引用日志视图 —— Render reflog view
pub fn render_reflog_view(entries: &[ReflogEntry], weak_state: WeakEntity<AppState>) -> AnyElement {
    div()
        .flex_1()
        .v_flex()
        .gap_2()
        .child(
            div()
                .flex()
                .justify_between()
                .items_center()
                .child(div().text_sm().child(format!("Reflog ({})", entries.len())))
                .child({
                    let ws = weak_state.clone();
                    Button::new("reflog-reload")
                        .label("Reload")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.load_reflog(100) {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        })
                }),
        )
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xffa726))
                .child("Recovering from reflog is a dangerous operation. Use with caution."),
        )
        .child(
            div()
                .flex_1()
                .v_flex()
                .gap_1()
                .when(entries.is_empty(), |col| {
                    col.child(
                        div()
                            .text_sm()
                            .text_color(gpui::rgb(0x666666))
                            .child("No reflog entries"),
                    )
                })
                .children(entries.iter().map(|entry| {
                    let old_short: String = entry.old_hash.chars().take(7).collect();
                    let new_short: String = entry.new_hash.chars().take(7).collect();
                    let time_str = entry.time.format("%Y-%m-%d %H:%M:%S").to_string();
                    let message = entry.message.clone();
                    let committer = entry.committer.clone();

                    div()
                        .flex()
                        .gap_2()
                        .items_start()
                        .py_1()
                        .px_2()
                        .rounded(px(2.))
                        .child(
                            div()
                                .flex()
                                .gap_1()
                                .items_center()
                                .min_w(px(120.))
                                .child(
                                    div()
                                        .text_xs()
                                        .font_family("monospace")
                                        .text_color(gpui::rgb(0xe57373))
                                        .child(old_short),
                                )
                                .child(div().text_xs().text_color(gpui::rgb(0x666666)).child("→"))
                                .child(
                                    div()
                                        .text_xs()
                                        .font_family("monospace")
                                        .text_color(gpui::rgb(0x6abf69))
                                        .child(new_short),
                                ),
                        )
                        .child(
                            div()
                                .flex_1()
                                .v_flex()
                                .gap_0p5()
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0xcccccc))
                                        .child(message),
                                )
                                .child(
                                    div()
                                        .flex()
                                        .gap_3()
                                        .text_color(gpui::rgb(0x666666))
                                        .child(committer)
                                        .child(time_str),
                                ),
                        )
                })),
        )
        .into_any_element()
}
