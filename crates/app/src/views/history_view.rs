//! 提交历史视图 —— Commit history view
//!
//! 以分页列表形式展示提交历史，支持筛选（分支/作者/文件）、搜索、"加载更多"和点击查看详情。
//! Phase 4: 增加筛选和搜索功能，提交行支持点击跳转到详情视图。
//!
//! Shows paginated commit list with filter/search controls and detail links.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::input::Input;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use ogit::Commit;

/// Phase 4 render function with search and filter support.
#[allow(clippy::too_many_arguments)]
pub fn render_history_view(
    history: &[Commit],
    selected_hist: Option<usize>,
    search_results: &[Commit],
    search_query: &str,
    is_searching: bool,
    filter_branch: Option<&String>,
    filter_author: Option<&String>,
    filter_file: Option<&String>,
    history_search_input: &Entity<gpui_component::input::InputState>,
    history_filter_input: &Entity<gpui_component::input::InputState>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    let display_list = if !search_query.is_empty() && !search_results.is_empty() {
        search_results
    } else {
        history
    };

    let has_filter = filter_branch.is_some()
        || filter_author.is_some()
        || filter_file.is_some()
        || !search_query.is_empty();

    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_2()
        // ---- 筛选/搜索栏 —— Filter / Search bar ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .items_center()
                .flex_wrap()
                // 搜索框 —— Search input
                .child(
                    div()
                        .text_xs()
                        .text_color(gpui::rgb(0x888888))
                        .flex_none()
                        .child("Search:"),
                )
                .child(div().w(px(200.)).child(Input::new(history_search_input)))
                // 筛选输入 —— Filter input
                .child(
                    div()
                        .text_xs()
                        .text_color(gpui::rgb(0x888888))
                        .flex_none()
                        .child("Filter:"),
                )
                .child(div().w(px(180.)).child(Input::new(history_filter_input)))
                // 清除筛选 —— Clear filters
                .when(has_filter, |col| {
                    let ws = weak_state.clone();
                    col.child(Button::new("hist-clear").label("Clear").small().on_click(
                        move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.clear_history_filter() {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        },
                    ))
                }),
        )
        // ---- 激活筛选标签 —— Active filter tags ---- //
        .when(has_filter, |col| {
            let mut tag_items: Vec<String> = Vec::new();
            if let Some(b) = filter_branch {
                tag_items.push(format!("branch: {}", b));
            }
            if let Some(a) = filter_author {
                tag_items.push(format!("author: {}", a));
            }
            if let Some(f) = filter_file {
                tag_items.push(format!("file: {}", f));
            }
            if !search_query.is_empty() {
                tag_items.push(format!("search: \"{}\"", search_query));
            }
            col.child(
                div()
                    .flex()
                    .gap_1()
                    .flex_wrap()
                    .children(tag_items.iter().map(|t| {
                        let tag_str = t.clone();
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x4dd0e1))
                            .bg(gpui::rgb(0x1a2a3a))
                            .rounded(px(3.))
                            .px_2()
                            .py_0p5()
                            .child(tag_str)
                    })),
            )
        })
        // ---- 顶部栏：提交计数 + 加载更多 ---- //
        .child(
            div()
                .flex()
                .justify_between()
                .items_center()
                .child({
                    let label = if !search_query.is_empty() && !search_results.is_empty() {
                        format!("Results ({})", search_results.len())
                    } else {
                        format!("Commits ({})", display_list.len())
                    };
                    div().text_sm().child(label)
                })
                .child({
                    let ws = weak_state.clone();
                    Button::new("hist-more")
                        .label("Load more")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                if let Err(e) = s.load_more_history() {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        })
                }),
        )
        // ---- 提交列表 ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .when(display_list.is_empty(), |col: Div| {
                    col.child(
                        div()
                            .flex_1()
                            .min_h_0()
                            .v_flex()
                            .items_center()
                            .justify_center()
                            .gap_2()
                            .child(div().text_sm().text_color(gpui::rgb(0x888888)).child(
                                if is_searching {
                                    "Searching..."
                                } else {
                                    "No commits found"
                                },
                            ))
                            .when(!is_searching, |col| {
                                col.child(
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x666666))
                                        .child("Try changing your search query or filters"),
                                )
                            }),
                    )
                })
                .children(display_list.iter().enumerate().map(|(idx, c)| {
                    let sel = selected_hist == Some(idx);
                    let ws = weak_state.clone();
                    let hash = c.hash.clone();
                    let ws2 = weak_state.clone();
                    let hash2 = c.hash.clone();
                    let summary = c.summary.clone();
                    let author = c.author.clone();
                    let time_str = c.time.format("%Y-%m-%d").to_string();
                    let hash_short: String = hash.chars().take(7).collect();
                    div()
                        .id(hash.clone())
                        .cursor_pointer()
                        .bg(if sel {
                            gpui::rgb(0x3e3e3e)
                        } else {
                            gpui::rgb(0x1e1e1e)
                        })
                        .rounded(px(2.))
                        .p_2()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                s.selected_history = Some(idx);
                                cx.notify();
                            });
                        })
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .gap_1()
                                .child(
                                    div()
                                        .flex()
                                        .justify_between()
                                        .items_center()
                                        .child(div().text_sm().child(summary))
                                        .child({
                                            Button::new("hist-detail")
                                                .label("Detail")
                                                .small()
                                                .on_click(move |_, _, cx| {
                                                    let _ = ws2.update(cx, |s, cx| {
                                                        if let Err(e) = s.load_commit_detail(&hash2)
                                                        {
                                                            s.set_error(e.to_string());
                                                        }
                                                        cx.notify();
                                                    });
                                                })
                                        }),
                                )
                                .child(
                                    div()
                                        .flex()
                                        .gap_4()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x888888))
                                        .child(author)
                                        .child(time_str)
                                        .child(hash_short),
                                ),
                        )
                })),
        )
        .into_any_element()
}
