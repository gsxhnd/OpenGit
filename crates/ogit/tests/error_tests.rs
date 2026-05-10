//! 错误处理测试 —— Error handling tests
//!
//! 测试 `GitError` 枚举的 Display 和转换行为，
//! 以及 `ResetMode` 枚举的正确性。
//!
//! Tests GitError Display/From behavior and ResetMode correctness.

use ogit::{GitError, ResetMode};

// ============================================================================
// GitError Display —— Error display messages
// ============================================================================

#[test]
fn test_repo_not_found_display() {
    let path = std::path::PathBuf::from("/tmp/missing");
    let err = GitError::RepoNotFound { path: path.clone() };
    let msg = err.to_string();
    let lossy = path.to_string_lossy();
    assert!(msg.contains(&*lossy));
    assert!(msg.contains("not found"));
}

#[test]
fn test_read_error_display() {
    let err = GitError::ReadError("disk failure".into());
    let msg = err.to_string();
    assert!(msg.contains("disk failure"));
}

#[test]
fn test_write_error_display() {
    let err = GitError::WriteError("out of space".into());
    let msg = err.to_string();
    assert!(msg.contains("out of space"));
}

#[test]
fn test_branch_exists_display() {
    let err = GitError::BranchExists {
        name: "feature-1".into(),
    };
    let msg = err.to_string();
    assert!(msg.contains("feature-1"));
}

#[test]
fn test_branch_not_found_display() {
    let err = GitError::BranchNotFound {
        name: "deleted-branch".into(),
    };
    let msg = err.to_string();
    assert!(msg.contains("deleted-branch"));
}

#[test]
fn test_merge_conflict_display() {
    let err = GitError::MergeConflict { count: 3 };
    let msg = err.to_string();
    assert!(msg.contains("3"));
}

#[test]
fn test_auth_failed_display() {
    let err = GitError::AuthFailed {
        remote: "origin".into(),
    };
    let msg = err.to_string();
    assert!(msg.contains("origin"));
}

#[test]
fn test_remote_not_found_display() {
    let err = GitError::RemoteNotFound {
        remote: "upstream".into(),
    };
    let msg = err.to_string();
    assert!(msg.contains("upstream"));
}

#[test]
fn test_tag_exists_display() {
    let err = GitError::TagExists {
        name: "v1.0.0".into(),
    };
    let msg = err.to_string();
    assert!(msg.contains("v1.0.0"));
}

#[test]
fn test_invalid_ref_display() {
    let err = GitError::InvalidRef("refs/heads/broken".into());
    let msg = err.to_string();
    assert!(msg.contains("refs/heads/broken"));
}

#[test]
fn test_git2_error_from() {
    let result: Result<(), git2::Error> = Err(git2::Error::from_str("test error"));
    let git_err: Result<(), GitError> = result.map_err(|e| e.into());
    let msg = git_err.unwrap_err().to_string();
    assert!(msg.contains("test error"));
}

#[test]
fn test_io_error_from() {
    let result: Result<(), std::io::Error> = Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "file missing",
    ));
    let git_err: Result<(), GitError> = result.map_err(|e| e.into());
    let msg = git_err.unwrap_err().to_string();
    assert!(msg.contains("file missing"));
}

#[test]
fn test_unsupported_operation_display() {
    let err = GitError::UnsupportedOperation { op: "merge".into() };
    let msg = err.to_string();
    assert!(msg.contains("merge"));
    assert!(msg.contains("not yet implemented"));
}

// ============================================================================
// GitError Debug —— Error debug formatting
// ============================================================================

#[test]
fn test_all_errors_debug() {
    let errors = vec![
        GitError::RepoNotFound {
            path: std::path::PathBuf::from("/tmp"),
        },
        GitError::ReadError("test".into()),
        GitError::WriteError("test".into()),
        GitError::BranchExists {
            name: "test".into(),
        },
        GitError::BranchNotFound {
            name: "test".into(),
        },
        GitError::MergeConflict { count: 1 },
        GitError::AuthFailed {
            remote: "test".into(),
        },
        GitError::RemoteNotFound {
            remote: "test".into(),
        },
        GitError::TagExists {
            name: "test".into(),
        },
        GitError::InvalidRef("test".into()),
        GitError::UnsupportedOperation { op: "test".into() },
    ];

    for err in &errors {
        let debug_str = format!("{:?}", err);
        assert!(!debug_str.is_empty());
    }
}

// ============================================================================
// ResetMode —— Reset mode tests
// ============================================================================

#[test]
fn test_reset_mode_variants() {
    assert!(matches!(ResetMode::Soft, ResetMode::Soft));
    assert!(matches!(ResetMode::Mixed, ResetMode::Mixed));
    assert!(matches!(ResetMode::Hard, ResetMode::Hard));
}

#[test]
fn test_reset_mode_debug() {
    assert_eq!(format!("{:?}", ResetMode::Soft), "Soft");
    assert_eq!(format!("{:?}", ResetMode::Mixed), "Mixed");
    assert_eq!(format!("{:?}", ResetMode::Hard), "Hard");
}
