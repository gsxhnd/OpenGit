//! 仓库操作集成测试 —— Repository integration tests
//!
//! 测试 `Repository` (git2 后端) 的核心操作：
//! - 仓库生命周期（创建、打开、克隆）
//! - 状态查询
//! - 提交操作
//! - 分支管理
//! - 暂存区操作
//!
//! Tests core Repository operations with temporary directories.

use ogit::{GitError, GitOps, Repository};
use std::fs;
use std::path::PathBuf;

/// 创建一个临时 Git 仓库（含至少一个提交） —— Create a temp repo with at least one commit
fn create_temp_repo_with_commit() -> (PathBuf, tempfile::TempDir) {
    let dir = tempfile::tempdir().expect("Failed to create temp dir");
    let path = dir.path().to_path_buf();
    let git2_repo = git2::Repository::init(&path).expect("Failed to init git2 repo");
    // 创建一个初始提交以建立 HEAD —— Create initial commit to establish HEAD
    let file_path = path.join("init.txt");
    fs::write(&file_path, "init").expect("Failed to write test file");
    let mut index = git2_repo.index().expect("Failed to get index");
    index
        .add_path(std::path::Path::new("init.txt"))
        .expect("Failed to add to index");
    index.write().expect("Failed to write index");
    let tree_id = index.write_tree().expect("Failed to write tree");
    let tree = git2_repo.find_tree(tree_id).expect("Failed to find tree");
    let sig = git2::Signature::now("Test User", "test@example.com").expect("Failed to create sig");
    git2_repo
        .commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
        .expect("Failed to commit");
    (path, dir)
}

/// 在已有仓库中创建并提交一个文件 —— Create and commit a file in existing repo
fn commit_file(repo_path: &PathBuf, filename: &str, content: &str) -> String {
    let file_path = repo_path.join(filename);
    fs::write(&file_path, content).expect("Failed to write test file");

    let git2_repo = git2::Repository::open(repo_path).expect("Failed to open git2 repo");
    let mut index = git2_repo.index().expect("Failed to get index");
    index
        .add_path(std::path::Path::new(filename))
        .expect("Failed to add to index");
    index.write().expect("Failed to write index");

    let tree_id = index.write_tree().expect("Failed to write tree");
    let tree = git2_repo.find_tree(tree_id).expect("Failed to find tree");

    let sig = git2::Signature::now("Test User", "test@example.com").expect("Failed to create sig");
    let parent = git2_repo
        .head()
        .expect("Failed to get head")
        .peel(git2::ObjectType::Commit)
        .expect("Failed to peel")
        .into_commit()
        .expect("Failed to get commit");

    let commit_id = git2_repo
        .commit(
            Some("HEAD"),
            &sig,
            &sig,
            &format!("Commit: {}", filename),
            &tree,
            &[&parent],
        )
        .expect("Failed to commit");

    commit_id.to_string()
}

// ============================================================================
// 仓库生命周期 —— Repository lifecycle
// ============================================================================

#[test]
fn test_open_valid_repo() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");
    assert_eq!(repo.path(), &path);
    assert!(repo.path().join(".git").exists());
}

#[test]
fn test_open_non_existent_path() {
    let result = Repository::open(PathBuf::from("/nonexistent/path/to/repo"));
    assert!(result.is_err());
    match result {
        Err(GitError::RepoNotFound { path }) => {
            assert!(path.to_string_lossy().contains("nonexistent"));
        }
        _ => panic!("Expected RepoNotFound error"),
    }
}

#[test]
fn test_open_empty_directory() {
    let dir = tempfile::tempdir().expect("Failed to create temp dir");
    let result = Repository::open(dir.path().to_path_buf());
    assert!(result.is_err());
    match result {
        Err(GitError::RepoNotFound { .. }) => {}
        _ => panic!("Expected RepoNotFound error"),
    }
}

