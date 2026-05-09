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
use views::{render_branches_view, render_commit_view, render_diff_view, render_history_view, StatusBar, TitleBar};

actions!(open_git, [OpenRepository, CloneRepository, QuitApp, MenuFetch, MenuPull, MenuPush]);

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

fn build_open_git_menus(has_repo: bool) -> Vec<Menu> {
    vec![
        Menu::new("OpenGit").items([
            MenuItem::action("Open Repository…", OpenRepository),
            MenuItem::action("Clone Repository…", CloneRepository),
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
    pub active_view: ViewType,
    commit_message: Entity<InputState>,
    branch_name_input: Entity<InputState>,
    clone_url_input: Entity<InputState>,
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
        let branch_name_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("New branch name…"));
        let clone_url_input =
            cx.new(|cx| InputState::new(window, cx).placeholder("https://github.com/user/repo.git"));
        cx.bind_keys([
            KeyBinding::new("cmd-o", OpenRepository, None),
            KeyBinding::new("ctrl-o", OpenRepository, None),
        ]);
        let mut this = Self {
            app_state,
            active_view: ViewType::Commit,
            commit_message,
            branch_name_input,
            clone_url_input,
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

    fn on_menu_clone_repository(
        &mut self,
        _: &CloneRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_clone_repository(window, cx);
    }

    fn prompt_clone_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let url = self.clone_url_input.read(cx).value().to_string();
        if url.trim().is_empty() {
            let _ = self.app_state.update(cx, |s, cx| {
                s.set_error("Please enter a repository URL to clone".into());
                cx.notify();
            });
            return;
        }
        let url = url.trim().to_string();
        let ws = self.app_state.clone();
        let wo = cx.entity().downgrade();
        let paths = cx.prompt_for_paths(PathPromptOptions {
            files: false,
            directories: true,
            multiple: false,
            prompt: Some(format!("Select parent directory to clone {} into", url).into()),
        });
        window
            .spawn(cx, async move |async_cx| {
                let picked = paths
                    .await
                    .ok()
                    .and_then(|r| r.ok())
                    .flatten()
                    .and_then(|v| v.into_iter().next());
                if let Some(parent_dir) = picked {
                    let repo_name = url
                        .rsplit('/')
                        .next()
                        .unwrap_or(&url)
                        .trim_end_matches(".git");
                    let target = parent_dir.join(repo_name);
                    let _ = async_cx.update(|_w, app| {
                        let _ = ws.update(app, |st, cx| {
                            if let Err(e) = st.clone_repository(&url, target) {
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

fn render_tab_button(
    id: &'static str,
    label: &'static str,
    view_type: ViewType,
    current_view: ViewType,
    cx: &mut Context<OpenGitApp>,
) -> impl IntoElement {
    use gpui::Styled as _;
    use gpui_component::button::Button;

    let is_active = current_view == view_type;
    let weak_self = cx.entity().downgrade();

    let button = Button::new(id).label(label).on_click(move |_, _, cx| {
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

impl Render for OpenGitApp {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
        let clone_url_input = self.clone_url_input.clone();
        let _ = state;

        let weak_state = self.app_state.downgrade();
        let weak_self = cx.entity().downgrade();
        let app_entity = self.app_state.clone();
        let title_bar = {
            let ws = weak_self.clone();
            let app = self.app_state.clone();
            let branch = current_branch.clone();
            TitleBar::new(
                repo_name,
                has_repo,
                self.app_menu_bar.clone(),
            )
            .on_open_repo(move |window, cx| {
                let _ = ws.update(cx, |app, cx| {
                    app.prompt_open_repository(window, cx);
                });
            })
            .on_fetch({
                let a = app.clone();
                move |_, cx| {
                    let _ = a.update(cx, |s, cx| {
                        if let Err(e) = s.fetch_origin() {
                            s.set_error(e.to_string());
                        }
                        cx.notify();
                    });
                }
            })
            .on_pull({
                let a = app.clone();
                let b = branch.clone();
                move |_, cx| {
                    let _ = a.update(cx, |s, cx| {
                        if let Err(e) = s.pull_origin(&b) {
                            s.set_error(e.to_string());
                        }
                        cx.notify();
                    });
                }
            })
            .on_push({
                let a = app;
                let b = branch;
                move |_, cx| {
                    let _ = a.update(cx, |s, cx| {
                        if let Err(e) = s.push_origin(&b) {
                            s.set_error(e.to_string());
                        }
                        cx.notify();
                    });
                }
            })
        };

        let status_bar = StatusBar::new(
            current_branch.clone(),
            ahead,
            behind,
            changed_count,
            staged_count,
        );

        div()
            .v_flex()
            .size_full()
            .on_action(cx.listener(Self::on_menu_open_repository))
            .on_action(cx.listener(Self::on_menu_clone_repository))
            .on_action(cx.listener(Self::on_menu_quit))
            .on_action(cx.listener(Self::on_menu_fetch))
            .on_action(cx.listener(Self::on_menu_pull))
            .on_action(cx.listener(Self::on_menu_push))
            .bg(gpui::rgb(0x121212))
            .text_color(gpui::rgb(0xffffff))
            .child(title_bar)
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
            .child(if has_repo {
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
                                            ),
                                    )
                                    .child(resizable_panel().child(
                                        div()
                                            .flex_1()
                                            .min_h_0()
                                            .min_w_0()
                                            .p_4()
                                            .v_flex()
                                            .gap_3()
                                            .child(match active_view {
                                                ViewType::Commit => render_commit_view(
                                                    &unstaged,
                                                    &untracked,
                                                    &staged,
                                                    amend,
                                                    &self.commit_message,
                                                    app_entity.clone(),
                                                    weak_state.clone(),
                                                    weak_self.clone(),
                                                ),
                                                ViewType::History => render_history_view(
                                                    &history,
                                                    selected_hist,
                                                    weak_state.clone(),
                                                ),
                                                ViewType::Branches => render_branches_view(
                                                    &branches,
                                                    &self.branch_name_input,
                                                    weak_state.clone(),
                                                ),
                                                ViewType::Diff => render_diff_view(
                                                    diff_path.as_ref(),
                                                    diff_preview.as_ref(),
                                                ),
                                                _ => div()
                                                    .child("Not implemented")
                                                    .into_any_element(),
                                            }),
                                    )),
                            ),
                    )
                    .into_any_element()
            } else {
                let wo = weak_self.clone();
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
                                    .text_color(gpui::rgb(0xaaaaaa))
                                    .child("Open a Git repository to get started"),
                            )
                            .child({
                                let wo_open = wo.clone();
                                Button::new("open-repo-welcome")
                                    .label("Open Repository")
                                    .primary()
                                    .on_click(move |_, window, cx| {
                                        let _ = wo_open.update(cx, |app, cx| {
                                            app.prompt_open_repository(window, cx);
                                        });
                                    })
                            })
                            .child(
                                div()
                                    .mt_4()
                                    .flex()
                                    .flex_col()
                                    .gap_2()
                                    .w(px(400.))
                                    .child(
                                        div()
                                            .text_sm()
                                            .text_color(gpui::rgb(0xcccccc))
                                            .child("Clone a remote repository"),
                                    )
                                    .child(
                                        div()
                                            .flex()
                                            .gap_2()
                                            .child(Input::new(&clone_url_input).flex_1())
                                            .child({
                                                let wo_clone = wo.clone();
                                                Button::new("clone-repo-btn")
                                                    .label("Clone")
                                                    .primary()
                                                    .on_click(move |_, window, cx| {
                                                        let _ = wo_clone.update(cx, |app, cx| {
                                                            app.prompt_clone_repository(window, cx);
                                                        });
                                                    })
                                            }),
                                    ),
                            ),
                    )
                    .into_any_element()
            })
            .child(status_bar)
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
                WindowBounds::centered(size(px(1100.), px(720.)), app)
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
