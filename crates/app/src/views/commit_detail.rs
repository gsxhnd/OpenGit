//! 提交详情视图 —— Commit detail view
//!
//! 展示单个提交的完整信息：message、作者、时间、父提交、变更文件列表和 diff。
//! Phase 4: 实现提交详情面板。
//!
//! Shows full commit details: message, author, time, parents, changed files, and diff.

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::{Sizable, StyledExt};

use crate::app_state::AppState;
use crate::views::diff_view::render_diff_lines;
use ogit::{Commit, FileDiff};

/// 渲染提交详情视图 —— Render commit detail view
pub fn render_commit_detail_view(
    commit: Option<&Commit>,
    diffs: &[FileDiff],
    weak_state: WeakEntity<AppState>,
) -> AnyElement {
    let Some(commit) = commit else {
        return div()
            .flex_1()
            .v_flex()
            .items_center()
            .justify_center()
            .child(
                div()
                    .text_sm()
                    .text_color(gpui::rgb(0x888888))
                    .child("No commit selected".to_string()),
            )
            .into_any_element();
    };

    let hash_short: String = commit.hash.chars().take(7).collect();
    let time_str = commit.time.format("%Y-%m-%d %H:%M:%S UTC").to_string();
    let summary = commit.summary.clone();
    let message = commit.message.clone();
    let summary_for_check = commit.summary.clone();
    let hash_full = commit.hash.clone();
    let author = commit.author.clone();
    let committer = commit.committer.clone();
    let parents_str = if commit.parents.is_empty() {
        "None (initial commit)".to_string()
    } else {
        commit.parents.join(", ")
    };

    div()
        .flex_1()
        .v_flex()
        .gap_3()
        // ---- 返回按钮 + 标题 ---- //
        .child(
            div()
                .flex()
                .items_center()
                .gap_3()
                .child({
                    let ws = weak_state.clone();
                    Button::new("detail-back")
                        .label("← Back")
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                s.selected_commit_detail = None;
                                s.selected_commit_diff.clear();
                                cx.notify();
                            });
                        })
                })
                .child(
                    div()
                        .text_lg()
                        .font_weight(FontWeight::BOLD)
                        .child(format!("Commit {}", hash_short)),
                ),
        )
        // ---- 提交消息 ---- //
        .child(
            div()
                .v_flex()
                .gap_2()
                .child(
                    div()
                        .text_sm()
                        .text_color(gpui::rgb(0xcccccc))
                        .child(summary),
                )
                .child(
                    div().text_xs().text_color(gpui::rgb(0x888888)).child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_1()
                            .child(format!("Hash: {}", hash_full))
                            .child(format!("Author: {} <committer: {}>", author, committer))
                            .child(format!("Date: {}", time_str))
                            .child(format!("Parents: {}", parents_str)),
                    ),
                ),
        )
        // ---- 完整消息正文 ---- //
        .when(message.len() > summary_for_check.len(), |col| {
            col.child(
                div()
                    .v_flex()
                    .gap_1()
                    .child(
                        div()
                            .text_sm()
                            .text_color(gpui::rgb(0xaaaaaa))
                            .child("Full message:"),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x888888))
                            .bg(gpui::rgb(0x1a1a1a))
                            .rounded(px(4.))
                            .p_3()
                            .child(message),
                    ),
            )
        })
        // ---- 变更文件列表 + Diff ---- //
        .child(
            div()
                .v_flex()
                .gap_2()
                .child(
                    div()
                        .text_sm()
                        .text_color(gpui::rgb(0xaaaaaa))
                        .child(format!("Changed files ({})", diffs.len())),
                )
                .when(diffs.is_empty(), |col| {
                    col.child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x666666))
                            .child("No file changes to display"),
                    )
                })
                .children(diffs.iter().map(|diff| {
                    let path_display = diff.path.display().to_string();
                    let is_bin = diff.is_binary;
                    div()
                        .v_flex()
                        .gap_1()
                        .child(
                            div()
                                .text_xs()
                                .text_color(gpui::rgb(0x4fc3f7))
                                .font_family("monospace")
                                .child(path_display),
                        )
                        .when(is_bin, |col| {
                            col.child(
                                div()
                                    .text_xs()
                                    .text_color(gpui::rgb(0xe57373))
                                    .child("Binary file — diff not shown"),
                            )
                        })
                        .when(!is_bin, |col| col.child(render_diff_lines(diff)))
                })),
        )
        .into_any_element()
}