#[test]
fn test_init_new_repo() {
    let dir = tempfile::tempdir().expect("Failed to create temp dir");
    let path = dir.path().join("new_repo");
    let repo = Repository::init(&path).expect("Failed to init repo");
    assert_eq!(repo.path(), &path);
    assert!(path.join(".git").exists());
}

// ============================================================================
// 状态查询 —— Status queries
// ============================================================================

#[test]
fn test_get_status_with_commit() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");
    let status = repo.get_status().expect("Failed to get status");
    assert!(status.status.unstaged_files.is_empty());
    assert!(status.status.untracked_files.is_empty());
    assert!(status.status.staged_files.is_empty());
}

#[test]
fn test_get_head_with_commit() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");
    let head = repo.get_head().expect("Failed to get head");
    assert!(head.is_some());
    assert_eq!(head.unwrap().summary, "Initial commit");
}

#[test]
fn test_get_status_with_file() {
    let (path, _dir) = create_temp_repo_with_commit();
    let file_path = path.join("test.txt");
    fs::write(&file_path, "hello").expect("Failed to write file");

    let repo = Repository::open(&path).expect("Failed to open repo");
    let status = repo.get_status().expect("Failed to get status");
    assert!(!status.status.untracked_files.is_empty());
    assert_eq!(status.status.untracked_files.len(), 1);
    assert_eq!(
        status.status.untracked_files[0].path,
        PathBuf::from("test.txt")
    );
}

#[test]
fn test_get_status_after_commit() {
    let (path, _dir) = create_temp_repo_with_commit();
    commit_file(&path, "main.rs", "fn main() {}");

    let repo = Repository::open(&path).expect("Failed to open repo");
    let status = repo.get_status().expect("Failed to get status");
    assert!(status.status.untracked_files.is_empty());
    assert!(status.status.unstaged_files.is_empty());
}

// ============================================================================
// 提交历史 —— Commit history
// ============================================================================

#[test]
fn test_get_history_with_commits() {
    let (path, _dir) = create_temp_repo_with_commit();
    let hash2 = commit_file(&path, "b.txt", "b");

    let repo = Repository::open(&path).expect("Failed to open repo");
    let history = repo.get_history(10, 0).expect("Failed to get history");

    // 2 commits: initial + b.txt. Most recent first.
    assert_eq!(history.len(), 2);
    assert_eq!(history[0].hash, hash2);
    assert_eq!(history[0].summary, "Commit: b.txt");
    assert_eq!(history[1].summary, "Initial commit");
}

#[test]
fn test_get_history_pagination() {
    let (path, _dir) = create_temp_repo_with_commit();
    for i in 0..5 {
        commit_file(&path, &format!("file_{}.txt", i), &format!("content {}", i));
    }
    // Total: 1 initial + 5 = 6 commits

    let repo = Repository::open(&path).expect("Failed to open repo");

    let page1 = repo.get_history(2, 0).expect("Failed to get page 1");
    assert_eq!(page1.len(), 2);

    let page2 = repo.get_history(2, 2).expect("Failed to get page 2");
    assert_eq!(page2.len(), 2);

    let page3 = repo.get_history(2, 4).expect("Failed to get page 3");
    assert_eq!(page3.len(), 2);

    let page4 = repo.get_history(2, 6).expect("Failed to get page 4");
    assert_eq!(page4.len(), 0);

    assert_ne!(page1[0].hash, page2[0].hash);
}

#[test]
fn test_get_branch_commits() {
    let (path, _dir) = create_temp_repo_with_commit();
    commit_file(&path, "a.txt", "a");

    let repo = Repository::open(&path).expect("Failed to open repo");
    let status = repo.get_status().expect("Failed to get status");
    let main_branch = status
        .status
        .current_branch
        .unwrap_or_else(|| "master".to_string());

    let commits = repo
        .get_branch_commits(&main_branch, 10, 0)
        .expect("Failed to get branch commits");
    assert!(!commits.is_empty());
}

