/// Welcome view - shown when no repository is open

use gpui::*;
use gpui_component::*;

/// Welcome view component
pub struct WelcomeView;

impl Render for WelcomeView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div()
            .v_flex()
            .gap_6()
            .size_full()
            .items_center()
            .justify_center()
            .p_4()
            .child(
                div()
                    .flex()
                    .flex_col()
                    .items_center()
                    .gap_4()
                    .child(
                        div()
                            .text_lg()
                            .text_color(gpui::rgb(0xffffff))
                            .child("Welcome to OpenGit")
                    )
                    .child(
                        div()
                            .text_color(gpui::rgb(0xcccccc))
                            .child("A modern Git client built with Rust and GPUI")
                    )
                    .child(
                        div()
                            .mt_8()
                            .text_color(gpui::rgb(0xaaaaaa))
                            .child("Open a Git repository to get started")
                    )
            )
    }
}
