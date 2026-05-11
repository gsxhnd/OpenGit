//! 文件行组件 —— File row components
//!
//! 渲染单个文件条目的 UI 行，包括状态标签、路径和操作按钮（Stage/Unstage/Diff）。
//!
//! Renders individual file entry UI rows with status labels, paths,
//! and action buttons (Stage/Unstage/Diff).

use gpui::*;
use gpui_component::button::Button;
use gpui_component::Sizable;

use crate::app_state::{AppState, ViewType};
use ogit::{FileEntry, FileStatus};

/// 文件行操作类型 —— File row action types
///
/// 定义对文件行可执行的操作：暂存（Stage）或取消暂存（Unstage）。
///
/// Defines the two actions available on file rows.
pub enum FileRowAction {
    /// 暂存文件 —— Stage file
    Stage,
    /// 取消暂存文件 —— Unstage file
    Unstage,
}

/// 文件状态缩写标签 —— File status abbreviation label
///
/// 将 `FileStatus` 枚举映射为单字符缩写：
/// - M: 已修改 (Modified)
/// - A: 已添加 (Added)
/// - D: 已删除 (Deleted)
/// - R: 已重命名 (Renamed)
/// - ?: 未跟踪 (Untracked)
/// - !: 冲突 (Conflicted)
///
/// Maps FileStatus to a single-character abbreviation for display.
pub fn file_status_label(s: FileStatus) -> &'static str {
    match s {
        FileStatus::Modified => "M",
        FileStatus::Added => "A",
        FileStatus::Deleted => "D",
        FileStatus::Renamed => "R",
        FileStatus::Untracked => "?",
        FileStatus::Conflicted => "!",
        FileStatus::Unmodified => " ",
    }
}

/// 渲染单个文件行 —— Render a single file row
///
/// 显示文件状态标签、路径和操作按钮。
/// 点击按钮通过 `WeakEntity<AppState>` 触发 stage/unstage 操作。
///
/// Shows status label, path, and action button. Click triggers stage/unstage via WeakEntity.
pub fn render_file_row(
    id: impl Into<String>,
    entry: &FileEntry,
    action_label: &'static str,
    weak_state: WeakEntity<AppState>,
    action: FileRowAction,
) -> impl IntoElement {
    let path = entry.path.clone();
    let label = format!("[{}] {}", file_status_label(entry.status), path.display());
    let weak = weak_state;

    div()
        .id(id.into())
        .flex()
        .gap_2()
        .items_center()
        .py_1()
        .child(
            Button::new(gpui::SharedString::from(format!("act-{}", path.display())))
                .label(action_label)
                .small()
                .on_click(move |_, _, cx| {
                    let p = path.clone();
                    let _ = weak.update(cx, |state, cx| {
                        let r = match action {
                            FileRowAction::Stage => state.stage_path(&p),
                            FileRowAction::Unstage => state.unstage_path(&p),
                        };
                        if let Err(e) = r {
                            state.set_error(e.to_string());
                        }
                        cx.notify();
                    });
                }),
        )
        .child(
            div()
                .flex_1()
                .text_sm()
                .text_color(gpui::rgb(0xdddddd))
                .child(label),
        )
}

/// 渲染包含 Diff 按钮的文件行（用于 unstaged/untracked 文件） —— Render file row with diff button
pub fn render_unstaged_file_row(
    id_prefix: &str,
    entry: &FileEntry,
    weak_state: WeakEntity<AppState>,
    weak_self: WeakEntity<crate::OpenGitApp>,
) -> impl IntoElement {
    let ws = weak_state;
    let wo = weak_self;
    let path = entry.path.clone();

    div()
        .flex()
        .gap_1()
        .items_center()
        .child(render_file_row(
            format!("{}-{}", id_prefix, entry.path.display()),
            entry,
            "Stage",
            ws.clone(),
            FileRowAction::Stage,
        ))
        .child(
            Button::new(gpui::SharedString::from(format!(
                "diff-{}-{}",
                id_prefix,
                path.display()
            )))
            .label("Diff")
            .small()
            .on_click(move |_, _, cx| {
                let p = path.clone();
                let _ = ws.update(cx, |s, cx| {
                    let _ = s.set_diff_path(Some(p));
                    cx.notify();
                });
                let _ = wo.update(cx, |a, cx| {
                    a.active_view = ViewType::Diff;
                    cx.notify();
                });
            }),
        )
}

/// 渲染暂存文件行（含 Staged Diff 按钮） —— Render staged file row with staged diff button
pub fn render_staged_file_row(
    entry: &FileEntry,
    weak_state: WeakEntity<AppState>,
    weak_self: WeakEntity<crate::OpenGitApp>,
) -> impl IntoElement {
    let ws = weak_state;
    let wo = weak_self;
    let path = entry.path.clone();

    div()
        .flex()
        .gap_1()
        .items_center()
        .child(render_file_row(
            format!("s-{}", entry.path.display()),
            entry,
            "Unstage",
            ws.clone(),
            FileRowAction::Unstage,
        ))
        .child(
            Button::new(gpui::SharedString::from(format!(
                "sdiff-{}",
                path.display()
            )))
            .label("Diff")
            .small()
            .on_click(move |_, _, cx| {
                let p = path.clone();
                let _ = ws.update(cx, |s, cx| {
                    let _ = s.set_staged_diff_path(Some(p));
                    cx.notify();
                });
                let _ = wo.update(cx, |a, cx| {
                    a.active_view = ViewType::Diff;
                    cx.notify();
                });
            }),
        )
}
