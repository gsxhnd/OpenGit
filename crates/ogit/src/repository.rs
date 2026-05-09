/// Repository abstraction over git2
use crate::model::*;
use crate::operations::{GitError, GitOps, ResetMode};
use chrono::{TimeZone, Utc};
use git2::{
    AnnotatedCommit, BranchType, DiffFlags, DiffLineType, DiffOptions, ObjectType,
    Repository as Git2Repo, Signature, Status,
};
use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// Repository wrapper around git2 with interior mutability
pub struct Repository {
    repo: Mutex<Git2Repo>,
    path: PathBuf,
}

impl Repository {
    /// Open a repository at the given path
    pub fn open(path: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = path.into();
        let repo =
            Git2Repo::open(&path).map_err(|_| GitError::RepoNotFound { path: path.clone() })?;

        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// Clone a repository from a URL to the given path
    pub fn clone(url: &str, into: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = into.into();
        let repo = git2::build::RepoBuilder::new()
            .clone(url, &path)
            .map_err(|e| GitError::WriteError(format!("Failed to clone {}: {}", url, e)))?;
        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// Create a new repository at the given path
    pub fn init(path: impl Into<PathBuf>) -> Result<Self, GitError> {
        let path = path.into();
        let repo = Git2Repo::init(&path)?;
        Ok(Self {
            repo: Mutex::new(repo),
            path,
        })
    }

    /// Get repository path
    pub fn path(&self) -> &PathBuf {
        &self.path
    }
}

impl GitOps for Repository {
    fn get_status(&self) -> Result<RepositoryStatus, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut status = RepositoryStatus::default();

        // Get working tree status
        let mut unstaged = Vec::new();
        let mut staged = Vec::new();
        let mut untracked = Vec::new();

        let statuses = repo.statuses(None)?;
        for entry in statuses.iter() {
            let s = entry.status();
            if s.contains(Status::IGNORED) {
                continue;
            }

            let path = PathBuf::from(entry.path().unwrap_or(""));
            let file_status = git_status_to_model(s);

            let has_index = s.intersects(
                Status::INDEX_NEW
                    | Status::INDEX_MODIFIED
                    | Status::INDEX_DELETED
                    | Status::INDEX_RENAMED
                    | Status::INDEX_TYPECHANGE,
            );
            let has_wt = s.intersects(
                Status::WT_MODIFIED
                    | Status::WT_DELETED
                    | Status::WT_TYPECHANGE
                    | Status::WT_RENAMED
                    | Status::CONFLICTED,
            );

            if s.contains(Status::WT_NEW) && !has_index {
                untracked.push(FileEntry {
                    path,
                    status: file_status,
                    staged: false,
                    unstaged: true,
                });
                continue;
            }

            if has_index {
                staged.push(FileEntry {
                    path: path.clone(),
                    status: file_status,
                    staged: true,
                    unstaged: false,
                });
            }
            if has_wt || s.contains(Status::WT_NEW) {
                unstaged.push(FileEntry {
                    path,
                    status: file_status,
                    staged: false,
                    unstaged: true,
                });
            }
        }

        // Get current branch
        let head = repo.head().ok();
        let current_branch = head
            .as_ref()
            .and_then(|h| h.shorthand())
            .map(|s| s.to_string());

        // Get HEAD commit
        let head_commit = match repo.head() {
            Ok(head) => {
                let target = head.target().ok_or_else(|| {
                    GitError::InvalidRef("HEAD does not point to a commit".to_string())
                })?;

                let commit = repo.find_commit(target)?;
                Some(git_commit_to_model(commit))
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => None,
            Err(e) => return Err(GitError::from(e)),
        };

        // Get branches
        let mut branches = Vec::new();
        let head_name = repo
            .head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()));

        for branch_result in repo.branches(None)? {
            let (branch, _) = branch_result?;
            let name = branch.name()?.unwrap_or("").to_string();
            let target = branch
                .get()
                .target()
                .map(|oid| oid.to_string())
                .unwrap_or_default();

            let upstream = branch
                .upstream()
                .ok()
                .and_then(|b| b.name().ok().flatten().map(|n| n.to_string()));

            branches.push(Branch {
                name: name.clone(),
                target,
                is_local: true,
                is_head: head_name.as_ref().map(|h| h == &name).unwrap_or(false),
                upstream,
            });
        }

        // Get remotes
        let mut remotes = Vec::new();
        for name_opt in repo.remotes()?.iter() {
            if let Some(name) = name_opt {
                if let Ok(remote) = repo.find_remote(name) {
                    let fetch_url = remote.url().unwrap_or("").to_string();
                    remotes.push(Remote {
                        name: name.to_string(),
                        fetch_url,
                        push_url: None,
                    });
                }
            }
        }

        // Get tags
        let mut tags = Vec::new();
        for tag_name in repo.tag_names(None)?.iter().flatten() {
            let oid = repo.revparse_single(tag_name)?;
            tags.push(Tag {
                name: tag_name.to_string(),
                target: oid.id().to_string(),
                message: None,
                tagger: None,
            });
        }

        status.status = WorkingTreeStatus {
            unstaged_files: unstaged,
            staged_files: staged,
            untracked_files: untracked,
            current_branch,
            merge_head: None,
            rebase_merge: None,
        };

        status.head = head_commit;
        status.branches = branches;
        status.remotes = remotes;
        status.tags = tags;

        if let Ok(head_ref) = repo.head() {
            let local_branch = git2::Branch::wrap(head_ref);
            if let Ok(upstream_branch) = local_branch.upstream() {
                if let (Ok(local_commit), Ok(upstream_commit)) = (
                    local_branch.get().peel_to_commit(),
                    upstream_branch.get().peel_to_commit(),
                ) {
                    if let Ok((ahead, behind)) =
                        repo.graph_ahead_behind(local_commit.id(), upstream_commit.id())
                    {
                        status.ahead = ahead;
                        status.behind = behind;
                    }
                }
            }
        }

        Ok(status)
    }

