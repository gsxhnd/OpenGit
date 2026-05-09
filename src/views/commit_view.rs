use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::{Sizable, StyledExt};

use crate::app::{AppState, ViewType};
use crate::git::model::{FileEntry, FileStatus};

pub enum FileRowAction {
    Stage,
    Unstage,
}

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

pub fn render_file_row(
    id: impl Into<String>,
    entry: &FileEntry,
    action_label: &'static str,
    weak_state: WeakEntity<AppState>,
    action: FileRowAction,
) -> impl IntoElement {
    let path = entry.path.clone();
    let label = format!(
        "[{}] {}",
        file_status_label(entry.status),
        path.display()
    );
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
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_3()
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Unstaged"),
        )
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .children(unstaged.iter().map(|e| {
                    let ws = weak_state.clone();
                    let wo = weak_self.clone();
                    let path = e.path.clone();
                    div()
                        .flex()
                        .gap_1()
                        .items_center()
                        .child(render_file_row(
                            format!("u-{}", e.path.display()),
                            e,
                            "Stage",
                            ws.clone(),
                            FileRowAction::Stage,
                        ))
                        .child(
                            Button::new(gpui::SharedString::from(format!(
                                "diff-u-{}",
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
                }))
                .children(untracked.iter().map(|e| {
                    let ws = weak_state.clone();
                    let wo = weak_self.clone();
                    let path = e.path.clone();
                    div()
                        .flex()
                        .gap_1()
                        .items_center()
                        .child(render_file_row(
                            format!("n-{}", e.path.display()),
                            e,
                            "Stage",
                            ws.clone(),
                            FileRowAction::Stage,
                        ))
                        .child(
                            Button::new(gpui::SharedString::from(format!(
                                "diff-n-{}",
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
                })),
        )
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Staged"),
        )
        .child(
            div()
                .flex_1()
                .min_h_0()
                .v_flex()
                .gap_1()
                .children(staged.iter().map(|e| {
                    let ws = weak_state.clone();
                    render_file_row(
                        format!("s-{}", e.path.display()),
                        e,
                        "Unstage",
                        ws,
                        FileRowAction::Unstage,
                    )
                })),
        )
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0xcccccc))
                .child("Message"),
        )
        .child(Input::new(commit_message).w_full().h(px(100.)))
        .child(
            div()
                .flex()
                .gap_2()
                .child({
                    let app_e = app_entity.clone();
                    let msg_e = commit_message.clone();
                    Button::new("commit-btn")
                        .label("Commit")
                        .primary()
                        .on_click(move |_, window, cx| {
                            let msg =
                                cx.read_entity(&msg_e, |i, _| i.value().to_string());
                            let amend = cx.read_entity(&app_e, |s, _| s.commit_amend);
                            let _ = app_e.update(cx, |s, cx| {
                                if let Err(e) = s.commit_staged(&msg, amend) {
                                    s.set_error(e.to_string());
                                }
                                cx.notify();
                            });
                            let _ = msg_e.update(cx, |inp, cx| {
                                inp.set_value("", window, cx);
                            });
                        })
                })
                .child({
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
        .into_any_element()
}
