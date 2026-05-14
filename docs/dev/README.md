# Puck 开发文档

> 跨平台远程工作台 — Electron + React + TypeScript。聚焦 SSH 远程访问、本地终端、FTP/SFTP 文件传输、远程文本编辑与资源监控；远期规划 WebDAV/S3 存储、VNC/RDP 远程桌面、Docker/Kubernetes 运维。

## 文档索引

| 编号 | 文档 | 说明 |
|------|------|------|
| 01 | [产品范围](01-product-scope.md) | 产品定位、目标用户、能力边界、当前状态 |
| 02 | [技术栈](02-tech-stack.md) | 核心技术、版本、框架特性 |
| 03 | [功能地图](03-feature-map.md) | 功能域、能力清单与优先级 |
| 04 | [系统架构](04-architecture.md) | 三进程模型、IPC、协议适配、状态管理、安全 |
| 05 | [信息架构](05-information-architecture.md) | 工作台 UI 结构、导航、会话模型、实施计划 |
| 06 | [协议能力](06-protocol-capabilities.md) | SSH、终端、FTP/SFTP、WebDAV/S3、VNC/RDP、Docker/K8s |
| 07 | [开发规范](07-development-standards.md) | 代码风格、命名、组件模式、IPC 流程、安全编码 |
| 08 | [路线图](08-roadmap.md) | 阶段性交付计划与验收标准 |

## 开发命令

```bash
npm install          # 安装依赖
npm run dev          # 开发模式（Vite dev server + Electron 热启动）
npm run typecheck    # TypeScript 类型检查（覆盖全部进程）
npm run build        # 生产构建（main → preload → renderer）
npm run make         # 构建 + Electron Forge 打包
```
