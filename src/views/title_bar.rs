use std::rc::Rc;

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::menu::AppMenuBar;
use gpui_component::*;

use crate::app::AppState;

pub const CHROME_BAR_H: Pixels = px(40.);

#[derive(Clone, Copy)]
enum ChromeWindowOp {
    Minimize,
    Zoom,
    Close,
}

#[derive(Default)]
struct ChromeDragState {
    should_move: bool,
}

/// Custom title bar / chrome for the main window.
///
/// Renders the app menu, repo name, action buttons (Fetch / Pull / Push / Open),
/// and platform window controls (minimize / zoom / close).
#[derive(IntoElement)]
pub struct TitleBar {
    repo_name: String,
    has_repo: bool,
    current_branch: String,
    menu_bar: Entity<AppMenuBar>,
    weak_state: WeakEntity<AppState>,
    on_open_repo: Option<Rc<dyn Fn(&mut Window, &mut App)>>,
}

impl TitleBar {
    pub fn new(
        repo_name: impl Into<String>,
        has_repo: bool,
        current_branch: impl Into<String>,
        menu_bar: Entity<AppMenuBar>,
        weak_state: WeakEntity<AppState>,
    ) -> Self {
        Self {
            repo_name: repo_name.into(),
            has_repo,
            current_branch: current_branch.into(),
            menu_bar,
            weak_state,
            on_open_repo: None,
        }
    }

    pub fn on_open_repo(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_open_repo = Some(Rc::new(f));
        self
    }
}

fn window_control_btn(
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
            .hover(|s| s.bg(cx.theme().danger).text_color(cx.theme().danger_foreground))
            .active(|s| s.bg(cx.theme().danger_active).text_color(cx.theme().danger_foreground));
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
    if use_manual_click {
        if let Some(op) = op {
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
    }

    d.child(Icon::new(icon).small())
}

impl RenderOnce for TitleBar {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let is_maximized = window.is_maximized();
        let use_manual_click = cfg!(any(
            target_os = "linux",
            target_os = "freebsd",
            target_os = "macos"
        ));

        let chrome_drag = window.use_state(cx, |_, _| ChromeDragState { should_move: false });

        let has_repo = self.has_repo;
        let current_branch = self.current_branch;
        let weak_state = self.weak_state;
        let on_open_repo = self.on_open_repo;

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
            .when(cfg!(target_os = "linux"), |this| {
                this.on_double_click(|_, window, _| window.zoom_window())
            })
            .when(cfg!(target_os = "macos"), |this| {
                this.on_double_click(|_, window, _| window.titlebar_double_click())
            })
            .on_mouse_down_out(window.listener_for(&chrome_drag, |state, _, _, _| {
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
            .on_mouse_move(window.listener_for(&chrome_drag, |state, _, window, _| {
                if state.should_move {
                    state.should_move = false;
                    window.start_window_move();
                }
            }))
            .relative()
            .child(
                h_flex()
                    .h_full()
                    .min_w_0()
                    .flex_1()
                    .items_center()
                    .gap_2()
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
                    .child(
                        div()
                            .flex_1()
                            .h_full()
                            .min_w(px(48.))
                            .window_control_area(WindowControlArea::Drag),
                    ),
            )
            .child(
                h_flex()
                    .h_full()
                    .items_center()
                    .gap_2()
                    .when(has_repo, |row| {
                        let ws = weak_state.clone();
                        row.child(
                            Button::new("fetch")
                                .label("Fetch")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.fetch_origin() {
                                            s.set_error(e.to_string());
                                        }
                                        cx.notify();
                                    });
                                }),
                        )
                    })
                    .when(has_repo, |row| {
                        let ws = weak_state.clone();
                        let branch = current_branch.clone();
                        row.child(
                            Button::new("pull")
                                .label("Pull")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let b = branch.clone();
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.pull_origin(&b) {
                                            s.set_error(e.to_string());
                                        }
                                        cx.notify();
                                    });
                                }),
                        )
                    })
                    .when(has_repo, |row| {
                        let ws = weak_state.clone();
                        let branch = current_branch.clone();
                        row.child(
                            Button::new("push")
                                .label("Push")
                                .small()
                                .on_click(move |_, _, cx| {
                                    let b = branch.clone();
                                    let _ = ws.update(cx, |s, cx| {
                                        if let Err(e) = s.push_origin(&b) {
                                            s.set_error(e.to_string());
                                        }
                                        cx.notify();
                                    });
                                }),
                        )
                    })
                    // .child({
                    //     Button::new("open-repo")
                    //         .label("Open Repository")
                    //         .primary()
                    //         .on_click(move |_, window, cx| {
                    //             if let Some(f) = &on_open_repo {
                    //                 f(window, cx);
                    //             }
                    //         })
                    // })
                    .child(
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
                                if is_maximized { "win-restore" } else { "win-max" },
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
                    ),
            )
    }
}
