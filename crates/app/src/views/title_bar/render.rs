//! 标题栏渲染 —— Title bar rendering
//!
//! `TitleBar` 的 `RenderOnce` trait 实现。
//! 构建完整的标题栏 UI 树：菜单区 + 仓库名 + 操作按钮 + 窗口控制。
//!
//! RenderOnce implementation for TitleBar.
//! Builds the complete title bar UI: menu area + repo name + action buttons + window controls.

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::*;

use super::window_controls::{ChromeWindowOp, window_control_btn};
use super::{CHROME_BAR_H, ChromeDragState, TitleBar};

impl RenderOnce for TitleBar {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let is_maximized = window.is_maximized();
        let is_windows = cfg!(target_os = "windows");
        let use_manual_click = cfg!(any(
            target_os = "linux",
            target_os = "freebsd",
            target_os = "macos"
        ));

        let chrome_drag = window.use_state(cx, |_, _| ChromeDragState { should_move: false });

        let has_repo = self.has_repo;
        let on_fetch = self.on_fetch;
        let on_pull = self.on_pull;
        let on_push = self.on_push;
        let _on_open_repo = self.on_open_repo;

        div()
            .id("opengit-chrome")
            .flex_shrink_0()
            .flex()
            .flex_row()
            .items_center()
            .justify_between()
            .h(CHROME_BAR_H)
            .border_b(px(1.))
            .border_color(gpui::rgb(0x333333))
            .bg(gpui::rgb(0x1e1e1e))
            .when(is_windows, |this| {
                this.window_control_area(WindowControlArea::Drag)
            })
            .when(cfg!(target_os = "linux"), |this| {
                this.on_double_click(|_, window, _| window.zoom_window())
            })
            .when(cfg!(target_os = "macos"), |this| {
                this.on_double_click(|_, window, _| window.titlebar_double_click())
            })
            .when(!is_windows, |this| {
                this.on_mouse_down_out(window.listener_for(&chrome_drag, |state, _, _, _| {
                    state.should_move = false;
                }))
                .on_mouse_down(
                    MouseButton::Left,
                    window.listener_for(&chrome_drag, |state, _, _, _| {
                        state.should_move = true;
                    }),
                )
                .on_mouse_up(
                    MouseButton::Left,
                    window.listener_for(&chrome_drag, |state, _, _, _| {
                        state.should_move = false;
                    }),
                )
                .on_mouse_move(window.listener_for(
                    &chrome_drag,
                    |state, _, window, _| {
                        if state.should_move {
                            state.should_move = false;
                            window.start_window_move();
                        }
                    },
                ))
            })
            .relative()
            .child(
                h_flex()
                    .h_full()
                    .min_w_0()
                    .flex_1()
                    .items_center()
                    .gap_2()
                    .when(cfg!(target_os = "macos"), |this| {
                        this.child(div().w(px(80.)).h_full())
                    })
                    .child(self.menu_bar)
                    .child(
                        div()
                            .text_sm()
                            .font_weight(gpui::FontWeight::BOLD)
                            .child("OpenGit"),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x888888))
                            .truncate()
                            .child(self.repo_name),
                    )
                    .when(cfg!(target_os = "linux"), |this| {
                        this.child(div().flex_1().h_full().min_w(px(48.)))
                    }),
            )
            .child(
                h_flex()
                    .h_full()
                    .items_center()
                    .gap_2()
                    .when(has_repo, |row| {
                        let on_fetch = on_fetch.clone();
                        row.child(Button::new("fetch").label("Fetch").small().on_click(
                            move |_, window, cx| {
                                if let Some(f) = &on_fetch {
                                    f(window, cx);
                                }
                            },
                        ))
                    })
                    .when(has_repo, |row| {
                        let on_pull = on_pull.clone();
                        row.child(Button::new("pull").label("Pull").small().on_click(
                            move |_, window, cx| {
                                if let Some(f) = &on_pull {
                                    f(window, cx);
                                }
                            },
                        ))
                    })
                    .when(has_repo, |row| {
                        let on_push = on_push.clone();
                        row.child(Button::new("push").label("Push").small().on_click(
                            move |_, window, cx| {
                                if let Some(f) = &on_push {
                                    f(window, cx);
                                }
                            },
                        ))
                    })
                    .when(!cfg!(target_os = "macos"), |row| {
                        row.child(
                            h_flex()
                                .id("opengit-window-controls")
                                .items_center()
                                .flex_shrink_0()
                                .h_full()
                                .child(window_control_btn(
                                    "win-min",
                                    IconName::WindowMinimize,
                                    WindowControlArea::Min,
                                    false,
                                    use_manual_click.then_some(ChromeWindowOp::Minimize),
                                    cx,
                                ))
                                .child(window_control_btn(
                                    if is_maximized {
                                        "win-restore"
                                    } else {
                                        "win-max"
                                    },
                                    if is_maximized {
                                        IconName::WindowRestore
                                    } else {
                                        IconName::WindowMaximize
                                    },
                                    WindowControlArea::Max,
                                    false,
                                    use_manual_click.then_some(ChromeWindowOp::Zoom),
                                    cx,
                                ))
                                .child(window_control_btn(
                                    "win-close",
                                    IconName::WindowClose,
                                    WindowControlArea::Close,
                                    true,
                                    use_manual_click.then_some(ChromeWindowOp::Close),
                                    cx,
                                )),
                        )
                    }),
            )
    }
}
