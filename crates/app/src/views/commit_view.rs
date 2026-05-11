//! 提交视图 —— Commit view
//!
//! 显示工作区文件变更列表（unstaged / untracked / staged），
//! 提供 Stage/Unstage/Diff 操作按钮，以及提交消息输入和 amend 切换。
//!
//! Displays working tree file changes with stage/unstage/diff actions,
//! commit message input, and amend toggle.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app::{AppState, ViewType};
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
fn render_unstaged_file_row(
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
fn render_staged_file_row(
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
///
/// 布局结构：
/// 1. Unstaged 区域（未暂存文件 + 未跟踪文件）+ Stage All 按钮
/// 2. Staged 区域（已暂存文件）+ Unstage All 按钮
/// 3. 提交消息输入区域（含字符提示）
/// 4. 提交按钮 + Amend 切换
///
/// Layout: unstaged files → staged files → commit message → commit button + amend toggle.
#[allow(clippy::too_many_arguments)]
pub fn render_commit_view(
    unstaged: &[FileEntry],
    untracked: &[FileEntry],
    staged: &[FileEntry],
    amend: bool,
    commit_message: &Entity<InputState>,
    app_entity: Entity<AppState>,
    weak_state: WeakEntity<AppState>,
    weak_self: WeakEntity<crate::OpenGitApp>,
) -> AnyElement {
    let has_staged = !staged.is_empty();
    let has_unstaged = !unstaged.is_empty() || !untracked.is_empty();

    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        // ---- Unstaged 标签 ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Unstaged"),
        )
        // ---- Stage All 按钮 ---- //
        .when(has_unstaged, |col: Div| {
            let ws = weak_state.clone();
            col.child(
                Button::new("stage-all")
                    .label("Stage All")
                    .small()
                    .on_click(move |_, _, cx| {
                        let _ = ws.update(cx, |s, cx| {
                            if let Err(e) = s.stage_all() {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }),
            )
        })
        // ---- Unstaged + Untracked 文件列表 ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                // 未暂存文件 —— Unstaged files
                .children(unstaged.iter().map(|e| {
                    render_unstaged_file_row("u", e, weak_state.clone(), weak_self.clone())
                }))
                // 未跟踪文件 —— Untracked files
                .children(untracked.iter().map(|e| {
                    render_unstaged_file_row("n", e, weak_state.clone(), weak_self.clone())
                })),
        )
        // ---- Staged 标签 ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Staged"),
        )
        // ---- Unstage All 按钮 ---- //
        .when(has_staged, |col: Div| {
            let ws = weak_state.clone();
            col.child(
                Button::new("unstage-all")
                    .label("Unstage All")
                    .small()
                    .on_click(move |_, _, cx| {
                        let _ = ws.update(cx, |s, cx| {
                            if let Err(e) = s.unstage_all() {
                                s.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                    }),
            )
        })
        // ---- Staged 文件列表 ---- //
        .child(
            div().flex_1().min_h_0().v_flex().gap_1().children(
                staged
                    .iter()
                    .map(|e| render_staged_file_row(e, weak_state.clone(), weak_self.clone())),
            ),
        )
        // ---- 提交消息输入 ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Message"),
        )
        .child(Input::new(commit_message).w_full().h(px(100.)))
        // ---- 提交按钮 + Amend 切换 ---- //
        .child(
            div()
                .flex()
                .gap_2()
                .child({
                    // 提交按钮：读取消息和 amend 状态，执行 commit —— Commit button
                    let app_e = app_entity.clone();
                    let msg_e = commit_message.clone();
                    Button::new("commit-btn")
                        .label("Commit")
                        .primary()
                        .on_click(move |_, window, cx| {
                            let msg = cx.read_entity(&msg_e, |i, _| i.value().to_string());
                            let staged_count = cx.read_entity(&app_e, |s, _| {
                                s.repo_status.status.staged_files.len()
                            });
                            // 验证：消息不能为空 —— Validate: message must not be empty
                            if msg.trim().is_empty() {
                                app_e.update(cx, |s, cx| {
                                    s.set_error("Commit message is empty".into());
                                    cx.notify();
                                });
                                return;
                            }
                            // 验证：必须有暂存文件 —— Validate: must have staged files
                            if staged_count == 0 {
                                app_e.update(cx, |s, cx| {
                                    s.set_error("No staged files to commit".into());
                                    cx.notify();
                                });
                                return;
                            }
                            let amend = cx.read_entity(&app_e, |s, _| s.commit_amend);
                            app_e.update(cx, |s, cx| {
                                if let Err(e) = s.commit_staged(&msg, amend) {
                                    s.set_error(e.to_string());
                                    cx.notify();
                                    return;
                                }
                                cx.notify();
                            });
                            // 仅提交成功时清空消息 —— Only clear message on success
                            if app_e.read(cx).error.is_none() {
                                msg_e.update(cx, |inp, cx| {
                                    inp.set_value("", window, cx);
                                });
                            }
                        })
                })
                .child({
                    // Amend 切换按钮 —— Amend toggle button
                    let ws = weak_state.clone();
                    Button::new("amend-toggle")
                        .label(if amend { "Amend: on" } else { "Amend: off" })
                        .small()
                        .on_click(move |_, _, cx| {
                            let _ = ws.update(cx, |s, cx| {
                                s.commit_amend = !s.commit_amend;
                                cx.notify();
                            });
                        })
                }),
        )
        // ---- 提交消息字符提示 —— Commit message character hint ---- //
        .child({
            div()
                .text_xs()
                .text_color(gpui::rgb(0x666666))
                .child("Tip: First line is the commit title (keep under 72 characters)")
        })
        .into_any_element()
}
