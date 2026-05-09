//! 自定义标题栏 —— Custom title bar (chrome)
//!
//! 渲染应用的自定义窗口装饰，替代系统默认标题栏。
//! 包含：应用菜单栏、仓库名、Fetch/Pull/Push 按钮和平台窗口控制按钮。
//! 支持窗口拖拽（通过自定义 ChromeDragState）。
//!
//! Renders custom window chrome: menu bar, repo name, action buttons, window controls.
//! Supports window dragging via ChromeDragState.

use std::rc::Rc;

use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::Button;
use gpui_component::menu::AppMenuBar;
use gpui_component::*;

/// 标题栏高度 (px) —— Title bar height in pixels
pub const CHROME_BAR_H: Pixels = px(40.);

/// 窗口控制操作类型 —— Window control operation type
#[derive(Clone, Copy)]
enum ChromeWindowOp {
    Minimize,
    Zoom,
    Close,
}

/// 拖拽状态 —— Drag state for window movement
#[derive(Default)]
struct ChromeDragState {
    should_move: bool,
}

/// 自定义标题栏组件 —— Custom title bar component
///
/// 使用 `IntoElement` derive 实现 `RenderOnce`。
/// 通过 Builder 模式注入回调（Fetch/Pull/Push/OpenRepo）。
/// 未来计划改为 GPUI Entity 以支持响应式状态更新。
///
/// Uses `IntoElement` derive with Builder pattern for callback injection.
/// Planned to migrate to GPUI Entity for reactive state updates.
#[derive(IntoElement)]
pub struct TitleBar {
    repo_name: String,
    has_repo: bool,
    menu_bar: Entity<AppMenuBar>,
    on_open_repo: Option<Rc<dyn Fn(&mut Window, &mut App)>>,
    on_fetch: Option<Rc<dyn Fn(&mut Window, &mut App)>>,
    on_pull: Option<Rc<dyn Fn(&mut Window, &mut App)>>,
    on_push: Option<Rc<dyn Fn(&mut Window, &mut App)>>,
}

impl TitleBar {
    /// 创建标题栏 —— Create title bar
    pub fn new(
        repo_name: impl Into<String>,
        has_repo: bool,
        menu_bar: Entity<AppMenuBar>,
    ) -> Self {
        Self {
            repo_name: repo_name.into(),
            has_repo,
            menu_bar,
            on_open_repo: None,
            on_fetch: None,
            on_pull: None,
            on_push: None,
        }
    }

    pub fn on_open_repo(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_open_repo = Some(Rc::new(f));
        self
    }

    pub fn on_fetch(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_fetch = Some(Rc::new(f));
        self
    }

    pub fn on_pull(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_pull = Some(Rc::new(f));
        self
    }

    pub fn on_push(mut self, f: impl Fn(&mut Window, &mut App) + 'static) -> Self {
        self.on_push = Some(Rc::new(f));
        self
    }
}

/// 渲染窗口控制按钮 —— Render window control button
///
/// 根据平台处理窗口控制按钮：
/// - Windows: 使用原生 `window_control_area`
/// - macOS/Linux/FreeBSD: 手动处理点击事件
/// - 关闭按钮使用危险色主题（红色）
///
/// Platform-aware: native area on Windows, manual clicks elsewhere. Close button uses danger colors.
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
                        let on_fetch = on_fetch.clone();
                        row.child(
                            Button::new("fetch")
                                .label("Fetch")
                                .small()
                                .on_click(move |_, window, cx| {
                                    if let Some(f) = &on_fetch {
                                        f(window, cx);
                                    }
                                }),
                        )
                    })
                    .when(has_repo, |row| {
                        let on_pull = on_pull.clone();
                        row.child(
                            Button::new("pull")
                                .label("Pull")
                                .small()
                                .on_click(move |_, window, cx| {
                                    if let Some(f) = &on_pull {
                                        f(window, cx);
                                    }
                                }),
                        )
                    })
                    .when(has_repo, |row| {
                        let on_push = on_push.clone();
                        row.child(
                            Button::new("push")
                                .label("Push")
                                .small()
                                .on_click(move |_, window, cx| {
                                    if let Some(f) = &on_push {
                                        f(window, cx);
                                    }
                                }),
                        )
                    })
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
