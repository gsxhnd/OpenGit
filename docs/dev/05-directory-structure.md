# 5. 目录结构

```
OpenGit/
├── Cargo.toml                    # 项目配置与依赖
├── Cargo.lock
├── LICENSE                       # MIT License
├── README.md
├── .gitignore
│
├── docs/
│   ├── dev/                      # 开发文档 (本文档)
│   │   └── README.md
│   └── wiki/                     # 用户文档
│
├── themes/                       # 主题 JSON 配置文件
│   ├── ayu.json
│   ├── catppuccin.json
│   ├── gruvbox.json
│   ├── tokyonight.json
│   └── ...
│
├── locales/                      # 国际化翻译文件
│   ├── zh-CN.json
│   └── en.json
│
├── assets/                       # 静态资源
│   └── icons/                    # 应用图标
│
├── .agents/                      # AI Agent 技能参考
│   └── skills/
│       ├── gpui-action/
│       ├── gpui-async/
│       ├── gpui-context/
│       ├── gpui-element/
│       ├── gpui-entity/
│       ├── gpui-event/
│       ├── gpui-focus-handle/
│       ├── gpui-global/
│       ├── gpui-layout-and-style/
│       ├── gpui-new-component/
│       ├── gpui-style-guide/
│       └── gpui-test/
│
└── src/
    ├── main.rs                   # 应用入口
    ├── app.rs                    # 应用初始化、窗口管理、全局状态
    │
    ├── workspace/                # 工作区 (多项目管理)
    │   ├── mod.rs                # Workspace Entity 定义
    │   ├── project.rs            # 单项目状态 Entity
    │   ├── project_list.rs       # 侧边栏项目列表组件
    │   ├── project_group.rs      # 项目分组管理
    │   └── tab_bar.rs            # Tab 栏组件
    │
    ├── git/                      # Git 操作层
    │   ├── mod.rs                # GitOps trait 定义、后端枚举、模块导出
    │   ├── repository.rs         # Repository 抽象 (根据用户配置委派到 git2 或 cmd)
    │   ├── git2_backend.rs       # git2-rs 后端实现
    │   ├── cmd_backend.rs        # 系统 git 命令后端实现
    │   ├── operations.rs         # 高层 Git 操作 (commit, push, pull, merge ...)
    │   ├── diff.rs               # Diff 解析与数据模型
    │   ├── graph.rs              # Commit graph 构建 (DAG 拓扑计算)
    │   ├── blame.rs              # Blame 解析
    │   ├── search.rs             # Commit / 文件搜索
    │   ├── hooks.rs              # Git Hooks 管理
    │   ├── submodule.rs          # Submodule 操作
    │   ├── worktree.rs           # Worktree 操作
    │   ├── lfs.rs                # LFS 操作
    │   ├── sign.rs               # Commit 签名 (GPG / SSH)
    │   ├── stash.rs              # Stash 操作
    │   ├── tag.rs                # Tag 操作
    │   ├── remote.rs             # Remote 操作
    │   └── model.rs              # Git 数据模型 (Commit, Branch, Remote, Stash ...)
    │
    ├── views/                    # 功能视图 (GPUI Render 组件)
    │   ├── mod.rs
    │   ├── welcome.rs            # 欢迎页 / 无项目时的引导
    │   ├── commit.rs             # Commit 视图 (staging area + message 输入)
    │   ├── history.rs            # Commit 历史列表
    │   ├── graph.rs              # Git Graph 可视化视图
    │   ├── diff.rs               # Diff 视图 (inline + side-by-side)
    │   ├── blame.rs              # Blame 视图
    │   ├── branches.rs           # 分支管理视图
    │   ├── remotes.rs            # Remote 管理视图
    │   ├── stash.rs              # Stash 管理视图
    │   ├── tags.rs               # Tag 管理视图
    │   ├── conflict.rs           # 冲突解决视图
    │   ├── search.rs             # 搜索视图
    │   ├── settings.rs           # 设置面板
    │   ├── hooks.rs              # Hooks 管理视图
    │   ├── submodule.rs          # Submodule 管理视图
    │   └── worktree.rs           # Worktree 管理视图
    │
    ├── ui/                       # 自定义 UI 组件
    │   ├── mod.rs
    │   ├── file_tree.rs          # 文件树组件 (带 Git 状态图标)
    │   ├── diff_editor.rs        # Diff 编辑器组件 (语法高亮 + hunk 操作)
    │   ├── graph_canvas.rs       # Git Graph 画布 (自定义 Element)
    │   ├── status_bar.rs         # 底部状态栏
    │   ├── command_palette.rs    # 命令面板
    │   ├── sidebar.rs            # 侧边栏容器
    │   ├── split_panel.rs        # 分割面板 (可拖拽调整大小)
    │   ├── toolbar.rs            # 工具栏
    │   └── notification.rs       # 通知 Toast 组件
    │
    ├── platform/                 # 远程平台集成
    │   ├── mod.rs                # PlatformClient trait 定义
    │   ├── github.rs             # GitHub API (REST + GraphQL)
    │   ├── gitlab.rs             # GitLab API
    │   ├── gitea.rs              # Gitea API
    │   └── auth.rs               # OAuth / Token 认证管理
    │
    ├── terminal/                 # 内置终端
    │   ├── mod.rs                # Terminal Entity
    │   ├── pty.rs                # PTY 进程管理
    │   └── view.rs               # 终端渲染视图
    │
    ├── ai/                       # AI 功能
    │   ├── mod.rs                # AiProvider trait 定义
    │   ├── commit_message.rs     # Commit message 生成逻辑
    │   ├── openai.rs             # OpenAI Provider
    │   ├── claude.rs             # Claude Provider
    │   └── ollama.rs             # Ollama (本地模型) Provider
    │
    ├── i18n/                     # 国际化
    │   ├── mod.rs                # t!() 宏定义、Locale 管理
    │   └── loader.rs             # 翻译文件加载
    │
    └── settings/                 # 配置管理
        ├── mod.rs                # AppSettings 定义
        ├── keymap.rs             # 快捷键绑定配置
        └── persistence.rs        # 配置持久化 (JSON 文件读写)
```
