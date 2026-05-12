# 5. 目录结构

```
OpenGit/
├── package.json                  # NPM 包定义，scripts，依赖
├── package-lock.json
├── tsconfig.json                 # 基础 TS 配置
├── tsconfig.main.json            # 主进程 TS 配置
├── tsconfig.preload.json         # 预加载脚本 TS 配置
├── tsconfig.renderer.json        # 渲染进程 TS 配置
├── vite.main.config.ts           # 主进程 Vite 配置
├── vite.preload.config.ts        # 预加载 Vite 配置
├── vite.renderer.config.ts       # 渲染进程 Vite 配置
├── forge.config.ts               # Electron Forge 打包配置
├── components.json               # shadcn/ui 配置 (base-nova 风格)
├── LICENSE                       # MIT License
├── README.md                     # 项目说明
├── .gitignore
│
├── docs/
│   ├── dev/                      # 开发文档 (本文档)
│   │   └── README.md
│   └── wiki/                     # 用户文档 (计划)
│
├── scripts/
│   ├── dev.mjs                   # 开发启动脚本 (构建 main/preload → Vite dev server → Electron)
│   └── start.mjs                 # 生产启动脚本 (直接运行 dist/ 构建产物)
│
├── .agents/                      # AI Agent 技能参考
│   └── skills/
│       └── shadcn/               # shadcn/ui 组件技能
│
├── .kilo/                        # Kilo agent 配置
│   ├── agent-manager.json
│   └── package.json
│
├── dist/                         # 构建输出 (Vite compile → Electron Forge package)
│
└── src/
    ├── main/                     # Electron 主进程
    │   ├── index.ts              # 应用入口：窗口创建、生命周期、IPC 注册
    │   ├── git-handlers.ts       # Git IPC 处理程序 (~710 行)
    │   │                         #   - parseStatus: git status --porcelain
    │   │                         #   - parseHistory: git log (分页，自定义分隔符)
    │   │                         #   - parseDiff: git diff / git show
    │   │                         #   - parseBranches: git branch -a -vv
    │   │                         #   - parseRemotes: git remote -v
    │   │                         #   - parseTags: git tag -l
    │   │                         #   - parseStash: git stash list
    │   │                         #   - parseGraph: git log --all (DAG 拓扑)
    │   │                         #   - parseBlame: git blame --porcelain
    │   │                         #   - parseReflog: git reflog
    │   │                         #   - parseSearch: git ls-files + git grep
    │   │                         #   - 以及 stage/unstage/commit/push/pull/merge 等操作
    │   ├── settings.ts           # 设置持久化 (JSON 文件读写，损坏恢复)
    │   └── file-watcher.ts       # 文件监听 (fs.watch recursive，500ms 防抖)
    │
    ├── preload/                  # 预加载脚本 (contextBridge)
    │   └── index.ts              # window.api 类型化 API 暴露 (~110 行)
    │
    ├── renderer/                 # React UI (渲染进程)
    │   ├── main.tsx              # ReactDOM 入口
    │   ├── App.tsx               # 根组件：布局 + 视图路由 + onRepoChanged 订阅
    │   ├── index.html            # HTML 外壳
    │   ├── assets/
    │   │   └── index.css         # Tailwind 导入 + 主题 CSS 变量 (Tokyo Night)
    │   ├── components/
    │   │   ├── TitleBar.tsx      # 自定义标题栏 (macOS traffic light + 功能按钮)
    │   │   ├── StatusBar.tsx     # 底部状态栏 (分支/领先落后/变更数)
    │   │   ├── Sidebar.tsx       # 左侧导航 (8 入口 + Motion 动画指示器)
    │   │   ├── ToastContainer.tsx # Toast 通知 (AnimatePresence，5 条上限)
    │   │   └── ui/               # shadcn/ui 风格基础组件
    │   │       ├── button.tsx    # Button (base-nova 变体)
    │   │       ├── dialog.tsx    # Dialog (Base UI 弹窗)
    │   │       ├── input.tsx     # Input (Base UI 输入框)
    │   │       └── select.tsx    # Select (Base UI 下拉)
    │   ├── views/                # 13 个功能视图
    │   │   ├── WelcomeView.tsx   # 欢迎页/无仓库引导
    │   │   ├── CommitView.tsx    # 暂存区 + 提交信息输入
    │   │   ├── HistoryView.tsx   # Commit 历史列表 + 筛选
    │   │   ├── BranchesView.tsx  # 分支管理
    │   │   ├── DiffView.tsx      # 文件 Diff 查看
    │   │   ├── StashView.tsx     # Stash 管理
    │   │   ├── TagsView.tsx      # Tag 管理
    │   │   ├── GraphView.tsx     # Commit 图可视化 (SVG)
    │   │   ├── CommitDetailView.tsx  # Commit 详情 + Diff
    │   │   ├── FileSearchView.tsx    # 文件搜索 + Blame/历史
    │   │   ├── FileHistoryView.tsx   # 单文件历史
    │   │   ├── BlameView.tsx         # Blame 视图
    │   │   └── ReflogView.tsx        # Reflog 查看
    │   ├── store/
    │   │   └── index.ts          # Zustand Store (~700 行) — 全局状态 + 50+ Actions
    │   ├── lib/
    │   │   └── utils.ts          # cn() 工具 (clsx + tailwind-merge)
    │   ├── css.d.ts              # CSS 模块类型声明
    │   └── env.d.ts              # Window.api 类型声明
    │
    └── shared/                   # 主进程和渲染进程共享
        ├── types.ts              # 全部 TS 接口定义 (~190 行)
        │                         #   Commit, Branch, Remote, Tag, Stash, DiffLine,
        │                         #   DiffHunk, FileDiff, GraphRow, BlameLine,
        │                         #   ReflogEntry, AppSettings, Toast, ViewType, ...
        └── ipc.ts                # IPC 通道名称常量 (~80 行)
                                  #   REPO_OPEN, GIT_STAGE_FILES, GIT_COMMIT, ...
```
