//! OpenGit 桌面应用入口 —— Desktop application entry point
//!
//! 启动 GPUI 应用，加载主题，创建主窗口和 `OpenGitApp` 实例。
//!
//! ## 启动流程 —— Startup sequence
//!
//! 1. 初始化日志系统（tracing） —— Initialize logging
//! 2. 创建配置/日志目录 —— Create config/log directories
//! 3. 加载或创建配置文件 —— Load or create config file
//! 4. 初始化 GPUI 应用 —— Initialize GPUI application
//! 5. 加载主题并应用保存的主题 —— Load themes and apply saved theme
//! 6. 创建主窗口（使用保存的窗口尺寸） —— Create main window with saved bounds
//!
//! Start GPUI, load themes, create main window with `OpenGitApp`.

use gpui::*;
use gpui_component::{Root, Theme, ThemeRegistry};

use app::OpenGitApp;
use app::app_component::opengit_titlebar_options;
use app::settings::{AppSettings, LoadResult};

fn main() {
    // ========================================================================
    // Step 1: 初始化日志系统 —— Initialize logging subsystem
    // ========================================================================
    // Uses RUST_LOG env var for filtering, defaults to INFO level.
    // Logs to stderr (console). File logging can be added later.
    {
        use tracing_subscriber::prelude::*;
        let filter = tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));
        tracing_subscriber::registry()
            .with(tracing_subscriber::fmt::layer().with_writer(std::io::stderr))
            .with(filter)
            .init();
    }

    tracing::info!("OpenGit starting up");

    // ========================================================================
    // Step 2: 初始化配置目录和日志目录 —— Initialize config and log directories
    // ========================================================================
    if let Err(e) = AppSettings::init_dirs() {
        tracing::error!("Failed to initialize directories: {}", e);
    }

    // ========================================================================
    // Step 3: 加载或创建配置 —— Load or create configuration
    // ========================================================================
    // Handles three cases:
    // - Fresh: first launch, defaults created
    // - Loaded: existing config parsed successfully
    // - Corrupted: config backed up, defaults used, error surfaced to user
    let (app_settings, config_error) = match AppSettings::load_or_default() {
        LoadResult::Fresh(settings) | LoadResult::Loaded(settings) => (settings, None),
        LoadResult::Corrupted { settings, error } => (settings, Some(error)),
    };

    let theme_name: SharedString = SharedString::from(app_settings.theme.as_str());
    let settings_width = app_settings.window.width;
    let settings_height = app_settings.window.height;

    tracing::info!(
        "Window: {}x{}, theme: {}",
        settings_width,
        settings_height,
        app_settings.theme
    );

    // ========================================================================
    // Step 4-6: 启动 GPUI 应用 —— Start GPUI application
    // ========================================================================
    let app = gpui_platform::application().with_assets(gpui_component_assets::Assets);

    app.run(move |cx| {
        gpui_component::init(cx);
        cx.activate(true);

        // 加载并监听主题文件 —— Load and watch theme files
        let current_theme = theme_name.clone();
        if let Err(err) = ThemeRegistry::watch_dir(
            std::path::PathBuf::from("./themes"),
            cx,
            move |cx| {
                if let Some(theme) =
                    ThemeRegistry::global(cx).themes().get(&current_theme).cloned()
                {
                    Theme::global_mut(cx).apply_config(&theme);
                }
            },
        ) {
            tracing::error!("Failed to watch themes directory: {}", err);
        }

        // 在异步任务中创建窗口 —— Create window in async task
        cx.spawn(async move |cx| {
            let window_bounds = cx.update(move |app| {
                WindowBounds::centered(size(px(settings_width), px(settings_height)), app)
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
                    let app_view = cx.new(|cx| {
                        let app = OpenGitApp::new(window, cx);
                        // 如果配置损坏，启动时显示错误 —— Surface corrupted config error on startup
                        if let Some(err) = config_error.clone() {
                            app.app_state.update(cx, |state, cx| {
                                state.set_error(format!(
                                    "Configuration file was corrupted and has been reset. Details: {}",
                                    err
                                ));
                                cx.notify();
                            });
                        }
                        app
                    });
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
