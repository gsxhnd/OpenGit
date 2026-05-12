//! 提交图视图 —— Commit graph view
//!
//! Phase 4: 提交图可视化。

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::scroll::ScrollableElement;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::{GraphCell, GraphData};

fn graph_cell_char(cell: &GraphCell) -> &'static str {
    match cell {
        GraphCell::Empty => " ",
        GraphCell::Pipe => "│",
        GraphCell::Branch => "├",
        GraphCell::Merge => "─",
        GraphCell::Dot => "●",
        GraphCell::Fork => "┌",
        GraphCell::MergeEnd => "┘",
    }
}

/// 渲染提交图视图
pub fn render_graph_view(
    graph: Option<&GraphData>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    let Some(graph) = graph else {
        return div()
            .flex_1()
            .v_flex()
            .items_center()
            .justify_center()
            .child(
                div()
                    .text_sm()
                    .text_color(gpui::rgb(0x888888))
                    .child("Click 'Load Graph' to view commit graph"),
            )
            .into_any_element();
    };

    if graph.rows.is_empty() {
        return div()
            .flex_1()
            .v_flex()
            .items_center()
            .justify_center()
            .child(
                div()
                    .text_sm()
                    .text_color(gpui::rgb(0x888888))
                    .child("No commits to display"),
            )
            .into_any_element();
    }

    div()
        .flex_1()
        .v_flex()
        .gap_2()
        .child(
            div()
                .flex()
                .justify_between()
                .items_center()
                .child(
                    div()
                        .text_sm()
                        .child(format!("Commit Graph ({})", graph.rows.len())),
                )
                .child({
                    let ws = weak_state.clone();
                    Button::new("graph-reload")
                        .label("Reload")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.load_graph(100) {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        })
                }),
        )
        .child(
            div()
                .flex_1()
                .v_flex()
                .min_h_0()
                .w_full()
                .overflow_y_scrollbar()
                .p_4()
                .gap_1()
                .font_family("monospace")
                .text_xs()
                .children(graph.rows.iter().enumerate().map(|(idx, row)| {
                    let graph_str: String = row.cells.iter().map(graph_cell_char).collect();
                    let hash_short: String = row.commit.hash.chars().take(7).collect();
                    let time_str = row.commit.time.format("%Y-%m-%d").to_string();
                    let author = row.commit.author.clone();
                    let summary = row.commit.summary.clone();
                    let ws = weak_state.clone();
                    let hash = row.commit.hash.clone();
                    let button_id = format!("graph-detail-{}", idx);

                    let mut label_strs: Vec<String> = Vec::new();
                    for b in &row.branch_labels {
                        label_strs.push(format!("[{}]", b));
                    }
                    for t in &row.tag_labels {
                        label_strs.push(format!("<{}>", t));
                    }

                    let mut row_div = div()
                        .flex()
                        .gap_2()
                        .items_center()
                        .rounded(px(2.))
                        .px_2()
                        .py_1()
                        .hover(|this| this.bg(gpui::rgb(0x1f1f2e)))
                        .child(
                            div()
                                .text_color(gpui::rgb(0x666666))
                                .flex_none()
                                .w(px(40.))
                                .child(graph_str),
                        );

                    if !label_strs.is_empty() {
                        row_div = row_div.child(div().flex().gap_1().flex_none().children(
                            label_strs.iter().map(|label| {
                                let color = if label.starts_with('[') {
                                    gpui::rgb(0x4dd0e1)
                                } else {
                                    gpui::rgb(0xffd54f)
                                };
                                div()
                                    .text_color(color)
                                    .rounded(px(3.))
                                    .px_2()
                                    .py_0p5()
                                    .bg(gpui::rgb(0x1a1a2e))
                                    .text_xs()
                                    .child(label.clone())
                            }),
                        ));
                    }

                    row_div
                        .child(
                            div()
                                .flex_1()
                                .text_color(gpui::rgb(0xcccccc))
                                .min_w_0()
                                .child(summary),
                        )
                        .child(
                            div()
                                .flex()
                                .gap_4()
                                .flex_none()
                                .text_color(gpui::rgb(0x888888))
                                .text_xs()
                                .child(author)
                                .child(time_str)
                                .child(hash_short),
                        )
                        .child({
                            let h = hash.clone();
                            let w = ws.clone();
                            let bid = button_id.clone();
                            Button::new(bid)
                                .label("→")
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
                })),
        )
        .into_any_element()
}