    fn get_head(&self) -> Result<Option<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        match repo.head() {
            Ok(head) => {
                let target = head.target().ok_or_else(|| {
                    GitError::InvalidRef("HEAD does not point to a commit".to_string())
                })?;

                let commit = repo.find_commit(target)?;
                Ok(Some(git_commit_to_model(commit)))
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => Ok(None),
            Err(e) => Err(GitError::from(e)),
        }
    }

    fn get_history(&self, count: usize, skip: usize) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;

        for (i, oid_result) in revwalk.enumerate() {
            if i < skip {
                continue;
            }
            if i >= skip + count {
                break;
            }

            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    fn get_branch_commits(
        &self,
        branch: &str,
        count: usize,
        skip: usize,
    ) -> Result<Vec<Commit>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut commits = Vec::new();
        let mut revwalk = repo.revwalk()?;
        revwalk.push_ref(&format!("refs/heads/{}", branch))?;

        for (i, oid_result) in revwalk.enumerate() {
            if i < skip {
                continue;
            }
            if i >= skip + count {
                break;
            }

            let oid = oid_result?;
            let commit = repo.find_commit(oid)?;
            commits.push(git_commit_to_model(commit));
        }

        Ok(commits)
    }

    fn get_commit(&self, hash: &str) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;
        Ok(git_commit_to_model(commit))
    }

    fn get_commit_diff(&self, hash: &str) -> Result<Vec<FileDiff>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;

        let tree = commit.tree()?;
        let parent_tree = if commit.parent_count() > 0 {
            Some(commit.parent(0)?.tree()?)
        } else {
            None
        };

        let diff = if let Some(parent_tree) = parent_tree {
            repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?
        } else {
            repo.diff_tree_to_tree(None, Some(&tree), None)?
        };

        parse_diff_to_model(&diff)
    }

    fn get_file_diff(&self, path: &str) -> Result<FileDiff, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut opts = DiffOptions::new();
        opts.pathspec(Path::new(path));
        let diff = repo.diff_index_to_workdir(None, Some(&mut opts))?;
        let parsed = parse_diff_to_model(&diff)?;
        let want = Path::new(path);
        if let Some(fd) = parsed.into_iter().find(|f| f.path == want) {
            return Ok(fd);
        }
        Ok(FileDiff {
            path: PathBuf::from(path),
            old_path: None,
            status: FileStatus::Unmodified,
            hunks: Vec::new(),
            is_binary: false,
        })
    }

    fn get_branches(&self) -> Result<Vec<Branch>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut branches = Vec::new();
        let head_name = repo
            .head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()));

        for branch_result in repo.branches(None)? {
            let (branch, _) = branch_result?;
            let name = branch.name()?.unwrap_or("").to_string();
            let target = branch
                .get()
                .target()
                .map(|oid| oid.to_string())
                .unwrap_or_default();

            let upstream = branch
                .upstream()
                .ok()
                .and_then(|b| b.name().ok().flatten().map(|n| n.to_string()));

            branches.push(Branch {
                name: name.clone(),
                target,
                is_local: true,
                is_head: head_name.as_ref().map(|h| h == &name).unwrap_or(false),
                upstream,
            });
        }

        Ok(branches)
    }

    fn create_branch(&self, name: &str, target: Option<&str>) -> Result<Branch, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let target_oid = if let Some(target) = target {
            git2::Oid::from_str(target)?
        } else {
            repo.head()?
                .target()
                .ok_or_else(|| GitError::InvalidRef("Cannot resolve HEAD".to_string()))?
        };

        let target_commit = repo.find_commit(target_oid)?;
        repo.branch(name, &target_commit, false)?;

        Ok(Branch {
            name: name.to_string(),
            target: target_oid.to_string(),
            is_local: true,
            is_head: false,
            upstream: None,
        })
    }

    fn delete_branch(&self, name: &str, _force: bool) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut branch = repo.find_branch(name, BranchType::Local)?;
        branch.delete()?;
        Ok(())
    }

    fn switch_branch(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let _branch = repo.find_branch(name, BranchType::Local)?;
        let obj = repo.revparse_single(&format!("refs/heads/{}", name))?;
        let mut checkout = git2::build::CheckoutBuilder::default();
        checkout.force();
        repo.checkout_tree(&obj, Some(&mut checkout))?;
        repo.set_head(&format!("refs/heads/{}", name))?;
        Ok(())
    }

    fn get_remotes(&self) -> Result<Vec<Remote>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut remotes = Vec::new();
        for name_opt in repo.remotes()?.iter() {
            if let Some(name) = name_opt {
                if let Ok(remote) = repo.find_remote(name) {
                    let fetch_url = remote.url().unwrap_or("").to_string();
                    remotes.push(Remote {
                        name: name.to_string(),
                        fetch_url,
                        push_url: None,
                    });
                }
            }
        }
        Ok(remotes)
    }

    fn add_remote(&self, name: &str, url: &str) -> Result<Remote, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.remote(name, url)?;
        Ok(Remote {
            name: name.to_string(),
            fetch_url: url.to_string(),
            push_url: None,
        })
    }

    fn remove_remote(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.remote_delete(name)?;
        Ok(())
    }

    fn get_tags(&self) -> Result<Vec<Tag>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut tags = Vec::new();
        for tag_name in repo.tag_names(None)?.iter().flatten() {
            let oid = repo.revparse_single(tag_name)?;
            tags.push(Tag {
                name: tag_name.to_string(),
                target: oid.id().to_string(),
                message: None,
                tagger: None,
            });
        }
        Ok(tags)
    }

    fn create_tag(
        &self,
        name: &str,
        target: Option<&str>,
        message: Option<&str>,
    ) -> Result<Tag, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let target_oid = if let Some(target) = target {
            git2::Oid::from_str(target)?
        } else {
            repo.head()?
                .target()
                .ok_or_else(|| GitError::InvalidRef("Cannot resolve HEAD".to_string()))?
        };

        if let Some(message) = message {
            // Annotated tag
            let sig = repo.signature()?;
            repo.tag(
                name,
                &repo.find_object(target_oid, None)?,
                &sig,
                message,
                false,
            )?;
        } else {
            // Lightweight tag
            repo.reference(&format!("refs/tags/{}", name), target_oid, false, "tag")?;
        }

        Ok(Tag {
            name: name.to_string(),
            target: target_oid.to_string(),
            message: message.map(|s| s.to_string()),
            tagger: None,
        })
    }

    fn delete_tag(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.tag_delete(name)?;
        Ok(())
    }

    fn stage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut index = repo.index()?;
        index.add_all(
            paths.iter().map(|p| std::path::Path::new(p)),
            git2::IndexAddOption::DEFAULT,
            None,
        )?;
        index.write()?;
        Ok(())
    }

    fn unstage_files(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        match repo.revparse_single("HEAD") {
            Ok(head) => {
                repo.reset_default(Some(&head), paths.iter().map(Path::new))?;
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => {
                let mut index = repo.index()?;
                for path in paths {
                    index.remove_path(Path::new(path))?;
                }
                index.write()?;
            }
            Err(e) => return Err(GitError::from(e)),
        }
        Ok(())
    }

    fn discard_changes(&self, paths: &[&str]) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        for path in paths {
            let mut checkout_options = git2::build::CheckoutBuilder::new();
            checkout_options.force();
            checkout_options.path(std::path::Path::new(path));
            repo.checkout_head(Some(&mut checkout_options))?;
        }
        Ok(())
    }

    fn commit(&self, message: &str, author: Option<&str>) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let signature = if let Some(author_str) = author {
            Signature::now(author_str, "unknown@example.com")?
        } else {
            repo.signature()?
        };

        let tree_id = {
            let mut index = repo.index()?;
            index.write_tree()?
        };

        let tree = repo.find_tree(tree_id)?;
        let parents: Vec<git2::Commit> = match repo.head() {
            Ok(head) => {
                let c = head
                    .peel(ObjectType::Commit)?
                    .into_commit()
                    .map_err(|_| GitError::InvalidRef("Cannot get parent commit".to_string()))?;
                vec![c]
            }
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => Vec::new(),
            Err(e) => return Err(GitError::from(e)),
        };

        let parent_refs: Vec<&git2::Commit> = parents.iter().collect();
        let commit_id = repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            parent_refs.as_slice(),
        )?;

        let commit = repo.find_commit(commit_id)?;
        Ok(git_commit_to_model(commit))
    }

    fn amend_commit(
        &self,
        message: Option<&str>,
        _author: Option<&str>,
    ) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let head = repo.head()?;
        let commit = head
            .peel(ObjectType::Commit)?
            .into_commit()
            .map_err(|_| GitError::InvalidRef("HEAD is not a commit".to_string()))?;

        let msg = message.unwrap_or_else(|| commit.message().unwrap_or(""));
        let tree_id = {
            let mut index = repo.index()?;
            index.write_tree()?
        };
        let tree = repo.find_tree(tree_id)?;

        let sig = repo.signature()?;
        let parents: Vec<_> = commit.parents().collect();
        let parent_refs: Vec<_> = parents.iter().collect();

        let amended_id =
            repo.commit(Some("HEAD"), &sig, &sig, msg, &tree, parent_refs.as_slice())?;

        let amended = repo.find_commit(amended_id)?;
        Ok(git_commit_to_model(amended))
    }

    fn fetch(&self, remote: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let mut remote = repo.find_remote(remote)?;
        remote.fetch(&[] as &[&str], None, None)?;
        Ok(())
    }

    fn pull(&self, remote_name: &str, branch_name: &str) -> Result<(), GitError> {
        {
            let repo = self
                .repo
                .lock()
                .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;
            let mut remote = repo.find_remote(remote_name)?;
            let refspec = format!(
                "refs/heads/{0}:refs/remotes/{1}/{0}",
                branch_name, remote_name
            );
            remote.fetch(&[refspec.as_str()], None, None)?;
        }

        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let fetch_head = repo.find_reference("FETCH_HEAD")?;
        let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;
        let (analysis, _) = repo.merge_analysis(&[&fetch_commit])?;

        if analysis.is_up_to_date() {
            return Ok(());
        }

        if analysis.is_fast_forward() {
            let refname = format!("refs/heads/{}", branch_name);
            if let Ok(mut local_ref) = repo.find_reference(&refname) {
                local_ref.set_target(
                    fetch_commit.id(),
                    &format!("pull: fast-forward {}", branch_name),
                )?;
            } else {
                repo.reference(
                    &refname,
                    fetch_commit.id(),
                    true,
                    &format!("pull: create {}", branch_name),
                )?;
            }
            repo.set_head(&refname)?;
            let mut co = git2::build::CheckoutBuilder::new();
            co.force();
            repo.checkout_head(Some(&mut co))?;
            return Ok(());
        }

        if analysis.is_normal() {
            let head_commit = repo.reference_to_annotated_commit(&repo.head()?)?;
            return pull_merge_normal(&repo, &head_commit, &fetch_commit);
        }

        Ok(())
    }

    fn push(&self, remote: &str, branch: &str, _force: bool) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let mut remote = repo.find_remote(remote)?;
        let refspec = format!("refs/heads/{0}:refs/heads/{0}", branch);
        remote.push(&[refspec.as_str()], None)?;
        Ok(())
    }

    fn merge(&self, _branch: &str) -> Result<(), GitError> {
        // TODO: Implement merge
        Ok(())
    }

    fn abort_merge(&self) -> Result<(), GitError> {
        // TODO: Implement abort merge
        Ok(())
    }

    fn resolve_conflict(&self, _path: &str, _resolution: &str) -> Result<(), GitError> {
        // TODO: Implement conflict resolution
        Ok(())
    }

    fn get_stashes(&self) -> Result<Vec<Stash>, GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut stashes = Vec::new();
        repo.stash_foreach(|idx, name, _oid| {
            stashes.push(Stash {
                id: format!("stash@{{{}}}", idx),
                description: name.to_string(),
                commit: String::new(),
            });
            true
        })?;
        Ok(stashes)
    }

    fn create_stash(&self, message: Option<&str>) -> Result<Stash, GitError> {
        let mut repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let sig = repo.signature()?;
        let stash_id = repo.stash_save(&sig, message.unwrap_or("stash"), None)?;

        Ok(Stash {
            id: format!("stash@{{{}}}", 0),
            description: message.map(|s| s.to_string()).unwrap_or_default(),
            commit: stash_id.to_string(),
        })
    }

    fn apply_stash(&self, _stash_id: &str) -> Result<(), GitError> {
        // TODO: Parse stash_id and apply
        Ok(())
    }

    fn pop_stash(&self, _stash_id: &str) -> Result<(), GitError> {
        // TODO: Parse stash_id and pop
        Ok(())
    }

    fn delete_stash(&self, _stash_id: &str) -> Result<(), GitError> {
        // TODO: Parse stash_id and delete
        Ok(())
    }

    fn revert_commit(&self, hash: &str) -> Result<Commit, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let oid = git2::Oid::from_str(hash)?;
        let commit = repo.find_commit(oid)?;
        let tree = commit.tree()?;

        let mut index = repo.index()?;
        index.read_tree(&tree)?;
        index.write()?;

        let sig = repo.signature()?;
        let revert_commit = repo.commit(
            Some("HEAD"),
            &sig,
            &sig,
            &format!("Revert \"{}\"", commit.summary().unwrap_or("commit")),
            &tree,
            &[&commit],
        )?;

        let result = repo.find_commit(revert_commit)?;
        Ok(git_commit_to_model(result))
    }

    fn reset(&self, target: &str, mode: ResetMode) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::WriteError("Failed to lock repository".to_string()))?;

        let obj = repo.revparse_single(target)?;
        let reset_type = match mode {
            ResetMode::Soft => git2::ResetType::Soft,
            ResetMode::Mixed => git2::ResetType::Mixed,
            ResetMode::Hard => git2::ResetType::Hard,
        };
        repo.reset(&obj, reset_type, None)?;
        Ok(())
    }
}

