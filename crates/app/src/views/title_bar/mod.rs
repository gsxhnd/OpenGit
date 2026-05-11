//! 自定义标题栏 —— Custom title bar (chrome)
//!
//! 渲染应用的自定义窗口装饰，替代系统默认标题栏。
//! 包含：应用菜单栏、仓库名、Fetch/Pull/Push 按钮和平台窗口控制按钮。
//! 支持窗口拖拽（通过自定义 ChromeDragState）。
//!
//! ## 子模块 —— Sub-modules
//!
//! | 模块 | 功能 |
//! |------|------|
//! | `window_controls` | 窗口控制按钮（最小化/最大化/关闭） |
//! | `render` | RenderOnce trait 实现 |
//!
//! Renders custom window chrome: menu bar, repo name, action buttons, window controls.
//! Supports window dragging via ChromeDragState.

mod render;
mod window_controls;

use std::rc::Rc;

use gpui::*;
use gpui_component::menu::AppMenuBar;

/// 标题栏高度 (px) —— Title bar height in pixels
pub const CHROME_BAR_H: Pixels = px(40.);

/// 拖拽状态 —— Drag state for window movement
#[derive(Default)]
struct ChromeDragState {
    should_move: bool,
}

/// 自定义标题栏组件 —— Custom title bar component
///
/// 使用 `IntoElement` derive 实现 `RenderOnce`。
/// 通过 Builder 模式注入回调（Fetch/Pull/Push/OpenRepo）。
///
/// - macOS/Linux/Windows: renders full chrome (menu bar + window controls + drag)
///
/// Uses `IntoElement` derive with Builder pattern for callback injection.
#[allow(clippy::type_complexity)]
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
    pub fn new(repo_name: impl Into<String>, has_repo: bool, menu_bar: Entity<AppMenuBar>) -> Self {
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
