//! 文件历史视图 —— File history view
//!
//! Phase 4: 单文件提交历史。

use std::path::PathBuf;

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::Commit;

/// 渲染文件历史视图
pub fn render_file_history_view(
    path: Option<&PathBuf>,
    commits: &[Commit],
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
                    .child("No file selected — use File Search to find a file"),
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
                        .child("History of:"),
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
                        .child(format!("({} commits)", commits.len())),
                ),
        )
        .child(
            div()
                .flex_1()
                .v_flex()
                .gap_1()
                .when(commits.is_empty(), |col| {
                    col.child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x666666))
                            .child("No commits found for this file"),
                    )
                })
                .children(commits.iter().map(|c| {
                    let hash_short: String = c.hash.chars().take(7).collect();
                    let time_str = c.time.format("%Y-%m-%d").to_string();
                    let ws = weak_state.clone();
                    let hash = c.hash.clone();
                    let summary = c.summary.clone();
                    let author = c.author.clone();

                    div()
                        .flex()
                        .gap_3()
                        .items_center()
                        .py_1()
                        .px_2()
                        .rounded(px(2.))
                        .cursor_pointer()
                        .child(
                            div()
                                .text_xs()
                                .font_family("monospace")
                                .text_color(gpui::rgb(0x888888))
                                .child(hash_short),
                        )
                        .child(
                            div()
                                .flex_1()
                                .text_sm()
                                .text_color(gpui::rgb(0xcccccc))
                                .child(summary),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(gpui::rgb(0x666666))
                                .child(author),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(gpui::rgb(0x666666))
                                .child(time_str),
                        )
                        .child({
                            let h = hash;
                            let w = ws;
                            Button::new("fh-detail").label("Detail").small().on_click(
                                move |_, _, cx| {
                                    let _ = w.update(cx, |s, cx| {
                                        if let Err(e) = s.load_commit_detail(&h) {
                                            s.set_error(e.to_string());
                                        }
                                        cx.notify();
                                    });
                                },
                            )
                        })
                })),
        )
        .into_any_element()
}
