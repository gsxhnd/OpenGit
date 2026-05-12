# 8. 依赖说明

## 8.1 运行时依赖

```json
{
  "dependencies": {
    "@base-ui/react": "^1.4.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^1.14.0",
    "motion": "^12.0.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwind-merge": "^2.5.0",
    "zustand": "^5.0.0"
  }
}
```

| 依赖 | 用途 | 选型理由 |
|------|------|----------|
| **react / react-dom** | UI 框架 | React 19 生态成熟，组件化开发效率高 |
| **zustand** | 状态管理 | 轻量（~1KB），API 简洁，无需 Provider 包裹 |
| **motion** | 动画库 | Framer Motion v12，支持 AnimatePresence 实现视图切换和 Toast 动画 |
| **@base-ui/react** | 无头 UI 组件 | 提供 Dialog、Input、Select 等无障碍原语，与 shadcn/ui 模式集成 |
| **tailwind-merge** | CSS 类合并 | 智能合并 Tailwind 类名（如 `px-2 px-4` → `px-4`） |
| **clsx** | 条件类名 | 简洁的条件类名组合 |
| **class-variance-authority** | 组件变体 | 定义 Button、Dialog 等组件的 variant/size 变体 API |
| **lucide-react** | 图标库 | 开源图标集，React 组件形式 |

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
| **vitest** | 单元测试 | 测试 Git 输出解析 |
| **@testing-library/react** | 组件测试 | 测试 UI 行为 |
| **playwright** | E2E 测试 | 完整工作流测试 |
| **i18next** | 国际化 | 多语言支持 |
| **octokit** | GitHub API | 平台集成 |

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
