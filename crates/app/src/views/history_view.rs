//! 提交历史视图 —— Commit history view
//!
//! 以分页列表形式展示提交历史，支持"加载更多"和点击选中。
//! 每条记录显示：摘要、作者、日期和短哈希。
//!
//! Shows paginated commit list with "Load more" and click-to-select.
//! Each row shows: summary, author, date, and short hash.

use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app::AppState;
use ogit::Commit;

/// 渲染提交历史视图 —— Render commit history view
///
/// 布局：
/// 1. 顶部栏：提交数量 + "加载更多"按钮
/// 2. 提交列表：可滚动的提交条目列表
///
/// Layout: top bar (count + load more) → scrollable commit list.
pub fn render_history_view(
    history: &[Commit],
    selected_hist: Option<usize>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_2()
        // ---- 顶部栏：提交计数 + 加载更多 ---- //
        .child(
            div()
                .flex()
                .justify_between()
                .items_center()
                .child(format!("Commits ({})", history.len()))
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
                .children(history.iter().enumerate().map(|(idx, c)| {
                    let sel = selected_hist == Some(idx);
                    let ws = weak_state.clone();
                    let hash = c.hash.clone();
                    let summary = c.summary.clone();
                    let author = c.author.clone();
                    let time_str = c.time.format("%Y-%m-%d").to_string();
                    div()
                        .id(hash.clone())
                        .cursor_pointer()
                        // 选中行高亮 —— Highlight selected row
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
                                // 提交摘要 —— Commit summary
                                .child(div().text_sm().child(summary))
                                // 元数据行：作者 · 日期 · 短哈希 —— Metadata: author · date · short hash
                                .child(
                                    div()
                                        .flex()
                                        .gap_4()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x888888))
                                        .child(author)
                                        .child(time_str)
                                        // 显示前 7 位哈希 —— Show first 7 chars of hash
                                        .child(hash.chars().take(7).collect::<String>()),
                                ),
                        )
                })),
        )
        .into_any_element()
}
