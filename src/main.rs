use gpui::prelude::FluentBuilder as _;
use gpui::*;
use gpui_component::button::{Button, ButtonVariants as _};
use gpui_component::input::{Input, InputState};
use gpui_component::menu::AppMenuBar;
use gpui_component::resizable::{h_resizable, resizable_panel};
use gpui_component::*;
use std::path::PathBuf;

mod app;
mod git;
mod views;

use app::{AppState, ViewType};
use git::model::{DiffLine, FileDiff, FileEntry, FileStatus};

actions!(open_git, [OpenRepository, QuitApp, MenuFetch, MenuPull, MenuPush]);

/// Transparent title bar without gpui-component `TitleBar` positioning of native traffic lights.
/// On macOS, native buttons are moved far off-screen so the in-app chrome is fully custom.
fn opengit_titlebar_options() -> TitlebarOptions {
    TitlebarOptions {
        title: Some("OpenGit".into()),
        appears_transparent: true,
        #[cfg(target_os = "macos")]
        traffic_light_position: Some(point(px(-200.), px(12.))),
        #[cfg(not(target_os = "macos"))]
        traffic_light_position: None,
    }
}

const CHROME_BAR_H: Pixels = px(40.);

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

/// Custom window controls (minimize / zoom / close) for all platforms, including macOS where
/// `TitleBar` would otherwise omit drawn buttons.
fn opengit_window_controls(window: &mut Window, cx: &App) -> impl IntoElement {
    let is_windows = cfg!(target_os = "windows");
    let use_manual_click = cfg!(any(
        target_os = "linux",
        target_os = "freebsd",
        target_os = "macos"
    ));
    let maximized = window.is_maximized();

    let chrome_btn = |id: &'static str,
                      icon: IconName,
                      area: WindowControlArea,
                      close: bool,
                      op: Option<ChromeWindowOp>| {
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
        if close {
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
    };

    h_flex()
        .id("opengit-window-controls")
        .items_center()
        .flex_shrink_0()
        .h_full()
        .child(chrome_btn(
            "win-min",
            IconName::WindowMinimize,
            WindowControlArea::Min,
            false,
            use_manual_click.then_some(ChromeWindowOp::Minimize),
        ))
        .child(chrome_btn(
            if maximized {
                "win-restore"
            } else {
                "win-max"
            },
            if maximized {
                IconName::WindowRestore
            } else {
                IconName::WindowMaximize
            },
            WindowControlArea::Max,
            false,
            use_manual_click.then_some(ChromeWindowOp::Zoom),
        ))
        .child(chrome_btn(
            "win-close",
            IconName::WindowClose,
            WindowControlArea::Close,
            true,
            use_manual_click.then_some(ChromeWindowOp::Close),
        ))
}

fn build_open_git_menus(has_repo: bool) -> Vec<Menu> {
    vec![
        Menu::new("OpenGit").items([
            MenuItem::action("Open Repository…", OpenRepository),
            MenuItem::separator(),
            MenuItem::action("Quit", QuitApp),
        ]),
        Menu::new("Repository").items([
            MenuItem::action("Fetch", MenuFetch).disabled(!has_repo),
            MenuItem::action("Pull", MenuPull).disabled(!has_repo),
            MenuItem::action("Push", MenuPush).disabled(!has_repo),
        ]),
    ]
}

/// Main application component
pub struct OpenGitApp {
    app_state: Entity<AppState>,
    active_view: ViewType,
    commit_message: Entity<InputState>,
    branch_name_input: Entity<InputState>,
    app_menu_bar: Entity<AppMenuBar>,
    _menu_sync: Subscription,
}

impl OpenGitApp {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let app_state = cx.new(|_| AppState::new());
        let app_menu_bar = AppMenuBar::new(cx);
        let _menu_sync = cx.observe(&app_state, |this, _, cx| {
            this.sync_app_menus(cx);
        });
        let commit_message = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Commit message…")
                .multi_line(true)
        });
        let branch_name_input = cx.new(|cx| {
            InputState::new(window, cx).placeholder("New branch name…")
        });
        cx.bind_keys([
            KeyBinding::new("cmd-o", OpenRepository, None),
            KeyBinding::new("ctrl-o", OpenRepository, None),
        ]);
        let mut this = Self {
            app_state,
            active_view: ViewType::Commit,
            commit_message,
            branch_name_input,
            app_menu_bar,
            _menu_sync,
        };
        this.sync_app_menus(cx);
        this
    }

    fn sync_app_menus(&mut self, cx: &mut Context<Self>) {
        let has_repo = self.app_state.read(cx).repository.is_some();
        let owned: Vec<OwnedMenu> = build_open_git_menus(has_repo)
            .into_iter()
            .map(|m| m.owned())
            .collect();
        GlobalState::global_mut(cx).set_app_menus(owned);
        self.app_menu_bar.update(cx, |bar, cx| {
            bar.reload(cx);
        });
    }

    fn prompt_open_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let paths = cx.prompt_for_paths(PathPromptOptions {
            files: false,
            directories: true,
            multiple: false,
            prompt: Some("Select a Git repository folder".into()),
        });
        let ws = self.app_state.clone();
        let wo = cx.entity().downgrade();
        window
            .spawn(cx, async move |async_cx| {
                let picked = paths
                    .await
                    .ok()
                    .and_then(|r| r.ok())
                    .flatten()
                    .and_then(|v| v.into_iter().next());
                if let Some(path) = picked {
                    let _ = async_cx.update(|_w, app| {
                        let _ = ws.update(app, |st, cx| {
                            if let Err(e) = st.open_repository(path) {
                                st.set_error(e.to_string());
                            }
                            cx.notify();
                        });
                        let _ = wo.update(app, |_o, cx| {
                            cx.notify();
                        });
                    });
                }
                None::<()>
            })
            .detach();
    }

    fn on_menu_open_repository(
        &mut self,
        _: &OpenRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_open_repository(window, cx);
    }

    fn on_menu_quit(&mut self, _: &QuitApp, _: &mut Window, cx: &mut Context<Self>) {
        cx.quit();
    }

    fn on_menu_fetch(&mut self, _: &MenuFetch, _: &mut Window, cx: &mut Context<Self>) {
        let _ = self.app_state.update(cx, |s, cx| {
            if s.repository.is_none() {
                return;
            }
            if let Err(e) = s.fetch_origin() {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    fn on_menu_pull(&mut self, _: &MenuPull, _: &mut Window, cx: &mut Context<Self>) {
        let branch = self
            .app_state
            .read(cx)
            .repo_status
            .status
            .current_branch
            .clone();
        let Some(branch) = branch else {
            return;
        };
        let _ = self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.pull_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    fn on_menu_push(&mut self, _: &MenuPush, _: &mut Window, cx: &mut Context<Self>) {
        let branch = self
            .app_state
            .read(cx)
            .repo_status
            .status
            .current_branch
            .clone();
        let Some(branch) = branch else {
            return;
        };
        let _ = self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.push_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }
}

fn file_status_label(s: FileStatus) -> &'static str {
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

#[derive(Clone, Copy)]
enum FileRowAction {
    Stage,
    Unstage,
}

fn render_file_row(
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
            Button::new(SharedString::from(format!(
                "act-{}",
                path.display()
            )))
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

fn render_diff_lines(diff: &FileDiff) -> impl IntoElement {
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

impl Render for OpenGitApp {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let state = self.app_state.read(cx);
        let repo_name = state
            .repo_path
            .as_ref()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Repository".to_string());

        let current_branch = state
            .repo_status
            .status
            .current_branch
            .clone()
            .unwrap_or_else(|| "No branch".to_string());
        let changed_count = state.repo_status.status.unstaged_files.len()
            + state.repo_status.status.untracked_files.len();
        let staged_count = state.repo_status.status.staged_files.len();
        let has_repo = state.repository.is_some();
        let active_view = self.active_view;
        let ahead = state.repo_status.ahead;
        let behind = state.repo_status.behind;
        let err = state.error.clone();
        let unstaged = state.repo_status.status.unstaged_files.clone();
        let untracked = state.repo_status.status.untracked_files.clone();
        let staged = state.repo_status.status.staged_files.clone();
        let history = state.history_commits.clone();
        let selected_hist = state.selected_history;
        let branches = state.repo_status.branches.clone();
        let diff_preview = state.diff_preview.clone();
        let diff_path = state.selected_diff_path.clone();
        let amend = state.commit_amend;
        let _ = state;

        let weak_state = self.app_state.downgrade();
        let weak_self = cx.entity().downgrade();
        let app_entity = self.app_state.clone();
        let menu_bar = self.app_menu_bar.clone();
        let chrome_drag = window.use_state(cx, |_, _| ChromeDragState {
            should_move: false,
        });

        div()
            .v_flex()
            .size_full()
            .on_action(cx.listener(Self::on_menu_open_repository))
            .on_action(cx.listener(Self::on_menu_quit))
            .on_action(cx.listener(Self::on_menu_fetch))
            .on_action(cx.listener(Self::on_menu_pull))
            .on_action(cx.listener(Self::on_menu_push))
            .bg(gpui::rgb(0x121212))
            .text_color(gpui::rgb(0xffffff))
            .child(
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
                            .child(menu_bar)
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
                                    .child(repo_name),
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
                            .child({
                                let ws = weak_self.clone();
                                Button::new("open-repo")
                                    .label("Open Repository")
                                    .primary()
                                    .on_click(move |_, window, cx| {
                                        let _ = ws.update(cx, |app, cx| {
                                            app.prompt_open_repository(window, cx);
                                        });
                                    })
                            })
                            .child(opengit_window_controls(window, cx)),
                    ),
            )
            .when_some(err, |col, e| {
                col.child(
                    div()
                        .w_full()
                        .px_4()
                        .py_2()
                        .bg(gpui::rgb(0x4a1515))
                        .text_sm()
                        .child(e),
                )
            })
            .child(
                if has_repo {
                    div()
                        .flex_1()
                        .flex()
                        .min_h_0()
                        .min_w_0()
                        .child(
                            div()
                                .flex_1()
                                .min_w_0()
                                .min_h_0()
                                .child(
                            h_resizable("opengit-main-split")
                                .child(
                                    resizable_panel()
                                        .size(px(250.))
                                        .size_range(px(160.)..px(560.))
                                        .flex_none()
                                        .child(
                            div()
                                .h_full()
                                .min_w_0()
                                .bg(gpui::rgb(0x1e1e1e))
                                .border_r(px(1.))
                                .border_color(gpui::rgb(0x333333))
                                .p_2()
                                .v_flex()
                                .gap_1()
                                .child(render_tab_button(
                                    "commit",
                                    "Commit",
                                    ViewType::Commit,
                                    active_view,
                                    cx,
                                ))
                                .child(render_tab_button(
                                    "history",
                                    "History",
                                    ViewType::History,
                                    active_view,
                                    cx,
                                ))
                                .child(render_tab_button(
                                    "branches",
                                    "Branches",
                                    ViewType::Branches,
                                    active_view,
                                    cx,
                                ))
                                .child(render_tab_button(
                                    "diff",
                                    "Diff",
                                    ViewType::Diff,
                                    active_view,
                                    cx,
                                )),
                                        )
                                )
                                .child(
                                    resizable_panel().child(
                            div()
                                .flex_1()
                                .min_h_0()
                                .min_w_0()
                                .p_4()
                                .v_flex()
                                .gap_3()
                                .child(match active_view {
                                    ViewType::Commit => div()
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
                                                            Button::new(SharedString::from(
                                                                format!("diff-u-{}", path.display()),
                                                            ))
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
                                                            Button::new(SharedString::from(
                                                                format!("diff-n-{}", path.display()),
                                                            ))
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
                                        .child(
                                            Input::new(&self.commit_message)
                                                .w_full()
                                                .h(px(100.)),
                                        )
                                        .child(
                                            div()
                                                .flex()
                                                .gap_2()
                                                .child({
                                                    let app_e = app_entity.clone();
                                                    let msg_e = self.commit_message.clone();
                                                    Button::new("commit-btn")
                                                        .label("Commit")
                                                        .primary()
                                                        .on_click(move |_, window, cx| {
                                                            let msg = cx.read_entity(
                                                                &msg_e,
                                                                |i, _| i.value().to_string(),
                                                            );
                                                            let amend =
                                                                cx.read_entity(&app_e, |s, _| {
                                                                    s.commit_amend
                                                                });
                                                            let _ = app_e.update(cx, |s, cx| {
                                                                if let Err(e) =
                                                                    s.commit_staged(&msg, amend)
                                                                {
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
                                                        .label(if amend {
                                                            "Amend: on"
                                                        } else {
                                                            "Amend: off"
                                                        })
                                                        .small()
                                                        .on_click(move |_, _, cx| {
                                                            let _ = ws.update(cx, |s, cx| {
                                                                s.commit_amend = !s.commit_amend;
                                                                cx.notify();
                                                            });
                                                        })
                                                }),
                                        )
                                        .into_any_element(),
                                    ViewType::History => div()
                                        .flex_1()
                                        .min_h_0()
                                        .v_flex()
                                        .gap_2()
                                        .child(
                                            div()
                                                .flex()
                                                .justify_between()
                                                .items_center()
                                                .child(format!(
                                                    "Commits ({})",
                                                    history.len()
                                                ))
                                                .child({
                                                    let ws = weak_state.clone();
                                                    Button::new("hist-more")
                                                        .label("Load more")
                                                        .small()
                                                        .on_click(move |_, _, cx| {
                                                            let _ = ws.update(cx, |s, cx| {
                                                                if let Err(e) = s.load_more_history()
                                                                {
                                                                    s.set_error(e.to_string());
                                                                }
                                                                cx.notify();
                                                            });
                                                        })
                                                }),
                                        )
                                        .child(
                                            div()
                                                .flex_1()
                                                .min_h_0()
                                                .v_flex()
                                                .gap_1()
                                                .children(history.iter().enumerate().map(
                                                    |(idx, c)| {
                                                        let sel = selected_hist == Some(idx);
                                                        let ws = weak_state.clone();
                                                        let hash = c.hash.clone();
                                                        let summary = c.summary.clone();
                                                        let author = c.author.clone();
                                                        let time_str =
                                                            c.time.format("%Y-%m-%d").to_string();
                                                        div()
                                                            .id(hash.clone())
                                                            .cursor_pointer()
                                                            .bg(if sel {
                                                                gpui::rgb(0x3e3e3e)
                                                            } else {
                                                                gpui::rgb(0x1e1e1e)
                                                            })
                                                            .rounded(px(2.))
                                                            .p_2()
                                                            .on_click(move |_, _, cx| {
                                                                let _ = ws.update(cx, |s, cx| {
                                                                    s.selected_history = Some(idx);
                                                                    cx.notify();
                                                                });
                                                            })
                                                            .child(
                                                                div()
                                                                    .flex()
                                                                    .flex_col()
                                                                    .gap_1()
                                                                    .child(
                                                                        div()
                                                                            .text_sm()
                                                                            .child(summary),
                                                                    )
                                                                    .child(
                                                                        div()
                                                                            .flex()
                                                                            .gap_4()
                                                                            .text_xs()
                                                                            .text_color(gpui::rgb(
                                                                                0x888888,
                                                                            ))
                                                                            .child(author)
                                                                            .child(time_str)
                                                                            .child(
                                                                                hash.chars()
                                                                                    .take(7)
                                                                                    .collect::<String>(),
                                                                            ),
                                                                    ),
                                                            )
                                                    },
                                                )),
                                        )
                                        .into_any_element(),
                                    ViewType::Branches => div()
                                        .flex_1()
                                        .min_h_0()
                                        .v_flex()
                                        .gap_3()
                                        .child(
                                            div()
                                                .flex()
                                                .gap_2()
                                                .child(Input::new(&self.branch_name_input).flex_1())
                                                .child({
                                                    let ws = weak_state.clone();
                                                    let inp = self.branch_name_input.clone();
                                                    Button::new("new-branch")
                                                        .label("Create branch")
                                                        .primary()
                                                        .on_click(move |_, _, cx| {
                                                            let name = cx.read_entity(
                                                                &inp,
                                                                |i, _| i.value().to_string(),
                                                            );
                                                            let _ = ws.update(cx, |s, cx| {
                                                                if name.trim().is_empty() {
                                                                    s.set_error(
                                                                        "Branch name is empty"
                                                                            .into(),
                                                                    );
                                                                } else if let Err(e) = s
                                                                    .create_branch(name.trim())
                                                                {
                                                                    s.set_error(e.to_string());
                                                                }
                                                                cx.notify();
                                                            });
                                                        })
                                                }),
                                        )
                                        .child(
                                            div()
                                                .flex_1()
                                                .min_h_0()
                                                .v_flex()
                                                .gap_1()
                                                .children(branches.iter().map(|b| {
                                                    let ws = weak_state.clone();
                                                    let nm = b.name.clone();
                                                    let cur = b.is_head;
                                                    div()
                                                        .flex()
                                                        .justify_between()
                                                        .items_center()
                                                        .p_2()
                                                        .rounded(px(2.))
                                                        .bg(gpui::rgb(0x1e1e1e))
                                                        .child(
                                                            div()
                                                                .flex()
                                                                .gap_2()
                                                                .child(
                                                                    if cur {
                                                                        div()
                                                                            .text_xs()
                                                                            .text_color(
                                                                                gpui::rgb(0x4dd0e1),
                                                                            )
                                                                            .child("HEAD")
                                                                    } else {
                                                                        div().text_xs().child(" ")
                                                                    },
                                                                )
                                                                .child(b.name.clone()),
                                                        )
                                                        .child(
                                                            Button::new(SharedString::from(
                                                                format!("sw-{}", b.name),
                                                            ))
                                                            .label("Checkout")
                                                            .small()
                                                            .on_click(move |_, _, cx| {
                                                                let name = nm.clone();
                                                                let _ = ws.update(cx, |s, cx| {
                                                                    if let Err(e) =
                                                                        s.checkout_branch(&name)
                                                                    {
                                                                        s.set_error(e.to_string());
                                                                    }
                                                                    cx.notify();
                                                                });
                                                            }),
                                                        )
                                                })),
                                        )
                                        .into_any_element(),
                                    ViewType::Diff => div()
                                        .flex_1()
                                        .min_h_0()
                                        .v_flex()
                                        .gap_2()
                                        .child(
                                            div()
                                                .text_sm()
                                                .child(match &diff_path {
                                                    Some(p) => format!("Diff: {}", p.display()),
                                                    None => "Select a file from Commit view (click row)"
                                                        .to_string(),
                                                }),
                                        )
                                        .when_some(diff_preview, |col, d| {
                                            col.flex_1().min_h_0().child(render_diff_lines(&d))
                                        })
                                        .into_any_element(),
                                    _ => div().child("Not implemented").into_any_element(),
                                })
                        ))))
                        .into_any_element()
                } else {
                    div()
                        .flex_1()
                        .v_flex()
                        .gap_6()
                        .size_full()
                        .items_center()
                        .justify_center()
                        .p_4()
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .items_center()
                                .gap_4()
                                .child(div().text_lg().child("Welcome to OpenGit"))
                                .child(
                                    div()
                                        .text_color(gpui::rgb(0xcccccc))
                                        .child("A modern Git client built with Rust and GPUI"),
                                )
                                .child(
                                    div()
                                        .mt_8()
                                        .text_color(gpui::rgb(0xaaaaaa))
                                        .child("Open a Git repository to get started"),
                                ),
                        )
                        .into_any_element()
                }
            )
            .child(
                div()
                    .w_full()
                    .h(px(40.))
                    .bg(gpui::rgb(0x1e1e1e))
                    .border_t(px(1.))
                    .border_color(gpui::rgb(0x333333))
                    .flex()
                    .items_center()
                    .px_4()
                    .justify_between()
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x888888))
                            .child(format!("Branch: {}", current_branch)),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(gpui::rgb(0x888888))
                            .child(format!(
                                "↑{} ↓{} · unstaged {} · staged {}",
                                ahead, behind, changed_count, staged_count
                            )),
                    ),
            )
    }
}

fn render_tab_button(
    id: &'static str,
    label: &'static str,
    view_type: ViewType,
    current_view: ViewType,
    cx: &mut Context<OpenGitApp>,
) -> impl IntoElement {
    use gpui_component::button::Button;
    use gpui::Styled as _;

    let is_active = current_view == view_type;
    let weak_self = cx.entity().downgrade();

    let button = Button::new(id)
        .label(label)
        .on_click(move |_, _, cx| {
            let _ = weak_self.update(cx, |app, cx| {
                app.active_view = view_type;
                cx.notify();
            });
        });

    if is_active {
        button.primary().w_full()
    } else {
        button.secondary().w_full()
    }
}

fn main() {
    let app = gpui_platform::application().with_assets(gpui_component_assets::Assets);

    app.run(move |cx| {
        gpui_component::init(cx);
        cx.activate(true);

        let theme_name = SharedString::from("Ayu Dark");
        if let Err(err) = ThemeRegistry::watch_dir(PathBuf::from("./themes"), cx, move |cx| {
            if let Some(theme) = ThemeRegistry::global(cx).themes().get(&theme_name).cloned() {
                Theme::global_mut(cx).apply_config(&theme);
            }
        }) {
            tracing::error!("Failed to watch themes directory: {}", err);
        }

        cx.spawn(async move |cx| {
            let window_bounds = cx.update(|app| {
                WindowBounds::centered(
                    size(px(1100.), px(720.)),
                    app,
                )
            });
            let window_options = WindowOptions {
                window_bounds: Some(window_bounds),
                titlebar: Some(opengit_titlebar_options()),
                is_movable: true,
                is_resizable: true,
                is_minimizable: true,
                window_min_size: Some(gpui::Size {
                    width: px(640.),
                    height: px(400.),
                }),
                #[cfg(target_os = "linux")]
                window_background: WindowBackgroundAppearance::Transparent,
                #[cfg(target_os = "linux")]
                window_decorations: Some(WindowDecorations::Client),
                ..Default::default()
            };
            let window = cx
                .open_window(window_options, |window, cx| {
                    let app_view = cx.new(|cx| OpenGitApp::new(window, cx));
                    cx.new(|cx| Root::new(app_view, window, cx))
                })
                .expect("Failed to open window");
            let _ = window.update(cx, |_, window, _| {
                window.activate_window();
                window.set_window_title("OpenGit");
            });
        })
        .detach();
    });
}
