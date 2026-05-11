//! 差异视图 —— Diff view
//!
//! 显示文件的差异内容，使用等宽字体和颜色编码：
//! - 绿色：新增行 (+)
//! - 红色：删除行 (-)
//! - 灰色：上下文行 ( )
//!
//! Displays file diff with monospace font and color-coded lines:
//! green for additions, red for deletions, gray for context.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::StyledExt;

use ogit::{DiffLine, FileDiff};

/// 渲染差异行 —— Render diff lines
///
/// 遍历所有 hunk 中的所有行，根据前缀设置颜色：
/// - '+' → 绿色（新增）
/// - '-' → 红色（删除）
/// - ' ' → 灰色（上下文）
///
/// Iterates all hunks/lines with color based on prefix:
/// '+' → green (added), '-' → red (deleted), ' ' → gray (context).
pub fn render_diff_lines(diff: &FileDiff) -> impl IntoElement {
    div()
        .flex_1()
        .font_family("monospace") // 等宽字体 —— Monospace font for alignment
        .text_xs()
        .children(diff.hunks.iter().flat_map(|h| {
            h.lines.iter().map(|l: &DiffLine| {
                let color = match l.prefix {
                    '+' => gpui::rgb(0x6abf69), // 绿色 —— Green
                    '-' => gpui::rgb(0xe57373), // 红色 —— Red
                    _ => gpui::rgb(0xaaaaaa),   // 灰色 —— Gray
                };
                div()
                    .text_color(color)
                    .child(format!("{} {}", l.prefix, l.content))
            })
        }))
}

/// 渲染差异视图 —— Render diff view
///
/// 如果选择了文件（`diff_path` 或 `staged_diff_path` 非空），显示文件路径和差异内容。
/// 支持两种模式：
/// - Working tree diff: 工作区 vs 索引
/// - Staged diff: 暂存区 vs HEAD
///
/// 如果未选择文件，显示提示信息。
///
/// Shows file path and diff content if a file is selected. Supports both working-tree
/// and staged diff modes.
pub fn render_diff_view(
    diff_path: Option<&std::path::PathBuf>,
    staged_diff_path: Option<&std::path::PathBuf>,
    diff_preview: Option<&FileDiff>,
) -> AnyElement {
    let path_label = match (diff_path, staged_diff_path) {
        (Some(p), _) => format!("Working diff: {}", p.display()),
        (_, Some(p)) => format!("Staged diff: {}", p.display()),
        (None, None) => "Select a file from Commit view (click Diff)".to_string(),
    };
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_2()
        // 文件路径标题 —— File path header
        .child(div().text_sm().child(path_label))
        // 差异内容区域 —— Diff content area
        .when_some(diff_preview, |col, d: &ogit::FileDiff| {
            col.child(
                div()
                    .flex_1()
                    .min_h_0()
                    .v_flex()
                    .when(d.is_binary, |c| {
                        c.child(
                            div()
                                .text_sm()
                                .text_color(gpui::rgb(0xe57373))
                                .child("Binary file — diff not shown"),
                        )
                    })
                    .when(!d.is_binary, |c| c.child(render_diff_lines(d))),
            )
        })
        .into_any_element()
}
