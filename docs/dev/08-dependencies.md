# 8. 依赖说明

## 8.1 运行时依赖

```json
{
  "dependencies": {
    "@base-ui/react": "^1.4.1",
    "@xterm/xterm": "^6.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "i18next": "^26.1.0",
    "lucide-react": "^1.14.0",
    "monaco-editor": "^0.55.1",
    "motion": "^12.0.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-i18next": "^17.0.7",
    "react-router": "^7.15.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.3.0",
    "zustand": "^5.0.0"
  }
}
```

（摘录自 `package.json`；版本随仓库更新。）

| 依赖 | 用途 | 选型理由 |
|------|------|----------|
| **react / react-dom** | UI 框架 | React 19 生态成熟，组件化开发效率高 |
| **zustand** | 状态管理 | 轻量（~1KB），API 简洁，无需 Provider 包裹 |
| **motion** | 动画库 | Framer Motion v12，支持 AnimatePresence 实现视图切换和 Toast 动画 |
| **@base-ui/react** | 无头 UI 组件 | 提供 Dialog、Input、Select 等无障碍原语，与 shadcn/ui 模式集成 |
| **@xterm/xterm** | 终端模拟器 | SSH/PTY 会话的终端 UI 标准选型，可扩展 addon（fit、webgl 等） |
| **monaco-editor** | 代码编辑器 | 远程文本/配置文件编辑：语法高亮、主题、多光标与 VS Code 同源编辑体验 |
| **i18next / react-i18next** | 国际化 | 运行时切换语言 |
| **react-router** | 路由 | 视图级路由与 Hash 模式桌面分发 |
| **tailwindcss** | 样式系统 | Tailwind CSS v4（`@tailwindcss/vite`） |
| **tailwind-merge** | CSS 类合并 | 智能合并 Tailwind 类名（如 `px-2 px-4` → `px-4`） |
| **clsx** | 条件类名 | 简洁的条件类名组合 |
| **class-variance-authority** | 组件变体 | 定义 Button、Dialog 等组件的 variant/size 变体 API |
| **sonner** | Toast 通知 | 与现有 UI 栈集成 |
| **next-themes** | 主题切换辅助 | 与 CSS 变量 / 深色模式协同（若采用） |

## 8.2 开发依赖

```json
{
  "devDependencies": {
    "@electron-forge/cli": "^7.6.0",
    "@electron-forge/maker-deb": "^7.6.0",
    "@electron-forge/maker-dmg": "^7.6.0",
    "@electron-forge/maker-rpm": "^7.6.0",
    "@electron-forge/maker-squirrel": "^7.6.0",
    "@electron-forge/maker-zip": "^7.6.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^25.7.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "electron": "^42.0.1",
    "typescript": "^6.0.3",
    "vite": "^8.0.12"
  }
}
```

| 依赖 | 用途 |
|------|------|
| **electron** | 桌面运行时 (v42) |
| **typescript** | 类型系统 (v6) |
| **vite** | 构建工具，分别构建 main / preload / renderer |
| **@vitejs/plugin-react** | React JSX/TSX Vite 插件 |
| **@tailwindcss/vite** | Tailwind CSS 4 Vite 插件 (CSS-first 配置) |
| **@electron-forge/cli** | Electron 打包工具 |
| **@electron-forge/maker-*** | 平台打包器：ZIP (macOS)、DMG (macOS)、DEB (Linux)、RPM (Linux)、Squirrel (Windows) |
| **@types/node** | Node.js 类型定义 |
| **@types/react** | React 类型定义 |
| **@types/react-dom** | ReactDOM 类型定义 |

## 8.3 未引入但可能需要的依赖

| 依赖 | 用途 | 适用场景 |
|------|------|----------|
| **vitest** | 单元测试 | 测试纯函数与协议解析逻辑 |
| **@testing-library/react** | 组件测试 | 测试 UI 行为 |
| **playwright** | E2E 测试 | 完整工作流测试 |
| **node-pty**（或等价） | 主进程 PTY | 与 xterm 配合实现本地/SSH 终端（需按平台评估原生模块打包） |

## 8.4 构建配置

### Vite 三目标构建

```
vite.main.config.ts     → dist/main/index.js     (CJS, Node externals)
vite.preload.config.ts  → dist/preload/index.js  (CJS, Node externals)
vite.renderer.config.ts → dist/renderer/*        (ESM, React + Tailwind)
```

### Electron Forge 打包

```
npm run build → Vite 构建 → Electron Forge package/make
                              ├── macOS: ZIP + DMG (ULFO)
                              ├── Windows: Squirrel
                              └── Linux: DEB + RPM
```
