# OpenGit: Agent Instructions

Cross-platform Git GUI built with Rust + GPUI (Zed's GPU-accelerated UI framework).

## Commands

```bash
# Always use --release — debug GPUI is unusably slow
cargo run --release
cargo build --release

# Verification sequence (CI order)
cargo fmt -- --check && cargo clippy -- -D warnings && cargo test

# Quick iteration
cargo check                          # Fast syntax check, no binary
cargo test -p ogit                   # Test only the git library crate
cargo test -p app                    # Test only the app crate

# Debug logging
RUST_LOG=gpui=debug cargo run --release
RUST_LOG=git2=trace cargo run --release
```

Binary name: `opengit` (defined in `crates/app/Cargo.toml`).

## Workspace Structure

```
Cargo.toml              # Workspace root, resolver = "2"
crates/
  ogit/                 # Git operations library (git2, thiserror, chrono, serde)
    src/
      lib.rs            # Public API: exports Repository, GitOps, GitError, ResetMode
      model.rs          # Pure data types (Commit, Branch, FileDiff, etc.)
      operations.rs     # GitOps trait (~30 methods), GitError enum (15 variants)
      repository/       # git2-based implementation split by concern
        mod.rs, branch.rs, commit.rs, diff.rs, history.rs,
        merge_reset.rs, remote.rs, staging.rs, stash.rs, status.rs, tag.rs
  app/                  # GPUI desktop application
    src/
      main.rs           # Entry point: logging, config, window creation
      lib.rs            # Module declarations, re-exports OpenGitApp, AppState, Project, Workspace
      app_state/        # Central state entity (AppState) split by domain
      app_component/    # OpenGitApp entity + Render impl + handlers
      views/            # UI views: commit, history, diff, branches, stash, tags, title_bar, status_bar
      settings/         # AppSettings: types, persistence, tests
      workspace.rs      # Multi-project workspace entity
      project.rs        # Per-repository project entity
      commit_editor.rs  # Commit message editor state
      menu.rs           # Menu bar construction
themes/                 # JSON theme files (hot-reloadable, no restart needed)
```

## Critical GPUI Pitfalls

These are the mistakes agents make most often:

1. **Always call `cx.notify()` after mutating state** — UI will not redraw without it
2. **Use `WeakEntity<T>` for cross-component references** — holding `Entity<T>` directly causes memory leaks and circular-reference panics
3. **Store `Task` in struct fields** — dropping a Task cancels it silently
4. **Background work → foreground update pattern**:
   ```rust
   cx.background_spawn(async move { /* I/O */ })
     .then(cx.spawn(move |result, cx| {
         weak.update(cx, |state, cx| { state.apply(result); cx.notify(); }).ok();
     }))
     .detach();
   ```
5. **Stateless vs stateful components**: `RenderOnce` + `#[derive(IntoElement)]` for stateless; `Render` trait + entity for stateful

## Code Style

- `rustfmt.toml`: `max_width = 100`
- Clippy: `deny(warnings)` — all warnings are errors
- All `pub` items need `///` doc comments
- Source comments are bilingual (Chinese + English), follow this pattern when adding new ones
- Error types use `thiserror`; app layer matches on domain errors and surfaces user-friendly messages
- `#![allow(dead_code, unused_imports)]` is set in `ogit/src/lib.rs` during development

## Architecture Notes

- **AppState** is the central entity holding all repository state; views hold `WeakEntity<AppState>` and read from it
- **GitOps trait** in `ogit/src/operations.rs` is the abstraction boundary — currently only git2 backend exists in `repository/`
- **gpui-component** (from `github.com/longbridge/gpui-component`) provides higher-level UI primitives; `Root` wraps the app view
- **Theme loading**: watches `./themes` directory at runtime; edits auto-reload without restart
- **Settings persistence**: `AppSettings` handles config/log dirs, window bounds, theme name; saves on window close
- **File watching**: uses `notify` crate (v6); centralize watchers, don't spawn multiples

## Key Dependencies

| Crate | Purpose |
|-------|---------|
| `gpui` | UI framework (from Zed repo) |
| `gpui-component` | Higher-level UI components (longbridge) |
| `git2` | libgit2 bindings for git operations |
| `notify` | Filesystem watching |
| `tokio` | Async runtime (rt, sync, time features) |
| `tracing` / `tracing-subscriber` | Structured logging |

## Agent Skills

Load these via the skill tool for domain-specific GPUI guidance:

- `gpui-new-component` — building new UI components
- `gpui-entity` — state management patterns
- `gpui-async` — background tasks, spawn patterns
- `gpui-context` — App/Window/AsyncApp context types
- `gpui-action` — actions and keyboard shortcuts
- `gpui-event` — events, observers, subscriptions
- `gpui-element` — low-level custom Element API
- `gpui-layout-and-style` — flexbox, styling
- `gpui-focus-handle` — focus and keyboard navigation
- `gpui-style-guide` — code patterns from gpui-component

## Detailed Documentation

See `docs/dev/` for architecture deep-dives, design decisions, and build instructions.