// Helper functions

fn git_status_to_model(status: git2::Status) -> FileStatus {
    if status.contains(Status::WT_DELETED) || status.contains(Status::INDEX_DELETED) {
        FileStatus::Deleted
    } else if status.contains(Status::WT_RENAMED) || status.contains(Status::INDEX_RENAMED) {
        FileStatus::Renamed
    } else if status.contains(Status::CONFLICTED) {
        FileStatus::Conflicted
    } else if status.contains(Status::WT_MODIFIED) || status.contains(Status::INDEX_MODIFIED) {
        FileStatus::Modified
    } else if status.contains(Status::WT_NEW) {
        FileStatus::Untracked
    } else if status.contains(Status::INDEX_NEW) {
        FileStatus::Added
    } else {
        FileStatus::Unmodified
    }
}

fn git_commit_to_model(commit: git2::Commit) -> Commit {
    let time_obj = commit.time();
    let datetime = Utc.timestamp_opt(time_obj.seconds(), 0).unwrap();

    Commit {
        hash: commit.id().to_string(),
        summary: commit.summary().unwrap_or("").to_string(),
        message: commit.message().unwrap_or("").to_string(),
        author: commit.author().name().unwrap_or("Unknown").to_string(),
        committer: commit.committer().name().unwrap_or("Unknown").to_string(),
        time: datetime,
        parents: commit.parents().map(|p| p.id().to_string()).collect(),
    }
}

