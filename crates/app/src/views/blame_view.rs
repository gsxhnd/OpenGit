//! Blame 视图 —— Blame view
//!
//! Phase 4: blame（行注释）视图。

use std::path::PathBuf;

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::BlameLine;

/// 渲染 blame 视图
pub fn render_blame_view(
    path: Option<&PathBuf>,
    lines: &[BlameLine],
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    let Some(file_path) = path else {
        return div()
            .flex_1()
            .v_flex()
            .items_center()
            .justify_center()
            .child(
                div()
                    .text_sm()
                    .text_color(gpui::rgb(0x888888))
                    .child("No file selected — use File Search to open blame"),
            )
            .into_any_element();
    };

    let path_str = file_path.display().to_string();

    div()
        .flex_1()
        .v_flex()
        .gap_2()
        .child(
            div()
                .flex()
                .items_center()
                .gap_3()
                .child(
                    div()
                        .text_sm()
                        .text_color(gpui::rgb(0xaaaaaa))
                        .child("Blame:"),
                )
                .child(
                    div()
                        .text_sm()
                        .font_family("monospace")
                        .text_color(gpui::rgb(0x4fc3f7))
                        .child(path_str),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(gpui::rgb(0x666666))
                        .child(format!("({} lines)", lines.len())),
                ),
        )
        .child(
            div()
                .flex_1()
                .v_flex()
                .gap_0()
                .font_family("monospace")
                .text_xs()
                .when(lines.is_empty(), |col| {
                    col.child(
                        div()
                            .text_color(gpui::rgb(0x666666))
                            .child("No blame information available"),
                    )
                })
                .children(lines.iter().map(|line| {
                    let hash_short: String = line.hash.chars().take(7).collect();
                    let ws = weak_state.clone();
                    let lh = line.hash.clone();
                    let author = line.author.clone();
                    let time_str = line.time.format("%Y-%m-%d").to_string();
                    let summary = line.summary.clone();

                    div()
                        .flex()
                        .gap_2()
                        .items_center()
                        .py_0p5()
                        .px_1()
                        .child(
                            div()
                                .min_w(px(50.))
                                .text_color(gpui::rgb(0x555555))
                                .child(format!("{:>5}", line.line)),
                        )
                        .child({
                            let h = lh;
                            let w = ws;
                            Button::new("blame-link")
                                .label(hash_short)
                                .small()
                                .on_click(move |_, _, cx| {
                                    let _ = w.update(cx, |s, cx| {
                                        if let Err(e) = s.load_commit_detail(&h) {
                                            s.set_error(e.to_string());
                                        }
                                        cx.notify();
                                    });
                                })
                        })
                        .child(
                            div()
                                .min_w(px(120.))
                                .text_color(gpui::rgb(0x888888))
                                .child(author),
                        )
                        .child(
                            div()
                                .min_w(px(90.))
                                .text_color(gpui::rgb(0x666666))
                                .child(time_str),
                        )
                        .child(
                            div()
                                .flex_1()
                                .text_color(gpui::rgb(0xaaaaaa))
                                .child(summary),
                        )
                })),
        )
        .into_any_element()
}
