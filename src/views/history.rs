/// Commit history view

use gpui::*;
use gpui_component::*;
use crate::git::Commit;

/// Commit history view component
pub struct HistoryView {
    /// List of commits
    pub commits: Vec<Commit>,
    /// Currently selected commit
    pub selected: Option<usize>,
    /// Loading state
    pub is_loading: bool,
}

impl Default for HistoryView {
    fn default() -> Self {
        Self {
            commits: Vec::new(),
            selected: None,
            is_loading: false,
        }
    }
}

impl Render for HistoryView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div()
            .v_flex()
            .gap_2()
            .size_full()
            .p_4()
            .child(
                div()
                    .text_color(gpui::rgb(0xffffff))
                    .text_sm()
                    .child(format!("Commits ({})", self.commits.len()))
            )
            .child(
                div()
                    .bg(gpui::rgb(0x1e1e1e))
                    .rounded(px(4.))
                    .p_2()
                    .flex_1()
                    .v_flex()
                    .gap_1()
                    .overflow_hidden()
                    .children(
                        self.commits.iter().enumerate().map(|(idx, commit)| {
                            let is_selected = self.selected == Some(idx);
                            let summary = commit.summary.clone();
                            let author = commit.author.clone();
                            let time_str = format!("{}", commit.time.format("%Y-%m-%d"));
                            div()
                                .bg(if is_selected { gpui::rgb(0x3e3e3e) } else { gpui::rgb(0x1e1e1e) })
                                .rounded(px(2.))
                                .p_2()
                                .child(
                                    div()
                                        .flex()
                                        .flex_col()
                                        .gap_1()
                                        .child(
                                            div()
                                                .text_color(gpui::rgb(0xffffff))
                                                .text_sm()
                                                .child(summary)
                                        )
                                        .child(
                                            div()
                                                .flex()
                                                .gap_4()
                                                .text_color(gpui::rgb(0x888888))
                                                .text_xs()
                                                .child(author)
                                                .child(time_str)
                                        )
                                )
                        })
                    )
            )
    }
}
