# 5. 目录结构

```
OpenRemote/
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
    │   └── settings.ts           # 设置持久化 (JSON 读写、损坏恢复、主题发现)
    │   # 规划中：远程协议适配（SSH/SFTP 等）可拆分为独立模块并在此注册
    │
    ├── preload/                  # 预加载脚本 (contextBridge)
    │   └── index.ts              # window.api 类型化 API 暴露
    │
    ├── renderer/                 # React UI (渲染进程)
    │   ├── main.tsx              # ReactDOM 入口
    │   ├── App.tsx               # 根组件：布局与路由
    │   ├── routes.tsx            # 路由表
    │   ├── index.html
    │   ├── assets/
    │   │   └── index.css         # Tailwind + 主题 CSS 变量
    │   ├── components/
    │   │   ├── TitleBar.tsx
    │   │   ├── ToastContainer.tsx
    │   │   └── ui/               # shadcn/ui 风格基础组件
    │   ├── views/                # 功能视图（随里程碑增减）
    │   ├── store/
    │   │   └── index.ts          # Zustand Store
    │   ├── hooks/                # 主题、快捷键等
    │   ├── i18n/                 # 国际化资源
    │   ├── lib/
    │   │   └── utils.ts
    │   ├── css.d.ts
    │   └── env.d.ts              # Window.api 类型声明
    │
    └── shared/                   # 主进程与渲染进程共享
        ├── types.ts              # 跨进程类型定义
        └── ipc.ts                # IPC 通道名称常量
```
