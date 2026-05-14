# 7. 开发规范

## 7.1 代码风格

- **TypeScript strict mode**（`tsconfig.json` 中 `strict: true`）
- 使用 `tsc --noEmit` 进行类型检查（`npm run typecheck`）
- 代码行宽建议 100 字符
- 组件文件使用 PascalCase（`SettingsView.tsx`）
- 工具/模块文件使用 kebab-case（`config-manager.ts`）
- 避免 `any` 类型，使用 `unknown` 或具体类型
- 导出接口函数时添加类型注解

## 7.2 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `SettingsView`, `TitleBar` |
| 函数/方法 | camelCase | `openSession()`, `enqueueTransfer()` |
| 常量 | UPPER_SNAKE_CASE | `IPC_SSH_CONNECT`, `PAGE_SIZE` |
| 接口 | PascalCase（无 I 前缀） | `HostProfile`, `AppSettings` |
| State 类型 | PascalCase 描述性名词 | `TransferItem`, `SessionState` |
| Props 类型 | 组件名 + Props | `SettingsViewProps` |
| 文件（组件） | PascalCase.tsx | `WelcomeView.tsx` |
| 文件（工具） | kebab-case.ts | `config-manager.ts` |
| IPC 通道 | `域:动作` 格式 | `ssh:connect`, `sftp:list` |

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

**规范要点：**

- 每个组件一个文件，文件名即组件名
- 使用 `export function` 而非 `export default`（命名导入更一致）
- Props 通过接口定义，放在组件上方
- 使用 Tailwind 原子类，不写内联样式
- 复杂组件可配合 SCSS Modules 处理局部样式

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
- 按领域拆分 slice（settings、connection、session、transfer、toast）

## 7.5 IPC 新增功能流程

新增一个 IPC 能力需要修改 4 个位置：

```typescript
// 1. 定义通道常量（src/shared/ipc.ts）
export const IPC_CHANNELS = {
  SETTINGS_GET: 'settings:get',
  SSH_CONNECT: 'ssh:connect',
} as const

// 2. 主进程注册 Handler（src/main/handlers/ 下新建或追加）
ipcMain.handle(IPC_CHANNELS.SSH_CONNECT, async (_event, config) => {
  return sshService.connect(config)
})

// 3. Preload 暴露 API（src/preload/api/ 下对应模块）
contextBridge.exposeInMainWorld('api', {
  ssh: {
    connect: (config) => ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, config),
  },
})

// 4. 渲染进程通过 Store Action 调用
const connectSSH = async (config: SSHConfig) => {
  const result = await window.api.ssh.connect(config)
  set({ /* update state */ })
}
```

**IPC 规范：**

- 所有通道名在 `src/shared/ipc.ts` 统一定义
- 使用 `:` 分隔命名空间（如 `settings:get`、`ssh:connect`）
- 不向 IPC 传递不可序列化对象或回调
- Preload 不暴露原始 `ipcRenderer`
- Handler 模块在 `src/main/index.ts` 中注册

## 7.6 错误处理规范

```typescript
function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  addToast(message, 'error')
}
```

- 主进程：将可预期错误转为明确消息返回渲染进程
- 渲染进程：统一 Toast 或面板内错误展示
- 配置损坏：`config-manager.ts` 中备份 `.bak` 后回退默认配置
- 连接错误：提供可诊断的错误码和用户可读消息

## 7.7 异步操作规范

- 主进程：对子进程与网络 IO 设置超时与取消信号（AbortController）
- 渲染进程：在 Store Action 中 `try/catch`，失败时更新 UI 并 Toast
- 长任务（传输、扫描）通过事件推送进度，支持取消

## 7.8 安全编码

| 原则 | 做法 |
|------|------|
| 禁止 shell 拼接 | 使用 `execFile` + 参数数组，不用 `exec` 拼接字符串 |
| 凭据不落盘明文 | 优先系统钥匙串 / OS 凭据 API |
| 输入校验 | IPC Handler 入口校验参数类型和范围 |
| 最小权限 | preload 仅暴露必要 API，不暴露通用 shell 执行能力 |
| 资源限制 | 并发连接数、传输队列、超时均可配置 |

## 7.9 构建验证

每次修改后应运行：

```bash
npm run build        # 检查类型错误、import 问题、bundling 失败
npm run typecheck    # 严格类型检查（覆盖所有进程）
```

`npm run build` 会顺序构建 main → preload → renderer，能捕获跨进程的类型和导入问题。

## 7.10 测试（规划）

当前项目无自动化测试框架。计划引入：

- **单元测试**：Vitest，覆盖协议解析、路径规范化等纯函数
- **组件测试**：React Testing Library
- **E2E 测试**：Playwright + Electron，覆盖连接与传输主路径
