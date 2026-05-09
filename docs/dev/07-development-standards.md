# 7. 开发规范

## 7.1 代码风格

- 使用 `rustfmt` 统一格式化 (项目根目录 `rustfmt.toml`)
- 使用 `clippy` 进行 lint 检查，CI 中 `#[deny(warnings)]`
- 所有 `pub` 接口必须有文档注释 (`///`)
- 代码行宽限制 100 字符

## 7.2 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 类型 / Struct / Enum | PascalCase | `CommitView`, `BranchList` |
| 函数 / 方法 | snake_case | `stage_files()`, `create_branch()` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_COMMIT_HISTORY` |
| Entity 状态类型 | 描述性名词 | `Project`, `Repository`, `Workspace` |
| View 组件 | 功能名 + View (可选) | `CommitView`, `HistoryView` |
| UI 组件 | 描述性名词 | `FileTree`, `DiffEditor`, `GraphCanvas` |
| Trait | 形容词或动词性 | `GitOps`, `Renderable`, `AiProvider` |
| 模块文件 | snake_case | `commit_view.rs`, `file_tree.rs` |

## 7.3 错误处理规范

```rust
// 1. 定义领域错误类型 (使用 thiserror)
#[derive(Debug, thiserror::Error)]
pub enum GitError {
    #[error("Repository not found at {path}")]
    RepoNotFound { path: PathBuf },

    #[error("Branch '{name}' already exists")]
    BranchExists { name: String },

    #[error("Merge conflict in {files_count} files")]
    MergeConflict { files_count: usize },

    #[error("Authentication failed for remote '{remote}'")]
    AuthFailed { remote: String },

    #[error(transparent)]
    Git2(#[from] git2::Error),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// 2. Service 层返回 Result<T, GitError>
pub fn create_branch(name: &str) -> Result<Branch, GitError> { ... }

// 3. Application 层使用 anyhow 包装
pub fn handle_create_branch(&mut self, cx: &mut Context<Self>) {
    match self.repo.create_branch(&self.new_branch_name) {
        Ok(branch) => {
            cx.notify();
            // 发送成功通知
        }
        Err(e) => {
            // 发送错误通知给用户
            self.notify_error(format!("创建分支失败: {}", e), cx);
        }
    }
}
```

## 7.4 组件开发规范

遵循 GPUI 组件开发模式 (参考 `.agents/skills/gpui-new-component/`):

```rust
/// 无状态组件 (RenderOnce)
#[derive(IntoElement)]
pub struct StatusBadge {
    status: FileStatus,
    style: StyleRefinement,
}

impl StatusBadge {
    pub fn new(status: FileStatus) -> Self { ... }
}

impl Styled for StatusBadge {
    fn style(&mut self) -> &mut StyleRefinement { &mut self.style }
}

impl RenderOnce for StatusBadge {
    fn render(self, _: &mut Window, _: &mut App) -> impl IntoElement { ... }
}

/// 有状态组件 (Render)
pub struct CommitView {
    staged_files: Vec<FileEntry>,
    message: String,
    repository: WeakEntity<Repository>,
}

impl Render for CommitView {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement { ... }
}
```

## 7.5 异步操作规范

```rust
// 1. 耗时的 Git 操作放到后台线程
fn fetch_remote(&mut self, cx: &mut Context<Self>) {
    let weak = cx.entity().downgrade();
    let repo_path = self.path.clone();

    cx.background_spawn(async move {
        // 后台线程: 执行 git fetch
        let result = git_fetch(&repo_path).await;
        result
    })
    .then(cx.spawn(move |result, cx| {
        // 前台线程: 更新 UI
        weak.update(cx, |state, cx| {
            match result {
                Ok(_) => state.refresh_status(cx),
                Err(e) => state.notify_error(e, cx),
            }
            cx.notify();
        }).ok();
    }))
    .detach();
}

// 2. 存储 Task handle 以支持取消
pub struct Project {
    fetch_task: Option<Task<()>>,  // drop 时自动取消
}
```

## 7.6 测试规范

```rust
// 单元测试: Git 操作层
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_create_branch() {
        let dir = TempDir::new().unwrap();
        let repo = Repository::init(dir.path()).unwrap();

        // 先创建一个初始 commit
        repo.commit_empty("initial commit").unwrap();

        let branch = repo.create_branch("feature/test").unwrap();
        assert_eq!(branch.name, "feature/test");
    }
}

// GPUI 组件测试 (参考 .agents/skills/gpui-test/)
#[cfg(test)]
mod ui_tests {
    use gpui::TestAppContext;

    #[gpui::test]
    async fn test_commit_view(cx: &mut TestAppContext) {
        // 测试 UI 组件行为
    }
}
```