fn pull_merge_normal(
    repo: &Git2Repo,
    local: &AnnotatedCommit<'_>,
    remote: &AnnotatedCommit<'_>,
) -> Result<(), GitError> {
    let local_tree = repo.find_commit(local.id())?.tree()?;
    let remote_tree = repo.find_commit(remote.id())?.tree()?;
    let ancestor = repo
        .find_commit(repo.merge_base(local.id(), remote.id())?)?
        .tree()?;
    let mut idx = repo.merge_trees(&ancestor, &local_tree, &remote_tree, None)?;
    if idx.has_conflicts() {
        repo.checkout_index(Some(&mut idx), None)?;
        let count = idx.conflicts()?.count();
        return Err(GitError::MergeConflict { count });
    }
    let result_tree = repo.find_tree(idx.write_tree_to(repo)?)?;
    let sig = repo.signature()?;
    let local_commit = repo.find_commit(local.id())?;
    let remote_commit = repo.find_commit(remote.id())?;
    let msg = format!("Merge commit {}", remote.id());
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &msg,
        &result_tree,
        &[&local_commit, &remote_commit],
    )?;
    repo.checkout_head(None)?;
    Ok(())
}

fn delta_file_status(d: git2::Delta) -> FileStatus {
    match d {
        git2::Delta::Added => FileStatus::Added,
        git2::Delta::Deleted => FileStatus::Deleted,
        git2::Delta::Renamed => FileStatus::Renamed,
        git2::Delta::Copied => FileStatus::Added,
        git2::Delta::Untracked => FileStatus::Untracked,
        git2::Delta::Modified | git2::Delta::Typechange => FileStatus::Modified,
        _ => FileStatus::Modified,
    }
}

