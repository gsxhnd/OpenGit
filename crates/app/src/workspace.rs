//! 工作空间 —— Workspace
//!
//! 管理多个项目的容器，支持项目添加、移除和切换。
//! 预留用于未来同时打开多个 Git 仓库。
//!
//! Multi-project container with add/remove/switch. Reserved for multi-repo support.

use crate::project::Project;

/// 工作空间（管理多个项目） —— Workspace managing multiple projects
#[allow(dead_code)]
#[derive(Default)]
pub struct Workspace {
    pub active_project: Option<usize>,
    pub projects: Vec<Project>,
}

#[allow(dead_code)]
impl Workspace {
    pub fn add_project(&mut self, project: Project) {
        if self.active_project.is_none() {
            self.active_project = Some(0);
        }
        self.projects.push(project);
    }

    pub fn remove_project(&mut self, index: usize) {
        if index < self.projects.len() {
            self.projects.remove(index);
            if let Some(active) = self.active_project
                && active >= self.projects.len()
            {
                self.active_project = if self.projects.is_empty() {
                    None
                } else {
                    Some(self.projects.len() - 1)
                };
            }
        }
    }

    pub fn active(&self) -> Option<&Project> {
        self.active_project.and_then(|idx| self.projects.get(idx))
    }

    pub fn active_mut(&mut self) -> Option<&mut Project> {
        let idx = self.active_project?;
        self.projects.get_mut(idx)
    }

    pub fn switch_to(&mut self, index: usize) {
        if index < self.projects.len() {
            self.active_project = Some(index);
        }
    }
}
