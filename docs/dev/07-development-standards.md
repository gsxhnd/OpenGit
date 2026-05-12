# 7. 开发规范

## 7.1 代码风格

- **TypeScript strict mode**（`tsconfig.json` 中 `strict: true`）
- 使用 `tsc --noEmit` 进行类型检查（`npm run typecheck`）
- 代码行宽建议 100 字符
- 组件文件使用 PascalCase（`SettingsView.tsx`）
- 工具文件使用 kebab-case（`remote-handlers.ts` 等）
- 避免 `any` 类型，使用 `unknown` 或具体类型
- 导出接口函数时添加类型注解

## 7.2 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `SettingsView`, `TitleBar` |
| 函数/方法 | camelCase | `openSession()`, `enqueueTransfer()` |
| 常量 | UPPER_SNAKE_CASE | `IPC_SSH_CONNECT`, `PAGE_SIZE` |
| 接口 | PascalCase (无 I 前缀) | `HostProfile`, `AppSettings` |
| State 类型 | PascalCase 描述性名词 | `TransferItem`, `SessionState` |
| Props 类型 | 组件名 + Props | `SettingsViewProps` |
| 文件 (组件) | PascalCase.tsx | `WelcomeView.tsx` |
| 文件 (工具) | kebab-case.ts | `settings.ts` |

## 7.3 组件开发规范

```typescript
interface TitleBarProps {
  title: string
}

export function TitleBar({ title }: TitleBarProps) {
  return (
    <header className="flex items-center">
      {/* ... */}
    </header>
  )
}
```

**组件规范：**

- 每个组件一个文件，文件名即组件名
- 使用 `export function` 而非 `export default`（命名导入更一致）
- Props 通过接口定义，放在组件上方
- 使用 Tailwind 原子类，不写内联样式

## 7.4 状态管理规范

```typescript
interface AppStore {
  settings: AppSettings | null
  addToast: (message: string, kind: ToastKind) => void
  loadSettings: () => Promise<void>
}
```

**Store 规范：**

- 状态与 Action 集中在 Zustand Store 中
- Action 命名：动词开头（`loadSettings`、`openSession`）
- 异步 Action 在 Store 内调用 `window.api.*()` 并通过 `set()` 更新状态
- 组件中优先调用 Store Action，避免散落调用 `window.api`

## 7.5 IPC 通信规范

```typescript
// 1. 定义 IPC 通道（src/shared/ipc.ts）
export const IPC_CHANNELS = {
  SETTINGS_GET: 'settings:get',
  SSH_CONNECT: 'ssh:connect', // 示例：以功能域为前缀
} as const

// 2. 主进程注册 Handler（src/main/index.ts 或专用模块）
ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => loadSettings())

// 3. Preload 暴露 API（src/preload/index.ts）
contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
})

// 4. 渲染进程通过 Store 调用
await window.api.getSettings()
```

**IPC 规范：**

- 所有通道名在 `src/shared/ipc.ts` 统一定义
- 使用 `:` 与 `-` 分隔命名空间（如 `settings:get`、`ssh:connect`）
- 不向 IPC 传递不可序列化对象或回调
- Preload 不暴露原始 `ipcRenderer`

## 7.6 错误处理规范

```typescript
function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  addToast(message, 'error')
}
```

- 主进程：将可预期错误转为明确消息返回渲染进程
- 渲染进程：统一 Toast 或内联错误展示
- 配置损坏：`settings.ts` 中备份 `.bak` 后回退默认配置

## 7.7 异步操作规范

- 主进程：对子进程与网络 IO 设置超时与取消信号（随实现选用 AbortController 等）
- 渲染进程：在 Store Action 中 `try/catch`，失败时更新 UI 并 Toast

## 7.8 测试

当前项目无自动化测试框架。计划引入：

- **单元测试**：Vitest，覆盖协议解析、路径规范化等纯函数
- **组件测试**：React Testing Library
- **E2E 测试**：Playwright + Electron，覆盖连接与传输主路径
