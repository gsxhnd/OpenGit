/// UI Views for different features

pub mod welcome;
pub mod commit;
pub mod history;
pub mod branches;

pub use welcome::WelcomeView;
pub use commit::CommitView;
pub use history::HistoryView;
pub use branches::BranchesView;
