//! 窗口控制按钮 —— Window control buttons
//!
//! 渲染自定义窗口控制按钮（最小化/最大化/关闭），支持多平台。
//!
//! Renders custom window control buttons (minimize/maximize/close) with cross-platform support.

use gpui::*;
use gpui_component::*;

use super::CHROME_BAR_H;

/// 窗口控制操作类型 —— Window control operation type
#[derive(Clone, Copy)]
pub(super) enum ChromeWindowOp {
    Minimize,
    Zoom,
    Close,
}

/// 渲染窗口控制按钮 —— Render window control button
///
/// - Windows: 使用原生 `window_control_area`
/// - macOS/Linux/FreeBSD: 手动处理点击事件
/// - 关闭按钮使用危险色主题（红色）
///
/// Platform-aware: native area on Windows, manual clicks elsewhere. Close button uses danger colors.
pub(super) fn window_control_btn(
    id: &'static str,
    icon: IconName,
    area: WindowControlArea,
    is_close: bool,
    op: Option<ChromeWindowOp>,
    cx: &App,
) -> impl IntoElement {
    let is_windows = cfg!(target_os = "windows");
    let use_manual_click = cfg!(any(
        target_os = "linux",
        target_os = "freebsd",
        target_os = "macos"
    ));

    let mut d = div()
        .id(id)
        .flex()
        .w(CHROME_BAR_H)
        .h_full()
        .flex_shrink_0()
        .justify_center()
        .content_center()
        .items_center()
        .text_color(cx.theme().foreground);

    if is_close {
        d = d
            .hover(|s| {
                s.bg(cx.theme().danger)
                    .text_color(cx.theme().danger_foreground)
            })
            .active(|s| {
                s.bg(cx.theme().danger_active)
                    .text_color(cx.theme().danger_foreground)
            });
    } else {
        d = d
            .hover(|s| {
                s.bg(cx.theme().secondary_hover)
                    .text_color(cx.theme().secondary_foreground)
            })
            .active(|s| {
                s.bg(cx.theme().secondary_active)
                    .text_color(cx.theme().secondary_foreground)
            });
    }

    if is_windows {
        d = d.window_control_area(area);
    }
    if use_manual_click && let Some(op) = op {
        d = d
            .on_mouse_down(MouseButton::Left, |_, window, cx| {
                window.prevent_default();
                cx.stop_propagation();
            })
            .on_click(move |_, window, cx| {
                cx.stop_propagation();
                match op {
                    ChromeWindowOp::Minimize => window.minimize_window(),
                    ChromeWindowOp::Zoom => window.zoom_window(),
                    ChromeWindowOp::Close => window.remove_window(),
                }
            });
    }

    d.child(Icon::new(icon).small())
}
