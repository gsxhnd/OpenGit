/// Commit view - staging area and commit message input

use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::*;
use crate::app::CommitEditor;

/// Commit view component
pub struct CommitView {
    pub editor: CommitEditor,
    pub show_staged_only: bool,
}

impl Default for CommitView {
    fn default() -> Self {
        Self {
            editor: CommitEditor::new(),
            show_staged_only: false,
        }
    }
}

impl Render for CommitView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let entity = cx.entity();
        
        div()
            .v_flex()
            .gap_4()
            .size_full()
            .p_4()
            .child(
                div()
                    .flex()
                    .flex_col()
                    .flex_1()
                    .gap_2()
                    .child(
                        div()
                            .text_color(gpui::rgb(0xffffff))
                            .text_xs()
                            .child("Staged Files")
                    )
                    .child(
                        div()
                            .bg(gpui::rgb(0x1e1e1e))
                            .rounded(px(4.))
                            .p_2()
                            .flex_1()
                            .text_color(gpui::rgb(0xcccccc))
                            .child("(File list will appear here)")
                    )
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap_2()
                    .child(
                        div()
                            .text_color(gpui::rgb(0xffffff))
                            .text_xs()
                            .child("Commit Message")
                    )
                    .child(
                        div()
                            .bg(gpui::rgb(0x1e1e1e))
                            .rounded(px(4.))
                            .p_3()
                            .text_color(gpui::rgb(0xcccccc))
                            .child(
                                format!("Message: {}", self.editor.message.lines().next().unwrap_or(""))
                            )
                    )
            )
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(
                        Button::new("commit-btn")
                            .label("Commit")
                            .primary()
                            .on_click(move |_, _, _| {
                                // TODO: Implement commit action
                                println!("Commit clicked");
                            })
                    )
                    .child(
                        Button::new("amend-btn")
                            .label("Amend")
                            .on_click(move |_, _, _| {
                                // TODO: Implement amend action
                                println!("Amend clicked");
                            })
                    )
            )
    }
}
