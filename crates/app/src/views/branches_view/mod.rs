//! 分支管理视图 —— Branch management view
//!
//! 提供分支的创建和切换功能，以及远程仓库的管理。
//!
//! ## 子模块 —— Sub-modules
//!
//! | 模块 | 功能 |
//! |------|------|
//! | `branch_list` | 本地分支列表（HEAD 标记、Checkout/Delete 按钮） |
//! | `remote_list` | 远程仓库列表（名称、URL、添加/删除） |
//!
//! Provides branch creation/checkout and remote management.

mod branch_list;
mod remote_list;

use gpui::*;
use gpui_component::StyledExt;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};

use crate::app_state::AppState;
use ogit::{Branch, Remote};

use branch_list::render_branch_list;
use remote_list::{render_remote_form, render_remote_list};

/// 渲染分支管理视图 —— Render branch management view
///
/// 布局：
/// 1. 输入框 + "Create branch" 按钮
/// 2. 分支列表（HEAD 标记 + Checkout 按钮）
/// 3. Remote 列表（名称 + URL + Delete 按钮）
///
/// Layout: input + create button → branch list → remote list.
pub fn render_branches_view(
    branches: &[Branch],
    remotes: &[Remote],
    branch_name_input: &Entity<InputState>,
    remote_name_input: &Entity<InputState>,
    remote_url_input: &Entity<InputState>,
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
                            let name = cx.read_entity(&inp, |i, _| i.value().to_string());
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
        .child(render_branch_list(branches, weak_state.clone()))
        // ---- Remote 区域 —— Remote area ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Remotes"),
        )
        .child(render_remote_form(
            remote_name_input,
            remote_url_input,
            weak_state.clone(),
        ))
        .child(render_remote_list(remotes, weak_state))
        .into_any_element()
}
