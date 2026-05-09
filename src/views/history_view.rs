use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app::AppState;
use crate::git::Commit;

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
                                .child(div().text_sm().child(summary))
                                .child(
                                    div()
                                        .flex()
                                        .gap_4()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x888888))
                                        .child(author)
                                        .child(time_str)
                                        .child(hash.chars().take(7).collect::<String>()),
                                ),
                        )
                })),
        )
        .into_any_element()
}
