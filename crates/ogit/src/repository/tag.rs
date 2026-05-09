//! 标签管理 —— Tag management
//!
//! 实现标签的 CRUD 操作：列表、创建、删除。
//! 支持两种标签类型：
//! - 轻量标签（lightweight）：仅一个引用指针，无额外信息
//! - 注释标签（annotated）：包含标签消息和签名，作为独立对象存储
//!
//! Implements tag CRUD: list, create (lightweight & annotated), delete.

use crate::model::Tag;
use crate::operations::{GitError, GitOps};
use crate::repository::Repository;

impl GitOps for Repository {
    /// 获取所有标签 —— Get all tags
    fn get_tags(&self) -> Result<Vec<Tag>, GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        let mut tags = Vec::new();
        for tag_name in repo.tag_names(None)?.iter().flatten() {
            // 使用 revparse 解析标签名到 OID —— Resolve tag name to OID
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

    /// 创建标签 —— Create a tag
    ///
    /// 如果提供了 `message`，创建注释标签（annotated tag）；
    /// 否则创建轻量标签（lightweight tag）。
    ///
    /// If `message` is provided, creates an annotated tag; otherwise a lightweight tag.
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
            // 创建注释标签 —— Create annotated tag
            let sig = repo.signature()?;
            repo.tag(
                name,
                &repo.find_object(target_oid, None)?,
                &sig,
                message,
                false,
            )?;
        } else {
            // 创建轻量标签：直接在 refs/tags/ 下创建引用 —— Create lightweight tag: reference under refs/tags/
            repo.reference(&format!("refs/tags/{}", name), target_oid, false, "tag")?;
        }

        Ok(Tag {
            name: name.to_string(),
            target: target_oid.to_string(),
            message: message.map(|s| s.to_string()),
            tagger: None,
        })
    }

    /// 删除标签 —— Delete a tag
    fn delete_tag(&self, name: &str) -> Result<(), GitError> {
        let repo = self
            .repo
            .lock()
            .map_err(|_| GitError::ReadError("Failed to lock repository".to_string()))?;

        repo.tag_delete(name)?;
        Ok(())
    }
}
