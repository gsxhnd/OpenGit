# 10. 构建与运行

## 10.1 开发环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | Electron 42 需要 |
| npm | 9+ | 包管理器 |

## 10.2 安装依赖

```bash
npm install
```

## 10.3 开发模式

```bash
# 启动开发服务器 (支持热更新)
npm run dev
```

开发流程（`scripts/dev.mjs`）：
1. Vite 构建 main 和 preload 进程 (CJS 输出到 `dist/`)
2. 启动 Vite dev server 用于 renderer (HMR 热更新)
3. 启动 Electron，加载 Vite dev server URL
4. 监听 main/preload 源码变更，自动重新构建并重启 Electron

## 10.4 构建命令

```bash
# 分别构建三个目标
npm run build:main      # Vite 构建主进程 → dist/main/
npm run build:preload   # Vite 构建预加载脚本 → dist/preload/
npm run build:renderer  # Vite 构建渲染进程 → dist/renderer/

# 完整构建
npm run build           # 依次执行以上三个构建
```

## 10.5 生产运行

```bash
# 从构建产物运行
npm run start

# 或直接
npx electron .
```

## 10.6 打包发布

```bash
# 构建并打包为安装包
npm run make

# 输出:
# out/make/zip/darwin/  — macOS ZIP
# out/make/dmg/darwin/  — macOS DMG
# out/make/squirrel/    — Windows installer
# out/make/deb/         — Linux DEB
# out/make/rpm/         — Linux RPM
```

## 10.7 代码质量

```bash
# TypeScript 类型检查
npm run typecheck       # tsc --noEmit

# ESLint 检查
npm run lint            # eslint . --ext .ts,.tsx
```

> **注**：当前项目尚未创建 ESLint 配置文件，`npm run lint` 暂不可用。计划在后续迭代中引入。

## 10.8 调试

```bash
# Electron 设置环境变量启用 devtools:
# 在 main/index.ts 中已设置自动打开 devtools (开发模式)

# 查看主进程日志:
# 控制台输出直接打印到终端

# 查看渲染进程日志:
# DevTools Console (开发模式自动打开)
```
