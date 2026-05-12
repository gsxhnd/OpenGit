//! 提交图拓扑构建 —— Commit graph topology construction
//!
//! 实现提交历史的有向无环图（DAG）可视化布局算法。
//! 算法类似于 `git log --graph`：按时间倒序遍历提交，
//! 为每个分支分配轨道（column），合并提交时合并轨道。
//!
//! Implements DAG visualization layout similar to `git log --graph`.

use std::collections::HashMap;

use crate::model::{GraphCell, GraphData, GraphRow};
use crate::operations::GitError;
use crate::repository::{Repository, git_commit_to_model};

impl Repository {
    /// 获取提交图数据 —— Get commit graph data with topology and markers
    ///
    /// ## 算法 —— Algorithm
    ///
    /// 1. 从 HEAD 开始反向遍历提交历史
    /// 2. 为每个分支分配唯一的轨道索引
    /// 3. 合并提交时，将多个父轨道的线汇聚
    /// 4. 为每个提交生成左侧图列（GraphCell 列表）
    /// 5. 标记分支头和标签所在行
    ///
    /// Walks from HEAD in reverse chronological order, assigns lanes,
    /// merges lanes at merge commits, and generates graph cells.
    pub(crate) fn __get_graph(&self, count: usize) -> Result<GraphData, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        // 收集每个提交哈希对应的分支标签 —— Collect branch labels per commit hash
        let mut hash_branch_labels: HashMap<String, Vec<String>> = HashMap::new();
        if let Ok(branches) = repo.branches(Some(git2::BranchType::Local)) {
            for (branch, _) in branches.flatten() {
                if let Ok(Some(name)) = branch.name()
                    && let Some(target) = branch.get().target()
                {
                    hash_branch_labels
                        .entry(target.to_string())
                        .or_default()
                        .push(name.to_string());
                }
            }
        }

        // 也查找 HEAD 引用 —— Also check HEAD ref
        if let Ok(head) = repo.head()
            && let Some(target) = head.target()
        {
            let name = if head.is_branch() {
                head.shorthand().unwrap_or("HEAD").to_string()
            } else {
                "HEAD (detached)".to_string()
            };
            let target_str = target.to_string();
            let entry = hash_branch_labels.entry(target_str).or_default();
            if !entry.contains(&name) {
                entry.push(name);
            }
        }

        // 收集每个提交哈希对应的标签 —— Collect tag labels per commit hash
        let mut hash_tag_labels: HashMap<String, Vec<String>> = HashMap::new();
        if let Ok(tags) = repo.tag_names(None) {
            for name in tags.iter().flatten() {
                if let Ok(obj) = repo.revparse_single(name) {
                    let hash_str = obj.id().to_string();
                    hash_tag_labels
                        .entry(hash_str)
                        .or_default()
                        .push(name.to_string());
                }
            }
        }

        // 收集所有提交 — Collect all commits
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;

        let mut commits = Vec::new();
        for oid_result in revwalk {
            if commits.len() >= count {
                break;
            }
            let oid = oid_result?;
            let commit = match repo.find_commit(oid) {
                Ok(c) => c,
                Err(_) => continue,
            };
            commits.push(commit);
        }

        if commits.is_empty() {
            return Ok(GraphData { rows: Vec::new() });
        }

        // 构建图布局 —— Build graph layout
        let rows = build_graph_layout(&commits, &hash_branch_labels, &hash_tag_labels);

        Ok(GraphData { rows })
    }
}

/// 图布局算法 —— Graph layout algorithm
///
/// 使用轨道（lane）模型：
/// - 每个活跃分支占用一个轨道
/// - 新分支创建时分配新轨道
/// - 合并提交时释放父轨道
/// - 轨道间画垂直线（│）保持视觉连续
///
/// Uses lane model: each active branch occupies a lane,
/// new branches get new lanes, merges free parent lanes.
fn build_graph_layout(
    commits: &[git2::Commit],
    branch_labels: &HashMap<String, Vec<String>>,
    tag_labels: &HashMap<String, Vec<String>>,
) -> Vec<GraphRow> {
    let mut rows = Vec::new();
    let mut active_lanes: Vec<String> = Vec::new(); // Track occupied lanes by commit hash

    for commit in commits {
        let hash = commit.id().to_string();
        let parent_ids: Vec<String> = commit.parent_ids().map(|id| id.to_string()).collect();

        // Build cells for each active lane
        let mut cells = Vec::new();

        // Find the position of this commit in active lanes
        let commit_lane = active_lanes.iter().position(|h| h == &hash);

        for (lane_hash_cell, lane_hash) in active_lanes.iter().enumerate() {
            if Some(lane_hash_cell) == commit_lane {
                // This is where the commit's dot goes
                cells.push(GraphCell::Dot);
            } else if parent_ids.contains(lane_hash) {
                // This active lane reaches into this commit (parent being consumed by merge)
                cells.push(GraphCell::Merge);
            } else {
                // Independent lane - just a pipe continuing through
                cells.push(GraphCell::Pipe);
            }
        }

        // If this commit is not in active lanes, add a new lane
        if commit_lane.is_none() {
            if cells.is_empty() {
                // First commit ever
                cells.push(GraphCell::Dot);
            } else {
                // New branch fork - add a fork cell before the dot
                cells.push(GraphCell::Fork);
                cells.push(GraphCell::Dot);
            }
        }

        // Update active lanes: remove parents that are consumed, add this commit
        let mut new_active: Vec<String> = Vec::new();
        new_active.push(hash.clone());

        // Keep lanes that are NOT parents of this commit (still active for later)
        for lane_hash in &active_lanes {
            if !parent_ids.contains(lane_hash) && *lane_hash != hash {
                new_active.push(lane_hash.clone());
            }
        }
        active_lanes = new_active;

        // Get branch and tag labels for this commit
        let hash_str = commit.id().to_string();
        let br_labels = branch_labels.get(&hash_str).cloned().unwrap_or_default();
        let tg_labels = tag_labels.get(&hash_str).cloned().unwrap_or_default();

        let model_commit = git_commit_to_model(commit.clone());

        rows.push(GraphRow {
            cells,
            commit: model_commit,
            branch_labels: br_labels,
            tag_labels: tg_labels,
        });
    }

    rows
}
