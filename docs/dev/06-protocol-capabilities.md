# 6. 协议能力

## 6.1 SSH

SSH 是远程终端和 SFTP 的核心基础。

### 首要能力

- 快速连接和已保存主机连接
- 密码和私钥认证（PEM/OpenSSH 格式）
- 主机指纹识别与信任存储
- Shell 通道连接到 xterm.js
- 断开、重连、错误提示和会话清理

### 后续能力

- SSH Agent 转发
- Keyboard-interactive 认证
- 证书认证
- 本地端口转发（-L）
- 远程端口转发（-R）
- 动态转发 / SOCKS5 代理（-D）
- 转发规则持久化与状态监控
- 会话日志和命令片段

### 技术实现

- 主进程使用 `ssh2` 库建立连接
- Shell 通道字节流经 IPC 双向转发到渲染进程 xterm.js
- 连接实例由主进程管理生命周期，渲染进程通过 `window.api.ssh.*` 操作

## 6.2 本地终端

本地终端用于在 Puck 内执行本机 Shell，与 SSH 终端共享视觉和交互体验。

| 平台 | Shell 支持 |
|------|------------|
| macOS | 默认登录 Shell（`zsh`、`bash`） |
| Linux | 默认 Shell（`bash`、`zsh`、`fish`） |
| Windows | `cmd`、`PowerShell`、`WSL` |

### 技术实现

- 主进程使用 `node-pty` 创建 PTY 实例
- 渲染进程仅负责 xterm.js 输入输出展示
- PTY 字节流经 IPC 通道 `pty:*` 转发
- 终端设置：字体、字号、滚动缓冲区、光标样式、主题跟随

## 6.3 FTP/SFTP

FTP/SFTP 提供文件管理核心能力。

### 基础能力

- 目录浏览、路径跳转、上级目录
- 上传、下载、覆盖确认
- 新建文件夹、重命名、删除、属性查看
- 传输队列、进度反馈、失败原因
- 文本文件远程打开、编辑、保存

### 高级能力

- 本地/远程双栏对比
- 断点续传（协议能力允许时）
- 并发传输上限配置
- 权限显示与修改

### 技术实现

- SFTP 基于 `ssh2` 的 SFTP 子系统
- FTP 可在统一 `RemoteFileProvider` 抽象稳定后接入
- 大目录采用分页或惰性加载，避免阻塞 UI
- 传输进度通过事件推送（`webContents.send`）实时反馈

## 6.4 远程文本编辑

### 能力

- 使用 Monaco Editor 打开远程文本文件
- 语法高亮、多光标、主题对齐
- 保存时经 IPC 写回远端
- 大文件采用分块读取、防抖保存

### 适用协议

- SFTP（当前）
- FTP、WebDAV、S3（远期，通过 RemoteFileProvider 统一接入）

## 6.5 远程资源监控

### 能力

- SSH 会话内实时展示远程服务器指标
- CPU 使用率、内存占用、磁盘使用率
- 通过 SSH 执行命令采集数据（如 `top`、`free`、`df`）

### 技术实现

- 主进程在 SSH 连接上定期执行采集命令
- 解析输出并通过事件推送到渲染进程
- 渲染进程在监控面板中可视化展示

## 6.6 WebDAV（远期）

WebDAV 复用文件管理 UI，协议层关注：

- Basic/Digest/Token 等认证方式
- `PROPFIND` 目录列表
- `GET`/`PUT` 上传下载
- `MOVE`/`DELETE` 文件操作
- ETag/Last-Modified 用于变更判断

## 6.7 S3 兼容存储（远期）

面向 MinIO、Cloudflare R2、AWS S3 等对象存储。核心差异：

- 没有真实目录，使用 Prefix 模拟目录树
- 重命名通常是复制对象后删除旧对象
- 文本编辑只适合小对象，大对象走下载/上传流程
- 同步判断依赖 ETag、Size、LastModified

## 6.8 VNC/RDP（远期）

远程桌面能力，独立于终端/文件面板实现：

- 连接配置和认证
- 会话画布显示、缩放、适配窗口
- 键盘鼠标输入捕获与释放
- 连接状态、重连、断开
- 后续支持截图、剪贴板、全屏

## 6.9 Docker / Kubernetes（远期）

容器与集群管理能力：

- **Docker**：容器/镜像视图、日志、exec、启停（依赖 Docker CLI 或 API）
- **Kubernetes**：多集群/上下文、命名空间与 Workload 浏览、Pod 日志、端口转发（以 `kubectl` 兼容工作流为主）

具体范围随里程碑定义，复用连接中心与会话模型。
