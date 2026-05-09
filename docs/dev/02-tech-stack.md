# 2. 技术栈

## 2.1 核心技术

| 技术 | 说明 | 版本/来源 |
|------|------|-----------|
| **Rust** | 主语言 | Edition 2024 |
| **GPUI** | UI 框架 (Zed 编辑器底层) | `zed-industries/zed` |
| **gpui-component** | UI 组件库 (Button, Select, Dialog 等) | `longbridge/gpui-component` |
| **git2-rs** | Git 后端之一 (libgit2 Rust binding)，性能优先 | crates.io |
| **系统 git** | Git 后端之一 (Command 调用)，兼容性优先 | 系统安装 |

## 2.2 框架特性

**GPUI 核心概念：**

- **Entity\<T\>**: 状态管理单元，提供安全的并发访问
- **Render trait**: 组件渲染接口，声明式 UI
- **Flexbox 布局**: CSS-like 的样式系统，支持 `px()`, `rems()`, `relative()`
- **异步运行时**: 内置前台/后台任务调度
  - `cx.spawn()`: 前台任务，可更新 UI
  - `cx.background_spawn()`: 后台任务，用于 CPU 密集计算
- **主题系统**: JSON 配置主题，支持热加载

**gpui-component 组件库提供：**

- Button, Input, Select, Checkbox, Switch
- Dialog, Modal, Notification, Tooltip
- Table, List, Tabs
- Icon, Badge, Avatar
- 完整的主题支持 (21+ 内置主题)
