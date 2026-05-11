//! 底部状态栏 —— Bottom status bar
//!
//! 显示当前分支名称和变更统计信息：
//! - 左侧：当前分支名（`Branch: main`）
//! - 右侧：变更计数（`↑A ↓B · unstaged X · staged Y`）
//!
//! Displays current branch name and change statistics (ahead/behind counts, unstaged/staged).

use gpui::prelude::FluentBuilder;
use gpui::*;

/// 底部状态栏组件 —— Bottom status bar component
///
/// 显示仓库的当前状态信息，使用小号文字和灰色调。
///
/// Shows current repo status with small text in gray tones.
#[derive(IntoElement)]
pub struct StatusBar {
    current_branch: String,
    ahead: usize,
    behind: usize,
    changed_count: usize,
    staged_count: usize,
    current_operation: Option<String>,
}

impl StatusBar {
    /// 创建状态栏 —— Create status bar
    pub fn new(
        current_branch: impl Into<String>,
        ahead: usize,
        behind: usize,
        changed_count: usize,
        staged_count: usize,
        current_operation: Option<String>,
    ) -> Self {
        Self {
            current_branch: current_branch.into(),
            ahead,
            behind,
            changed_count,
            staged_count,
            current_operation,
        }
    }
}

impl RenderOnce for StatusBar {
    /// 渲染状态栏 —— Render status bar
    ///
    /// 左侧显示分支名和当前操作，右侧显示 ↑A ↓B · unstaged X · staged Y 统计信息。
    ///
    /// Left: branch name + current operation, Right: ↑ahead ↓behind · unstaged count · staged count
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
                    .flex()
                    .gap_3()
                    .items_center()
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x888888))
                            .child(format!("Branch: {}", self.current_branch)),
                    )
                    .when_some(self.current_operation, |row: Div, op: String| {
                        row.child(div().text_xs().text_color(gpui::rgb(0x6abf69)).child(op))
                    }),
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