fn parse_diff_to_model(diff: &git2::Diff) -> Result<Vec<FileDiff>, GitError> {
    use crate::model::{DiffHunk as HunkModel, DiffLine as LineModel};

    let files: RefCell<Vec<FileDiff>> = RefCell::new(Vec::new());
    let cur_file: RefCell<Option<FileDiff>> = RefCell::new(None);
    let cur_hunk: RefCell<Option<HunkModel>> = RefCell::new(None);

    diff.foreach(
        &mut |delta, _progress| {
            if let Some(mut f) = cur_file.borrow_mut().take() {
                if let Some(h) = cur_hunk.borrow_mut().take() {
                    f.hunks.push(h);
                }
                files.borrow_mut().push(f);
            }
            let new_path = delta
                .new_file()
                .path()
                .unwrap_or_else(|| Path::new(""))
                .to_path_buf();
            let old_path = delta.old_file().path().and_then(|p| {
                let np = delta.new_file().path().unwrap_or(p);
                if p != np {
                    Some(p.to_path_buf())
                } else {
                    None
                }
            });
            *cur_file.borrow_mut() = Some(FileDiff {
                path: new_path,
                old_path,
                status: delta_file_status(delta.status()),
                hunks: Vec::new(),
                is_binary: delta.flags().contains(DiffFlags::BINARY),
            });
            true
        },
        Some(&mut |_delta, _binary| true),
        Some(&mut |_delta, hunk| {
            if let Some(f) = cur_file.borrow_mut().as_mut() {
                if let Some(h) = cur_hunk.borrow_mut().take() {
                    f.hunks.push(h);
                }
                let header = String::from_utf8_lossy(hunk.header()).to_string();
                *cur_hunk.borrow_mut() = Some(HunkModel {
                    old_range: (hunk.old_start() as usize, hunk.old_lines() as usize),
                    new_range: (hunk.new_start() as usize, hunk.new_lines() as usize),
                    header,
                    lines: Vec::new(),
                });
            }
            true
        }),
        Some(&mut |_delta, _hunk_opt, line| {
            if let (Some(_f), Some(h)) = (
                cur_file.borrow_mut().as_mut(),
                cur_hunk.borrow_mut().as_mut(),
            ) {
                let t = line.origin_value();
                if matches!(
                    t,
                    DiffLineType::Addition
                        | DiffLineType::Deletion
                        | DiffLineType::Context
                        | DiffLineType::ContextEOFNL
                        | DiffLineType::AddEOFNL
                        | DiffLineType::DeleteEOFNL
                ) {
                    let content = String::from_utf8_lossy(line.content())
                        .trim_end_matches('\n')
                        .to_string();
                    h.lines.push(LineModel {
                        prefix: line.origin(),
                        content,
                        old_line: line.old_lineno().map(|l| l as usize),
                        new_line: line.new_lineno().map(|l| l as usize),
                    });
                }
            }
            true
        }),
    )?;

    if let Some(mut f) = cur_file.into_inner() {
        if let Some(h) = cur_hunk.into_inner() {
            f.hunks.push(h);
        }
        files.borrow_mut().push(f);
    }

    Ok(files.into_inner())
}
