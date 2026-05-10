//! 提交消息编辑器 —— Commit message editor
//!
//! 管理提交消息文本、作者信息和 --amend 模式。
//! 未来将集成到提交流程中，替代当前 AppState 中直接管理的 amend 字段。
//!
//! Manages commit message text, author info, and --amend mode.
//! Will be integrated into commit flow in the future.

/// 提交消息编辑器状态 —— Commit message editor state
#[allow(dead_code)]
#[derive(Default)]
pub struct CommitEditor {
    pub message: String,
    pub author: Option<String>,
    pub is_amend: bool,
}

#[allow(dead_code)]
impl CommitEditor {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn reset(&mut self) {
        self.message.clear();
        self.author = None;
        self.is_amend = false;
    }

    pub fn set_message(&mut self, msg: String) {
        self.message = msg;
    }

    pub fn set_author(&mut self, author: String) {
        self.author = Some(author);
    }

    pub fn toggle_amend(&mut self) {
        self.is_amend = !self.is_amend;
    }

    pub fn is_valid(&self) -> bool {
        !self.message.trim().is_empty()
    }
}
