# 1. 项目概述

## 1.1 定位

**Puck** 是一个使用 Electron、React 和 TypeScript 构建的**跨平台客户端**。

- **核心方向**：多平台 **SSH** 与 **SFTP** 远程访问（终端、会话、远程文件管理）；终端 UI 规划采用 **xterm.js**，远程文本编辑规划采用 **Monaco Editor**（见 `docs/dev/02-tech-stack.md` §2.3）。
- **后续规划（路线顺序）**：在 WebDAV 之前优先推进 **Docker** 与 **Kubernetes（kubectl 生态）**；其后为 **WebDAV**，以及 **兼容 S3 API** 的云存储（如 MinIO、R2 等），与远程工作流统一在同一应用中完成。
- **当前实现**：以**应用壳与通用体验**（窗口、设置、主题、国际化、欢迎页等）为主；远程协议能力按 [09-roadmap.md](09-roadmap.md) 中 **Phase 2** 起逐步交付。

## 1.2 核心理念

| 理念 | 说明 |
|------|------|
| **远程优先** | 以 SSH/SFTP 为产品主线；Docker/K8s 运维向能力优先于 WebDAV，再扩展 WebDAV 与 S3 兼容存储 |
| **安全默认** | 凭据与通道安全优先；避免不安全 shell 拼接与过度权限 |
| **即时反馈** | 传输进度、会话输出与错误信息对用户可见、可诊断 |
| **现代化 UI** | React 19 + Tailwind CSS 4 + Motion 动画，深色主题默认 |
| **跨平台** | 支持 Linux (DEB/RPM)、macOS (DMG/ZIP)、Windows (Squirrel) |
| **进程隔离** | Electron contextBridge 隔离主进程与渲染进程 |

## 1.3 目标用户

- 需要通过 **SSH/SFTP** 管理服务器与远程文件的开发者与运维人员
- 希望后续在同一应用中接入 **Docker / Kubernetes**、**WebDAV**、**S3 兼容存储** 的团队

## 1.4 当前状态

工程基础（Phase 0）与应用壳（Phase 1）持续完善中。**SSH/SFTP/Monaco**（Phase 2）、**打包与发布**（Phase 3）、**Docker / Kubernetes**（优先于 WebDAV，Phase 4–6）在路线图中推进；内置终端、命令面板等按计划迭代。
