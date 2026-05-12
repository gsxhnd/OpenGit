# 7. 开发规范

## 7.1 代码风格

- **TypeScript strict mode** (`tsconfig.json` 中 `strict: true`)
- 使用 `tsc --noEmit` 进行类型检查（`npm run typecheck`）
- 代码行宽建议 100 字符
- 组件文件使用 PascalCase（`CommitView.tsx`）
- 工具文件使用 kebab-case（`git-handlers.ts`）
- 避免 `any` 类型，使用 `unknown` 或具体类型
- 导出接口函数时添加类型注解

## 7.2 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `CommitView`, `StatusBar`, `TitleBar` |
| 函数/方法 | camelCase | `stageFiles()`, `createBranch()` |
| 常量 | UPPER_SNAKE_CASE | `IPC_REPO_OPEN`, `PAGE_SIZE` |
| 接口 | PascalCase (无 I 前缀) | `Commit`, `Branch`, `AppSettings` |
| State 类型 | PascalCase 描述性名词 | `RepositoryStatus`, `FileEntry` |
| Props 类型 | 组件名 + Props | `CommitViewProps`, `StatusBarProps` |
| 文件 (组件) | PascalCase.tsx | `GraphView.tsx` |
| 文件 (工具) | kebab-case.ts | `git-handlers.ts`, `file-watcher.ts` |

## 7.3 组件开发规范

```typescript
// 1. 函数组件 + Props 接口
interface StatusBarProps {
  branch: string
  ahead: number
  behind: number
}

export function StatusBar({ branch, ahead, behind }: StatusBarProps) {
  return (
    <div className="flex items-center gap-2 h-6">
      {/* ... */}
    </div>
  )
}

// 2. 使用 Zustand Store
import { useStore } from '@/store'

export function CommitView() {
  const { stagedFiles, stageFiles } = useStore()
  // ...
}
```

**组件规范：**
- 每个组件一个文件，文件名即组件名
- 使用 `export function` 而非 `export default`（命名导入更一致）
- Props 通过接口定义，放在组件上方
- 使用 Tailwind 原子类，不写内联样式

## 7.4 状态管理规范

```typescript
// 1. 定义 Action（src/renderer/store/index.ts）
interface AppStore {
  // 状态
  repoPath: string | null
  stagedFiles: FileEntry[]

  // Action — 异步操作返回 Promise
  openRepo: (path: string) => Promise<void>
  stageFiles: (paths: string[]) => Promise<void>
  commit: (message: string) => Promise<void>
}
```

**Store 规范：**
- 所有状态和 Action 集中在单一 Zustand Store 中
- Action 命名：动词开头（`openRepo`、`stageFiles`、`refreshStatus`）
- 异步 Action 在 Store 内部调用 `window.api.xxx()` 并通过 `set()` 更新状态
- 不在组件中直接调用 `window.api`，通过 Store Action 中转

## 7.5 IPC 通信规范

```typescript
// 1. 定义 IPC 通道（src/shared/ipc.ts）
export const IPC = {
  REPO_OPEN: 'git:repo-open',
  GIT_STAGE_FILES: 'git:stage-files',
  GIT_COMMIT: 'git:commit',
  // ...
}

// 2. 主进程注册 Handler（src/main/git-handlers.ts → src/main/index.ts）
ipcMain.handle(IPC.REPO_OPEN, async (_, repoPath: string) => {
  return await handlers.openRepo(repoPath)
})

// 3. Preload 暴露 API（src/preload/index.ts）
contextBridge.exposeInMainWorld('api', {
  openRepo: (path: string) => ipcRenderer.invoke(IPC.REPO_OPEN, path),
  // ...
})

// 4. 渲染进程调用（通过 Store）
const result = await window.api.openRepo('/path/to/repo')
```

**IPC 规范：**
- 所有 IPC 通道名在 `src/shared/ipc.ts` 统一定义
- 使用 `:` 和 `-` 分隔命名空间（`git:repo-open`）
- 不通过 IPC 传递回调函数，使用 invoke 返回 Promise
- Preload 中不直接暴露 `ipcRenderer`，只暴露类型化方法

## 7.6 错误处理规范

```typescript
// 1. 主进程错误：返回统一格式
interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

// 2. 渲染进程错误：Toast 通知
function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  addToast({ message, kind: 'error' })
}

// 3. 配置损坏：自动备份并重置
// src/main/settings.ts — loadSettings()
// 损坏的 config.json → config.json.bak → 使用默认配置
```

## 7.7 异步操作规范

```typescript
// 主进程：child_process.execFile Promise 包装
function execGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 50 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout)
    })
  })
}

// 渲染进程：Store Action 中的异步调用
async commit(message: string) {
  try {
    const result = await window.api.commit(message)
    set({ commitMessage: '' })
    await get().refreshStatus()
    await get().loadHistory()
    addToast({ message: 'Commit created', kind: 'success' })
  } catch (e) {
    addToast({ message: String(e), kind: 'error' })
  }
}
```

## 7.8 测试

当前项目无自动化测试框架。计划引入：
- **单元测试**：Vitest，测试 Git 输出解析逻辑
- **组件测试**：React Testing Library，测试 UI 组件行为
- **E2E 测试**：Playwright + Electron，测试完整工作流
