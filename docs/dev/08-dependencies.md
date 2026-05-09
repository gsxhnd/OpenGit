# 8. 依赖规划

## 8.1 核心依赖

```toml
[dependencies]
# UI 框架
gpui = { git = "https://github.com/zed-industries/zed", package = "gpui" }
gpui_platform = { git = "https://github.com/zed-industries/zed", package = "gpui_platform", features = ["font-kit", "x11", "wayland", "runtime_shaders"] }
gpui-component = { git = "https://github.com/longbridge/gpui-component" }
gpui-component-assets = { git = "https://github.com/longbridge/gpui-component" }

# Git 操作
git2 = "0.19"                     # libgit2 Rust binding

# 异步 & 并发
tokio = { version = "1", features = ["process", "io-util"] }

# 序列化
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# HTTP (平台 API)
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }

# 文件系统监听
notify = "7"

# 终端
portable-pty = "0.8"

# 错误处理
anyhow = "1"
thiserror = "2"

# 日志
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 国际化
rust-i18n = "3"

# 时间
chrono = { version = "0.4", features = ["serde"] }

# 配置目录
dirs = "5"

# URL 解析
url = "2"
```

## 8.2 平台特定依赖

```toml
[target.'cfg(target_os = "linux")'.dependencies]
gpui_platform = { ..., features = ["font-kit", "x11", "wayland", "runtime_shaders"] }

[target.'cfg(target_os = "macos")'.dependencies]
gpui_platform = { ..., features = ["font-kit"] }

[target.'cfg(target_os = "windows")'.dependencies]
gpui_platform = { ..., features = ["font-kit"] }
```

## 8.3 开发依赖

```toml
[dev-dependencies]
tempfile = "3"          # 临时目录 (测试用)
```
