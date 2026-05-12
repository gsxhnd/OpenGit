//! 文件搜索视图 —— File search view
//!
//! 按文件名搜索工作区文件，支持打开 diff 或文件历史。
//! Phase 4: 实现文件搜索面板。

use std::path::PathBuf;

use gpui::*;
use gpui_component::button::Button;
use gpui_component::input::Input;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;

/// 渲染文件搜索视图 —— Render file search view
pub fn render_file_search_view(
    results: &[PathBuf],
    search_input: &Entity<gpui_component::input::InputState>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    div()
        .flex_1()
        .v_flex()
        .gap_3()
        .child(
            div()
                .flex()
                .gap_2()
                .items_center()
                .child(
                    div()
                        .text_sm()
                        .text_color(gpui::rgb(0xaaaaaa))
                        .child("Search files:"),
                )
                .child(Input::new(search_input).w_full()),
        )
        .child(
            div()
                .flex_1()
                .v_flex()
                .gap_1()
                .children(results.iter().map(|path| {
                    let path_str = path.display().to_string();
                    let ws = weak_state.clone();
                    let p = path.clone();
                    let p2 = path.clone();
                    let ws2 = weak_state.clone();

                    div()
                        .flex()
                        .gap_2()
                        .items_center()
                        .py_1()
                        .px_2()
                        .rounded(px(2.))
                        .child(
                            div()
                                .flex_1()
                                .text_sm()
                                .font_family("monospace")
                                .child(path_str),
                        )
                        .child(Button::new("fs-diff").label("Diff").small().on_click(
                            move |_, _, cx| {
                                let _ = ws.update(cx, |s, cx| {
                                    let _ = s.set_diff_path(Some(p.clone()));
                                    cx.notify();
                                });
                            },
                        ))
                        .child(Button::new("fs-history").label("History").small().on_click(
                            move |_, _, cx| {
                                let _ = ws2.update(cx, |s, cx| {
                                    if let Err(e) = s.load_file_history(&p2, 50) {
                                        s.set_error(e.to_string());
                                    }
                                    cx.notify();
                                });
                            },
                        ))
                })),
        )
        .into_any_element()
}