// ============================================================================
// 提交操作 —— Commit operations
// ============================================================================

#[test]
fn test_commit_creates_commit() {
    let (path, _dir) = create_temp_repo_with_commit();
    let file_path = path.join("hello.txt");
    fs::write(&file_path, "world").expect("Failed to write file");

    let repo = Repository::open(&path).expect("Failed to open repo");

    repo.stage_files(&["hello.txt"])
        .expect("Failed to stage file");

    let commit = repo
        .commit("Feature commit", Some("Feature Author"))
        .expect("Failed to commit");

    assert_eq!(commit.summary, "Feature commit");
    assert_eq!(commit.author, "Feature Author");
    assert!(!commit.hash.is_empty());

    let head = repo.get_head().expect("Failed to get head");
    assert!(head.is_some());
    assert_eq!(head.unwrap().hash, commit.hash);
}

#[test]
fn test_commit_without_author() {
    let (path, _dir) = create_temp_repo_with_commit();
    let file_path = path.join("auto.txt");
    fs::write(&file_path, "auto").expect("Failed to write file");

    let repo = Repository::open(&path).expect("Failed to open repo");

    repo.stage_files(&["auto.txt"])
        .expect("Failed to stage file");

    let commit = repo.commit("Auto commit", None).expect("Failed to commit");

    assert_eq!(commit.summary, "Auto commit");
    assert!(!commit.hash.is_empty());
}

// ============================================================================
// 分支操作 —— Branch operations
// ============================================================================

#[test]
fn test_get_branches() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");
    let branches = repo.get_branches().expect("Failed to get branches");
    assert!(!branches.is_empty());

    let main_branch = branches.iter().find(|b| b.is_head);
    assert!(main_branch.is_some());
}

#[test]
fn test_create_and_switch_branch() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");

    repo.create_branch("feature", None)
        .expect("Failed to create branch");

    let branches = repo.get_branches().expect("Failed to get branches");
    assert!(branches.iter().any(|b| b.name == "feature"));

    repo.switch_branch("feature")
        .expect("Failed to switch branch");

    let status = repo.get_status().expect("Failed to get status");
    assert_eq!(status.status.current_branch.unwrap(), "feature");
}

// ============================================================================
// 暂存区操作 —— Staging operations
// ============================================================================

#[test]
fn test_stage_and_unstage_file() {
    let (path, _dir) = create_temp_repo_with_commit();
    let file_path = path.join("hello.txt");
    fs::write(&file_path, "world").expect("Failed to write file");

    let repo = Repository::open(&path).expect("Failed to open repo");

    repo.stage_files(&["hello.txt"])
        .expect("Failed to stage file");

    let status = repo.get_status().expect("Failed to get status");
    assert!(status.status.untracked_files.is_empty());
    assert!(!status.status.staged_files.is_empty());

    repo.unstage_files(&["hello.txt"])
        .expect("Failed to unstage file");

    let status = repo.get_status().expect("Failed to get status");
    assert!(status.status.staged_files.is_empty());
}

#[test]
fn test_stage_multiple_files() {
    let (path, _dir) = create_temp_repo_with_commit();
    fs::write(path.join("a.txt"), "a").expect("Failed to write");
    fs::write(path.join("b.txt"), "b").expect("Failed to write");
    fs::write(path.join("c.txt"), "c").expect("Failed to write");

    let repo = Repository::open(&path).expect("Failed to open repo");

    repo.stage_files(&["a.txt", "b.txt", "c.txt"])
        .expect("Failed to stage files");

    let status = repo.get_status().expect("Failed to get status");
    assert_eq!(status.status.staged_files.len(), 3);
}

// ============================================================================
// 错误路径 —— Error paths
// ============================================================================

#[test]
fn test_repo_path_persistence() {
    let (path, _dir) = create_temp_repo_with_commit();
    let repo = Repository::open(&path).expect("Failed to open repo");
    assert_eq!(repo.path(), &path);
}
