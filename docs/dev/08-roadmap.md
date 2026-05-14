# 8. 路线图

## Phase 0：工作台骨架

**目标**：建立专业工作台 UI 框架，替代当前单页入口结构。

- 实现 Activity Bar、Primary Sidebar、Workbench Area、Status Bar
- 将现有欢迎页能力迁移为 Dashboard + Connections
- 抽象通用 `SessionTab` 和面板容器
- 保持现有 SSH、SFTP、本地终端能力可用

**验收标准**：
- 工作台骨架可运行，Activity Bar 切换功能域
- 现有功能在新布局中正常工作

---

## Phase 1：终端体验统一

**目标**：统一本地终端与 SSH 终端的 UI 和交互体验。

- 统一本地终端与 SSH 终端面板组件
- Windows 增加 `cmd`、`PowerShell`、`WSL` Shell 选择
- 增加终端设置（字体、字号、光标、滚动缓冲区）
- 会话状态管理、错误恢复、断开重连

**验收标准**：
- 本地和 SSH 终端视觉一致
- Windows 可选择不同 Shell 类型
- 终端设置生效

---

## Phase 2：文件工作区

**目标**：完善 SFTP 文件管理，建立统一文件能力模型。

- 重做文件面板为本地/远程双栏
- 实现传输队列、覆盖策略、进度反馈
- 将远程文本编辑升级为独立 Monaco 编辑器面板
- 增加远程资源监控面板（CPU/内存/磁盘）
- 建立 `RemoteFileProvider` 抽象接口

**验收标准**：
- 双栏文件浏览可用，支持上传下载
- 传输队列可见、可取消
- Monaco 编辑器可打开/保存远程文件
- 资源监控面板展示实时数据

---

## Phase 3：打包发布与稳定化

**目标**：完成跨平台打包，达到可发布状态。

- 完善凭据安全存储（系统钥匙串接入）
- 增加错误诊断和日志导出
- 完成 macOS（DMG/ZIP）、Windows（Squirrel）、Linux（DEB/RPM）打包验证
- 补充协议适配层单元测试
- 关键 UI 路径 E2E 测试

**验收标准**：
- 三平台可正常安装运行
- 凭据不以明文存储
- 核心路径有测试覆盖

---

## Phase 4：扩展文件协议（远期）

**目标**：将 FTP、WebDAV、S3 接入统一文件能力模型。

- FTP 协议实现 `RemoteFileProvider`
- WebDAV 协议实现（PROPFIND、GET/PUT、MOVE/DELETE）
- S3 兼容存储实现（Bucket + Prefix 目录模拟）
- 复用文件面板、传输队列、编辑器面板

---

## Phase 5：VNC/RDP 远程桌面（远期）

**目标**：接入远程桌面会话能力。

- VNC/RDP 连接配置与认证
- 远程桌面面板（画布、缩放、输入捕获）
- 将远程桌面会话纳入统一 Session 管理
- 断开重连、连接状态反馈

---

## Phase 6：Docker / Kubernetes（远期）

**目标**：接入容器与集群管理能力。

- Docker 容器/镜像视图、日志、exec、启停
- Kubernetes 多集群/上下文、Workload 浏览、Pod 日志
- 端口转发
- 复用连接中心与会话模型
