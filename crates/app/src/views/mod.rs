pub mod branches_view;
pub mod commit_view;
pub mod diff_view;
pub mod history_view;
pub mod project_sidebar;
pub mod stash_view;
pub mod status_bar;
pub mod tag_view;
pub mod title_bar;
// Phase 4 views
pub mod blame_view;
pub mod commit_detail;
pub mod file_history;
pub mod file_search;
pub mod graph_view;
pub mod reflog_view;

pub use branches_view::render_branches_view;
pub use commit_view::render_commit_view;
pub use diff_view::render_diff_view;
pub use history_view::render_history_view;
pub use project_sidebar::render_project_sidebar;
pub use stash_view::render_stash_view;
pub use status_bar::StatusBar;
pub use tag_view::render_tag_view;
pub use title_bar::TitleBar;
// Phase 4 re-exports
pub use blame_view::render_blame_view;
pub use commit_detail::render_commit_detail_view;
pub use file_history::render_file_history_view;
pub use file_search::render_file_search_view;
pub use graph_view::render_graph_view;
pub use reflog_view::render_reflog_view;
