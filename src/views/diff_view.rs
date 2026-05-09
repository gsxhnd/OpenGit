use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::StyledExt;

use crate::git::model::{DiffLine, FileDiff};

pub fn render_diff_lines(diff: &FileDiff) -> impl IntoElement {
    div()
        .flex_1()
        .font_family("monospace")
        .text_xs()
        .children(diff.hunks.iter().flat_map(|h| {
            h.lines.iter().map(|l: &DiffLine| {
                let color = match l.prefix {
                    '+' => gpui::rgb(0x6abf69),
                    '-' => gpui::rgb(0xe57373),
                    _ => gpui::rgb(0xaaaaaa),
                };
                div()
                    .text_color(color)
                    .child(format!("{} {}", l.prefix, l.content))
            })
        }))
}

pub fn render_diff_view(
    diff_path: Option<&std::path::PathBuf>,
    diff_preview: Option<&FileDiff>,
) -> AnyElement {
    div()
        .flex_1()
        .min_h_0()
        .v_flex()
        .gap_2()
        .child(div().text_sm().child(match diff_path {
            Some(p) => format!("Diff: {}", p.display()),
            None => "Select a file from Commit view (click row)".to_string(),
        }))
        .when_some(diff_preview, |col, d: &crate::git::model::FileDiff| {
            col.flex_1().min_h_0().child(render_diff_lines(d))
        })
        .into_any_element()
}
