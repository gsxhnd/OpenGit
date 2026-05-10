//! 菜单动作处理器 —— Menu action handlers
//!
//! 处理所有菜单动作（打开/克隆仓库、Fetch/Pull/Push、退出等）。
//! 作为 `OpenGitApp` 的扩展 impl 块实现，与主组件定义解耦。
//!
//! Handles all menu actions (open/clone repo, fetch/pull/push, quit).
//! Implemented as an extension impl block on OpenGitApp, decoupled from the struct definition.

use gpui::*;

use super::{CloneRepository, MenuFetch, MenuPull, MenuPush, OpenRepository, OpenGitApp, QuitApp};

impl OpenGitApp {
    // ========================================================================
    // 辅助方法 —— Helper methods
    // ========================================================================

    /// 弹出文件选择对话框打开仓库 —— Prompt to open a repository
    pub fn prompt_open_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
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
                        ws.update(app, |st, cx| {
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

    /// 弹窗引导克隆仓库 —— Prompt to clone a repository
    pub fn prompt_clone_repository(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let url = self.clone_url_input.read(cx).value().to_string();
        if url.trim().is_empty() {
            self.app_state.update(cx, |s, cx| {
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
                        ws.update(app, |st, cx| {
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

    // ========================================================================
    // 菜单动作处理器 —— Menu action handlers
    // ========================================================================

    /// 处理"打开仓库"菜单动作 —— Handle OpenRepository menu action
    pub(crate) fn on_menu_open_repository(
        &mut self,
        _: &OpenRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_open_repository(window, cx);
    }

    /// 处理"克隆仓库"菜单动作 —— Handle CloneRepository menu action
    pub(crate) fn on_menu_clone_repository(
        &mut self,
        _: &CloneRepository,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.prompt_clone_repository(window, cx);
    }

    /// 处理"退出"动作 —— Handle Quit action
    pub(crate) fn on_menu_quit(&mut self, _: &QuitApp, _: &mut Window, cx: &mut Context<Self>) {
        cx.quit();
    }

    /// 处理 Fetch 动作 —— Handle Fetch action
    pub(crate) fn on_menu_fetch(&mut self, _: &MenuFetch, _: &mut Window, cx: &mut Context<Self>) {
        self.app_state.update(cx, |s, cx| {
            if s.repository.is_none() {
                return;
            }
            if let Err(e) = s.fetch_origin() {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    /// 处理 Pull 动作 —— Handle Pull action
    pub(crate) fn on_menu_pull(&mut self, _: &MenuPull, _: &mut Window, cx: &mut Context<Self>) {
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
        self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.pull_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }

    /// 处理 Push 动作 —— Handle Push action
    pub(crate) fn on_menu_push(&mut self, _: &MenuPush, _: &mut Window, cx: &mut Context<Self>) {
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
        self.app_state.update(cx, |s, cx| {
            if let Err(e) = s.push_origin(&branch) {
                s.set_error(e.to_string());
            }
            cx.notify();
        });
    }
}
