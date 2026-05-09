//! 分支管理视图 —— Branch management view
//!
//! 提供分支的创建和切换功能。
//! 列表显示所有本地分支，高亮当前 HEAD 分支，
//! 每个分支旁边有"Checkout"按钮用于切换。
//!
//! Provides branch creation and checkout. Lists local branches with HEAD highlighting
//! and "Checkout" buttons for switching.

use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app::AppState;
use ogit::Branch;

/// 渲染分支管理视图 —— Render branch management view
///
/// 布局：
/// 1. 输入框 + "Create branch" 按钮
/// 2. 分支列表（HEAD 标记 + Checkout 按钮）
///
/// Layout: input + create button → branch list (HEAD marker + checkout button).
pub fn render_branches_view(
    branches: &[Branch],
    branch_name_input: &Entity<InputState>,
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- 创建分支区域 —— Branch creation area ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .child(Input::new(branch_name_input).flex_1())
                .child({
                    let ws = weak_state.clone();
                    let inp = branch_name_input.clone();
                    Button::new("new-branch")
                        .label("Create branch")
                        .primary()
                        .on_click(move |_, _, cx| {
                            let name =
                                cx.read_entity(&inp, |i, _| i.value().to_string());
                            let _ = ws.update(cx, |s, cx| {
                                if name.trim().is_empty() {
                                    s.set_error("Branch name is empty".into());
                                } else if let Err(e) = s.create_branch(name.trim()) {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                        })
                }),
        )
        // ---- 分支列表 —— Branch list ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .children(branches.iter().map(|b| {
                    let ws = weak_state.clone();
                    let nm = b.name.clone();
                    let cur = b.is_head;
                    div()
                        .flex()
                        .justify_between()
                        .items_center()
                        .p_2()
                        .rounded(px(2.))
                        .bg(gpui::rgb(0x1e1e1e))
                        .child(
                            div()
                                .flex()
                                .gap_2()
                                // HEAD 标记（青色标签） —— HEAD marker (cyan label)
                                .child(if cur {
                                    div()
                                        .text_xs()
                                        .text_color(gpui::rgb(0x4dd0e1))
                                        .child("HEAD")
                                } else {
                                    div().text_xs().child(" ")
                                })
                                .child(b.name.clone()),
                        )
                        // Checkout 按钮 —— Checkout button
                        .child(
                            Button::new(gpui::SharedString::from(format!(
                                "sw-{}",
                                b.name
                            )))
                            .label("Checkout")
                            .small()
                            .on_click(move |_, _, cx| {
                                let name = nm.clone();
                                let _ = ws.update(cx, |s, cx| {
                                    if let Err(e) = s.checkout_branch(&name) {
                                        s.set_error(e.to_string());
                                    }
                                    cx.notify();
                                });
                            }),
                        )
                })),
        )
        .into_any_element()
}
