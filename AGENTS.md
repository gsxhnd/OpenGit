# OpenGit: Agent Development Guide

OpenGit is a **cross-platform Git GUI client** built with Rust and GPUI (Zed's GPU-accelerated UI framework), designed to manage multiple Git repositories in a single window with native performance.

## Quick Start

### Build & Run

```bash
# Release build required (debug GPUI is too slow)
cargo build --release
cargo run --release

# Quick checks
cargo check                                          # Syntax only
cargo fmt && cargo clippy -- -D warnings            # Format + lint
cargo test                                          # Run tests
```

### Linux Prerequisites

```bash
sudo apt install -y build-essential cmake pkg-config libssl-dev libgit2-dev \
  libx11-dev libxcb1-dev libxkbcommon-dev libwayland-dev libvulkan-dev \
  libfontconfig-dev libfreetype-dev
```

See [docs/dev/10-build-and-run.md](docs/dev/10-build-and-run.md) for macOS/Windows setup.

## Architecture Overview

OpenGit uses a **4-layer hierarchical design**:

| Layer | Responsibility | Example Files |
|-------|---|---|
| **UI Layer** | GPUI views, components, events | `crates/app/src/views/`, `crates/app/src/app_component/` |
| **Application** | Business logic, entity state, command dispatch | `crates/app/src/app.rs`, `crates/app/src/workspace.rs` |
| **Service** | Git operations, platform APIs, AI | `crates/ogit/src/operations.rs`, `crates/app/src/settings.rs` |
| **Core** | Data models, utilities | `crates/ogit/src/model.rs`, `crates/app/src/project.rs` |

### Module Organization

| Module | File | Purpose |
|--------|------|---------|
| **app** | `crates/app/src/app.rs` | Root GPUI app, global state (`OpenGitApp` entity) |
| **workspace** | `crates/app/src/workspace.rs` | Multi-project management, tabs, grouping |
| **git backend** | `crates/ogit/src/operations.rs` | High-level Git operations (commit, push, pull, etc.) |
| **views** | `crates/app/src/views/` | Main UI components (commits, history, diff, branches) |
| **ui components** | `crates/app/src/app_component/` | Custom GPUI components (file tree, graph canvas, etc.) |
| **settings** | `crates/app/src/project.rs` | Configuration, themes, preferences |

## Critical Patterns & Conventions

### 1. State Management (GPUI Entity System)

```rust
// Define a stateful component as an Entity
#[derive(Entity)]
pub struct Repository {
    pub path: PathBuf,
    pub status: WorkingTreeStatus,
    pub branches: Vec<Branch>,
}

// Access via weak references to avoid circular dependencies
pub struct Project {
    repository: WeakEntity<Repository>,  // ← Use WeakEntity, not Entity
}

// Update state in handlers
pub fn refresh_status(&mut self, cx: &mut Context<Self>) {
    // Modify state
    self.status = fetch_status(&self.path);
    
    // Notify UI to redraw
    cx.notify();
}
```

**Critical rule**: Always call `cx.notify()` after state changes; UI won't redraw otherwise.

See [Agent Skills: gpui-entity](./.agents\skills\gpui-entity\SKILL.md) for detailed patterns.

### 2. Async Operations

```rust
// Background task (CPU/I/O intensive)
cx.background_spawn(async move {
    git_fetch(&repo_path).await  // Runs on thread pool
})

// Foreground task (updates UI)
.then(cx.spawn(move |result, cx| {
    weak_entity.update(cx, |state, cx| {
        state.refresh_status(cx);
        cx.notify();
    }).ok();
}))
.detach();
```

**Rule**: Store `Task` in struct fields; dropping auto-cancels. Use `WeakEntity` for cross-component references.

See [Agent Skills: gpui-async](.agents\skills\gpui-async\SKILL.md).

### 3. Dual Git Backend Strategy

OpenGit supports **two Git backends**:

- **git2** (default): Fast libgit2 binding, good for common operations
- **git cmd** (optional): System git binary, full compatibility for edge cases

```rust
pub enum GitBackendType {
    #[default]
    Git2,   // libgit2
    GitCmd, // System git command
}
```

Both implement a unified `GitOps` trait. Users can switch per-project via settings without restart.

### 4. Error Handling

```rust
// Service layer: domain-specific Result types
pub fn create_branch(name: &str) -> Result<Branch, GitError> { ... }

// Application layer: match and notify user
match self.repo.create_branch(&name) {
    Ok(branch) => { self.notify_success(format!("Branch '{}' created", branch.name)); }
    Err(e) => { self.notify_error(format!("Failed: {}", e)); }
}
```

Use `thiserror` for custom error types. See [docs/dev/07-development-standards.md](docs/dev/07-development-standards.md#73-错误处理规范).

### 5. Component Development

```rust
// Stateless component: RenderOnce trait
#[derive(IntoElement)]
pub struct StatusBadge { status: FileStatus }

impl RenderOnce for StatusBadge {
    fn render(self) -> impl Element { ... }
}

// Stateful component: Render trait + Entity
pub struct CommitView {
    repository: WeakEntity<Repository>,
}

impl Render for CommitView {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) { ... }
}
```

See [Agent Skills: gpui-new-component](.agents\skills\gpui-new-component\SKILL.md).

## Code Quality Standards

- **Format**: `cargo fmt` (line width: 100 chars, defined in `rustfmt.toml`)
- **Lint**: Clippy `#[deny(warnings)]` enforced in CI
- **Docs**: All `pub` items require doc comments (`///`)
- **Tests**: Run with `cargo test`

See [docs/dev/07-development-standards.md](docs/dev/07-development-standards.md).

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Types/Structs | PascalCase | `CommitView`, `BranchList` |
| Functions/Methods | snake_case | `stage_files()`, `create_branch()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_COMMIT_HISTORY` |
| Entities | Descriptive noun | `Project`, `Repository` |
| Views | Functionality + View | `CommitView`, `HistoryView` |
| UI Components | Descriptive noun | `FileTree`, `DiffEditor` |
| Module files | snake_case | `commit_view.rs`, `file_tree.rs` |

## Critical Pitfalls to Avoid

1. **Always use `cargo build --release`**: Debug GPUI rendering is prohibitively slow
2. **Call `cx.notify()` after state changes**: UI won't redraw without it
3. **Use `WeakEntity` for references**: Holding `Entity` directly prevents cleanup; causes memory leaks
4. **Store `Task` in struct fields**: Don't let tasks go out of scope; dropping cancels them
5. **Don't create circular entity references**: Use weak references; the entity system detects and panics
6. **Platform paths**: Use `PathBuf` always; never concatenate paths as strings
7. **Install Linux dependencies**: Missing libx11, libwayland, libvulkan causes build failure
8. **One file watcher**: Don't spawn multiple file system watchers; use a centralized monitor
9. **Git backend switching is runtime-safe**: No app restart needed, but requires settings persistence
10. **Release commands before modifying repo state**: Clean up task handles and subscriptions properly

## Key Entry Points

| File | Purpose |
|------|---------|
| [crates/app/src/main.rs](crates/app/src/main.rs) | App bootstrap, theme loading |
| [crates/app/src/app.rs](crates/app/src/app.rs) | Root `OpenGitApp` entity, window management |
| [crates/ogit/src/lib.rs](crates/ogit/src/lib.rs) | Public git API; exports `Repository`, `GitOps` trait |
| [crates/ogit/src/operations.rs](crates/ogit/src/operations.rs) | High-level operations (commit, push, pull, merge) |
| [crates/app/src/workspace.rs](crates/app/src/workspace.rs) | Multi-project `Workspace` entity |
| [crates/app/src/project.rs](crates/app/src/project.rs) | Per-repository `Project` entity |
| [crates/app/src/views/](crates/app/src/views/) | Core GPUI view components |
| [themes/](themes/) | 21+ built-in theme JSON files (hot-reloadable) |

## Available Agent Skills

Use these skills for domain-specific guidance:

- [gpui-action](.agents\skills\gpui-action\SKILL.md): Actions, keyboard shortcuts, keybindings
- [gpui-async](.agents\skills\gpui-async\SKILL.md): Async, background tasks, concurrency
- [gpui-context](.agents\skills\gpui-context\SKILL.md): App/Window context types
- [gpui-entity](.agents\skills\gpui-entity\SKILL.md): Entity state management
- [gpui-event](.agents\skills\gpui-event\SKILL.md): Events, observers, subscriptions
- [gpui-focus-handle](.agents\skills\gpui-focus-handle\SKILL.md): Focus, keyboard navigation
- [gpui-layout-and-style](.agents\skills\gpui-layout-and-style\SKILL.md): Layout, CSS styling, Flexbox
- [gpui-new-component](.agents\skills\gpui-new-component\SKILL.md): Building new components
- [gpui-style-guide](.agents\skills\gpui-style-guide\SKILL.md): Code patterns from real codebase

## Documentation

Complete developer documentation available in [docs/dev/](docs/dev/):

- [01-overview.md](docs/dev/01-overview.md): Project purpose and principles
- [02-tech-stack.md](docs/dev/02-tech-stack.md): Dependencies and technology choices
- [04-architecture.md](docs/dev/04-architecture.md): Detailed system architecture
- [05-directory-structure.md](docs/dev/05-directory-structure.md): Full directory layout
- [06-design-decisions.md](docs/dev/06-design-decisions.md): Key design choices
- [07-development-standards.md](docs/dev/07-development-standards.md): Code style, naming, error handling
- [08-dependencies.md](docs/dev/08-dependencies.md): Dependency rationale
- [09-roadmap.md](docs/dev/09-roadmap.md): Feature roadmap and priorities
- [10-build-and-run.md](docs/dev/10-build-and-run.md): Setup and build instructions

## Common Development Tasks

| Task | Command | Notes |
|------|---------|-------|
| Build & run | `cargo run --release` | Always use `--release` |
| Quick syntax check | `cargo check` | Fast, doesn't generate binary |
| Format code | `cargo fmt` | Pre-commit |
| Run linter | `cargo clippy -- -D warnings` | CI enforces these |
| Run tests | `cargo test` | Or `cargo test git::` for module |
| Full CI check | `cargo fmt -- --check && cargo clippy -- -D warnings && cargo test` | Pre-commit |
| Debug GPUI | `RUST_LOG=gpui=debug cargo run --release` | Verbose logging |
| Debug git2 | `RUST_LOG=git2=trace cargo run --release` | Trace libgit2 calls |
| Tweak themes | Edit `themes/*.json` | Auto hot-reloads |

## Getting Help

1. **Architecture questions**: See [docs/dev/04-architecture.md](docs/dev/04-architecture.md)
2. **Component development**: Use gpui-new-component skill
3. **Async/state patterns**: Use gpui-async and gpui-entity skills
4. **Build/setup issues**: See [docs/dev/10-build-and-run.md](docs/dev/10-build-and-run.md)
5. **Design decisions**: Read [docs/dev/06-design-decisions.md](docs/dev/06-design-decisions.md)
