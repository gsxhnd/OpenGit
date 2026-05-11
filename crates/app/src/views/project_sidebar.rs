//! 项目侧边栏 —— Project sidebar
//!
//! 显示工作空间中的项目列表，支持：
//! - 搜索过滤项目
//! - 按分组展示项目
//! - 项目切换和移除
//! - 添加新项目
//!
//! Shows workspace project list with search, grouping, switch, and remove.

use gpui::prelude::*;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::scroll::ScrollableElement as _;
use gpui_component::{Sizable, StyledExt};

use crate::settings::WorkspaceEntry;
use crate::workspace::CachedStatus;

/// 预渲染的行数据 —— Pre-extracted row data (no cx required during rendering)
struct ProjectRowData {
    entry: WorkspaceEntry,
    index: usize,
    is_active: bool,
    status: Option<CachedStatus>,
}

/// 渲染项目侧边栏 —— Render project sidebar
pub fn render_project_sidebar(
    entries: &[WorkspaceEntry],
    statuses: &std::collections::HashMap<std::path::PathBuf, CachedStatus>,
    _active_index: usize,
    active_path: Option<&std::path::PathBuf>,
    search_query: &str,
    weak_self: WeakEntity<crate::OpenGitApp>,
) -> AnyElement {
    let filtered: Vec<&WorkspaceEntry> = if search_query.is_empty() {
        entries.iter().collect()
    } else {
        let q = search_query.to_lowercase();
        entries
            .iter()
            .filter(|e| {
                e.name.to_lowercase().contains(&q)
                    || e.path.to_string_lossy().to_lowercase().contains(&q)
            })
            .collect()
    };

    let row_data: Vec<ProjectRowData> = filtered
        .into_iter()
        .map(|entry| {
            let real_idx = entries
                .iter()
                .position(|e| e.path == entry.path)
                .unwrap_or(0);
            let is_active = active_path == Some(&entry.path);
            let status = statuses.get(&entry.path).cloned();
            ProjectRowData {
                entry: entry.clone(),
                index: real_idx,
                is_active,
                status,
            }
        })
        .collect();

    let wo = weak_self.clone();
    let wo2 = weak_self;

    div()
        .h_full()
        .min_w_0()
        .v_flex()
        .gap_2()
        // ---- 标题 + 搜索提示 —— Title + search hint ---- //
        .child(
            div()
                .text_xs()
                .text_color(gpui::rgb(0x888888))
                .child("Projects"),
        )
        // ---- 添加项目按钮 —— Add project button ---- //
        .child({
            let w = wo.clone();
            Button::new("add-project")
                .label("+ Add Project")
                .small()
                .w_full()
                .on_click(move |_, window, cx| {
                    let _ = w.update(cx, |app, cx| {
                        app.prompt_open_repository(window, cx);
                    });
                })
        })
        // ---- 项目列表 —— Project list ---- //
        .child(
            div()
                .flex_1()
                .min_h_0()
                .overflow_y_scrollbar()
                .v_flex()
                .gap_1()
                .children(row_data.into_iter().map(|row| {
                    let is_active = row.is_active;
                    let path = row.entry.path.clone();
                    let name = row.entry.name.clone();
                    let idx = row.index;
                    let ws = wo2.clone();
                    let status = row.status;

                    let branch = match &status {
                        Some(s) if s.ok => s.branch.clone().unwrap_or_else(|| "-".into()),
                        Some(_) => "(error)".into(),
                        None => "...".into(),
                    };
                    let status_line = match &status {
                        Some(s) if s.ok => format!(
                            "{}↑{} ↓{} · ✎{} 📦{}",
                            if s.has_conflict { "⚠ " } else { "" },
                            s.ahead,
                            s.behind,
                            s.changed,
                            s.staged
                        ),
                        _ => String::new(),
                    };

                    div()
                        .flex()
                        .flex_col()
                        .py_1()
                        .px_2()
                        .rounded(px(2.))
                        .gap_0()
                        .bg(if is_active {
                            gpui::rgb(0x2a3a2a)
                        } else {
                            gpui::rgb(0x1a1a1a)
                        })
                        .child(
                            div()
                                .flex()
                                .justify_between()
                                .items_center()
                                .child(
                                    div()
                                        .text_sm()
                                        .text_color(gpui::rgb(0xdddddd))
                                        .truncate()
                                        .child(name.clone()),
                                )
                                .child(
                                    div()
                                        .flex()
                                        .gap_1()
                                        .child({
                                            let p = path.clone();
                                            let w = ws.clone();
                                            Button::new(gpui::SharedString::from(format!(
                                                "open-{}",
                                                p.display()
                                            )))
                                            .label("→")
                                            .small()
                                            .on_click(move |_, _, cx| {
                                                let _ = w.update(cx, |app, cx| {
                                                    app.switch_to_project(cx, idx);
                                                });
                                            })
                                        })
                                        .child({
                                            let p = path.clone();
                                            let w = ws.clone();
                                            Button::new(gpui::SharedString::from(format!(
                                                "rm-{}",
                                                p.display()
                                            )))
                                            .label("✕")
                                            .small()
                                            .on_click(move |_, _, cx| {
                                                let _ = w.update(cx, |app, cx| {
                                                    app.remove_project(cx, p.clone());
                                                });
                                            })
                                        }),
                                ),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(gpui::rgb(0x4dd0e1))
                                .child(branch),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(gpui::rgb(0x888888))
                                .child(status_line),
                        )
                        .into_any_element()
                })),
        )
        .into_any_element()
}
