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
/// 如果选择了文件（`diff_path` 非空），显示文件路径和差异内容。
/// 如果选择了文件但没有差异（文件未修改），显示空内容。
/// 如果未选择文件，显示提示信息"Select a file from Commit view"。
///
/// Shows file path and diff content if a file is selected.
/// Shows hint when no file is selected.
pub fn render_diff_view(
    diff_path: Option<&std::path::PathBuf>,
    diff_preview: Option<&FileDiff>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_2()
        // 文件路径标题 —— File path header
        .child(div().text_sm().child(match diff_path {
            Some(p) => format!("Diff: {}", p.display()),
            None => "Select a file from Commit view (click row)".to_string(),
        }))
        // 差异内容区域 —— Diff content area
        .when_some(diff_preview, |col, d: &ogit::FileDiff| {
            col.flex_1().min_h_0().child(render_diff_lines(d))
        })
        .into_any_element()
}
