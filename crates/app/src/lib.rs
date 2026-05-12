//! OpenGit 桌面应用 —— OpenGit Desktop Application
//!
//! 基于 GPUI 框架构建的 Git GUI 客户端。
//! 采用 Entity-Component 架构，通过 `AppState` 集中管理仓库状态，
//! 视图层通过 `WeakEntity<AppState>` 进行响应式通信。
//!
//! ## 模块结构 —— Module Structure
//!
//! | 模块 | 功能 |
//! |------|------|
//! | `app_state` | 核心状态实体（AppState + 按职责拆分的子模块） |
//! | `app_component` | 主应用组件（OpenGitApp Entity 及其 Render 实现） |
//! | `settings` | 配置管理（类型定义 + 持久化逻辑） |
//! | `views` | 视图组件（提交视图、历史视图、分支视图、差异视图、标题栏、状态栏） |
//! | `workspace` | 多项目工作空间管理 |
//! | `project` | 单项目实体 |
//! | `commit_editor` | 提交编辑器状态 |
//! | `menu` | 菜单栏构造 |
//!
//! GPUI-based Git GUI client using Entity-Component architecture.

pub mod app_component;
pub mod app_state;
mod commit_editor;
mod menu;
mod project;
pub mod settings;
pub mod views;
mod workspace;

pub use app_component::OpenGitApp;
pub use app_state::{AppState, ViewType};
pub use commit_editor::CommitEditor;
pub use project::Project;
pub use workspace::Workspace;
