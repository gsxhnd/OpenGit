# 10. 构建与运行

## 10.1 开发环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Rust | stable (最新) | Edition 2024 |
| Git | 2.30+ | 使用系统 git 后端时需要 |
| cmake | 3.x | 编译 libgit2 |
| pkg-config | - | Linux 依赖查找 |
| libssl-dev | - | HTTPS 支持 |

**Linux 额外依赖 (Debian/Ubuntu):**

```bash
sudo apt install -y \
    build-essential cmake pkg-config \
    libssl-dev libgit2-dev \
    libx11-dev libxcb1-dev libxkbcommon-dev \
    libwayland-dev libvulkan-dev \
    libfontconfig-dev libfreetype-dev
```

**macOS:**

```bash
brew install cmake pkg-config openssl libgit2
```

**Windows:**

```powershell
# 安装 Visual Studio Build Tools (C++ 工具集)
# 安装 CMake
# git2-rs 会自动编译 libgit2
```

## 10.2 构建命令

```bash
# Debug 构建
cargo build

# Release 构建 (推荐日常使用，GPUI 在 debug 模式下较慢)
cargo build --release

# 运行
cargo run --release

# 检查编译 (不生成二进制)
cargo check
```

## 10.3 测试命令

```bash
# 运行所有测试
cargo test

# 运行特定模块测试
cargo test git::
cargo test views::

# 运行测试并显示输出
cargo test -- --nocapture

# 运行特定测试
cargo test test_create_branch
```

## 10.4 代码质量

```bash
# 格式化
cargo fmt

# 格式检查 (CI 用)
cargo fmt -- --check

# Clippy lint
cargo clippy -- -D warnings

# 完整 CI 检查
cargo fmt -- --check && cargo clippy -- -D warnings && cargo test
```

## 10.5 开发技巧

**主题热加载：** 修改 `themes/` 下的 JSON 文件，应用会自动重新加载主题。

**GPUI 调试：** 设置环境变量启用详细日志：

```bash
RUST_LOG=gpui=debug cargo run --release
```

**Git2 调试：** 启用 libgit2 trace：

```bash
RUST_LOG=git2=trace cargo run --release
```
