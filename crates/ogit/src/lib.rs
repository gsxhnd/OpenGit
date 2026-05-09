//! OpenGit 核心库 —— OpenGit Core Library
//!
//! `ogit` 提供 Git 仓库操作的核心抽象和具体实现。
//! 采用 trait-based 设计，通过 `GitOps` trait 定义统一接口，便于未来切换不同后端（如 git2、命令行 git）。
//!
//! ## 模块结构 —— Module Structure
//!
//! | 模块 | 功能 |
//! |------|------|
//! | `model` | 数据模型（Commit、Branch、FileDiff 等纯数据结构） |
//! | `operations` | Git 操作接口（`GitOps` trait、`GitError`、`ResetMode`） |
//! | `repository` | 基于 git2.rs 的仓库实现（拆分为状态、历史、差异、分支等子模块） |
//!
//! Provides core Git abstractions using a trait-based design for backend flexibility.

#![allow(dead_code, unused_imports)]

pub mod model;
pub mod operations;
pub mod repository;

// 重新导出常用类型，方便外部使用 —— Re-export common types for convenience
pub use model::*;
pub use operations::{GitError, GitOps, ResetMode};
pub use repository::Repository;
