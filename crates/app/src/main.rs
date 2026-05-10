//! OpenGit 桌面应用入口 —— Desktop application entry point
//!
//! 启动 GPUI 应用，加载主题，创建主窗口和 `OpenGitApp` 实例。
//!
//! Starts GPUI, loads themes, creates main window with `OpenGitApp`.

use gpui::*;
use gpui_component::{Root, Theme, ThemeRegistry};

use app::app_component::opengit_titlebar_options;
use app::OpenGitApp;

fn main() {
    // 创建 GPUI 应用，加载 gpui-component 资源 —— Create GPUI app with gpui-component assets
    let app = gpui_platform::application().with_assets(gpui_component_assets::Assets);

    app.run(move |cx| {
        gpui_component::init(cx);
        cx.activate(true);

        // 加载并监听主题文件 —— Load and watch theme files
        let theme_name = SharedString::from("Ayu Dark");
        if let Err(err) = ThemeRegistry::watch_dir(
            std::path::PathBuf::from("./themes"),
            cx,
            move |cx| {
                if let Some(theme) = ThemeRegistry::global(cx).themes().get(&theme_name).cloned() {
                    Theme::global_mut(cx).apply_config(&theme);
                }
            },
        ) {
            tracing::error!("Failed to watch themes directory: {}", err);
        }

        // 在异步任务中创建窗口 —— Create window in async task
        cx.spawn(async move |cx| {
            let window_bounds =
                cx.update(|app| WindowBounds::centered(size(px(1100.), px(720.)), app));
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
