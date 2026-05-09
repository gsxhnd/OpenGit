use gpui::*;

/// Bottom status bar showing branch info and change counts.
#[derive(IntoElement)]
pub struct StatusBar {
    current_branch: String,
    ahead: usize,
    behind: usize,
    changed_count: usize,
    staged_count: usize,
}

impl StatusBar {
    pub fn new(
        current_branch: impl Into<String>,
        ahead: usize,
        behind: usize,
        changed_count: usize,
        staged_count: usize,
    ) -> Self {
        Self {
            current_branch: current_branch.into(),
            ahead,
            behind,
            changed_count,
            staged_count,
        }
    }
}

impl RenderOnce for StatusBar {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement {
        div()
            .w_full()
            .h(px(40.))
            .bg(gpui::rgb(0x1e1e1e))
            .border_t(px(1.))
            .border_color(gpui::rgb(0x333333))
            .flex()
            .items_center()
            .px_4()
            .justify_between()
            .child(
                div()
                    .text_xs()
                    .text_color(gpui::rgb(0x888888))
                    .child(format!("Branch: {}", self.current_branch)),
            )
            .child(
                div()
                    .text_xs()
                    .text_color(gpui::rgb(0x888888))
                    .child(format!(
                        "↑{} ↓{} · unstaged {} · staged {}",
                        self.ahead, self.behind, self.changed_count, self.staged_count
                    )),
            )
    }
}
