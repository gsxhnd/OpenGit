/// Branch management view

use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::*;
use crate::git::Branch;

/// Branch management view component
pub struct BranchesView {
    /// List of branches
    pub branches: Vec<Branch>,
    /// Currently selected branch
    pub selected: Option<usize>,
    /// New branch name input
    pub new_branch_name: String,
    /// Whether creating a new branch
    pub creating_branch: bool,
}

impl Default for BranchesView {
    fn default() -> Self {
        Self {
            branches: Vec::new(),
            selected: None,
            new_branch_name: String::new(),
            creating_branch: false,
        }
    }
}

impl Render for BranchesView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div()
            .v_flex()
            .gap_4()
            .size_full()
            .p_4()
            .child(
                div()
                    .text_color(gpui::rgb(0xffffff))
                    .text_sm()
                    .child(format!("Branches ({})", self.branches.len()))
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
                        self.branches.iter().enumerate().map(|(idx, branch)| {
                            let is_selected = self.selected == Some(idx);
                            let is_current = branch.is_head;
                            let branch_name = branch.name.clone();
                            let target_short = branch.target[..std::cmp::min(8, branch.target.len())].to_string();
                            div()
                                .bg(if is_selected { gpui::rgb(0x3e3e3e) } else { gpui::rgb(0x1e1e1e) })
                                .rounded(px(2.))
                                .p_2()
                                .flex()
                                .justify_between()
                                .child(
                                    div()
                                        .flex()
                                        .gap_2()
                                        .child(
                                            if is_current {
                                                div()
                                                    .text_color(gpui::rgb(0x4dd0e1))
                                                    .text_xs()
                                                    .child("✓")
                                            } else {
                                                div()
                                                    .text_xs()
                                                    .child(" ")
                                            }
                                        )
                                        .child(
                                            div()
                                                .text_color(gpui::rgb(0xffffff))
                                                .text_sm()
                                                .child(branch_name)
                                        )
                                )
                                .child(
                                    div()
                                        .text_color(gpui::rgb(0x888888))
                                        .text_xs()
                                        .child(target_short)
                                )
                        })
                    )
            )
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(
                        Button::new("new-branch")
                            .label("New Branch")
                            .primary()
                            .on_click(|_, _, _| {
                                println!("New branch clicked");
                            })
                    )
                    .child(
                        Button::new("delete-branch")
                            .label("Delete")
                            .on_click(|_, _, _| {
                                println!("Delete branch clicked");
                            })
                    )
            )
    }
}
