/**
 * 本地PTY处理器 - 使用node-pty在主进程创建PTY，流式传输数据到渲染进程的xterm.js
 * Local PTY Handler - Uses node-pty in main process to create PTY, streams data to xterm.js in renderer
 */
import { ipcMain, WebContents } from "electron";
import * as pty from "node-pty";
import { randomUUID } from "crypto";
import { IPC_CHANNELS } from "../shared/ipc";

// ============================================================================
// 类型定义 | Type definitions
// ============================================================================

/**
 * PTY会话对象
 * 存储进程引用和关联的WebContents ID
 *
 * PTY session object
 * Stores process reference and associated WebContents ID
 */
type PtySession = {
  proc: pty.IPty;
  wcId: number;
};

type WindowsShell = "powershell" | "cmd" | "wsl";

function resolveShell(shell?: WindowsShell): string {
  if (process.platform !== "win32") {
    return process.env.SHELL || "/bin/bash";
  }

  if (shell === "cmd") return "cmd.exe";
  if (shell === "wsl") return "wsl.exe";
  return "powershell.exe";
}

// ============================================================================
// 私有存储 | Private storage
// ============================================================================

/**
 * PTY会话映射 - sessionId -> PtySession
 * PTY sessions map - sessionId -> PtySession
 */
const sessions = new Map<string, PtySession>();

/**
 * WebContents到会话映射 - wcId -> sessionIds集合
 * WebContents to sessions map - wcId -> Set of sessionIds
 * 用于窗口关闭时清理 | Used for cleanup when window closes
 */
const wcToSessionIds = new Map<number, Set<string>>();

/**
 * 已注册销毁钩子的WebContents ID集合
 * Set of WebContents IDs with destroy hooks already registered
 */
const ptyDestroyHooked = new Set<number>();

// ============================================================================
// 会话跟踪和清理 | Session tracking and cleanup
// ============================================================================

/**
 * 跟踪WebContents到PTY会话的映射
 *
 * Track the mapping between WebContents and PTY session IDs
 */
function trackSession(wcId: number, sessionId: string) {
  let set = wcToSessionIds.get(wcId);
  if (!set) {
    set = new Set();
    wcToSessionIds.set(wcId, set);
  }
  set.add(sessionId);
}

/**
 * 清理指定WebContents的所有PTY会话
 * 当浏览器窗口被销毁时调用，杀死所有关联的进程
 *
 * Clean up all PTY sessions for a WebContents
 * Called when browser window is destroyed, kills all associated processes
 */
function cleanupWebContents(wc: WebContents) {
  const set = wcToSessionIds.get(wc.id);
  if (!set) return;

  for (const sessionId of set) {
    const session = sessions.get(sessionId);
    if (session) {
      try {
        session.proc.kill();
      } catch {
        /* 忽略清理错误 | Ignore cleanup errors */
      }
      sessions.delete(sessionId);
    }
  }

  wcToSessionIds.delete(wc.id);
}

// ============================================================================
// PTY处理器注册 | PTY handler registration
// ============================================================================

/**
 * 注册所有本地PTY相关的IPC处理器
 * PTY创建、写入、resize、杀死等操作
 *
 * Register all local PTY related IPC handlers
 * PTY creation, write, resize, kill operations
 */
export function registerPtyHandlers() {
  /**
   * 创建新的PTY会话
   * IPC: pty:local:create
   * 参数: 可选的配置(cwd, cols, rows) | Arguments: Optional config (cwd, cols, rows)
   * 返回: { sessionId } | Returns: { sessionId }
   *
   * Create new PTY session
   * IPC: pty:local:create
   */
  ipcMain.handle(
    IPC_CHANNELS.PTY_LOCAL_CREATE,
    (event, opts?: { cwd?: string; cols?: number; rows?: number; shell?: WindowsShell }) => {
      const wc = event.sender;
      const sessionId = randomUUID();

      // 确定shell配置 | Determine shell configuration
      const cwd =
        opts?.cwd ??
        process.env.HOME ??
        process.env.USERPROFILE ??
        process.cwd();
      const shell = resolveShell(opts?.shell);

      // 生成PTY进程 | Spawn PTY process
      const proc = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols: Math.max(2, opts?.cols ?? 80),
        rows: Math.max(2, opts?.rows ?? 24),
        cwd,
        env: process.env as { [key: string]: string },
      });

      // 存储会话 | Store session
      sessions.set(sessionId, { proc, wcId: wc.id });
      trackSession(wc.id, sessionId);

      // 注册窗口销毁事件处理 | Register window destroy event handler
      if (!ptyDestroyHooked.has(wc.id)) {
        ptyDestroyHooked.add(wc.id);
        wc.once("destroyed", () => {
          cleanupWebContents(wc);
          ptyDestroyHooked.delete(wc.id);
        });
      }

      // 监听PTY数据输出 | Listen to PTY data output
      proc.onData((data) => {
        if (wc.isDestroyed()) return;
        // 将数据流式发送到渲染进程 | Stream data to renderer process
        wc.send(IPC_CHANNELS.PTY_LOCAL_DATA, {
          sessionId,
          data: Buffer.from(data, "utf8"),
        });
      });

      // 监听进程退出 | Listen to process exit
      proc.onExit(() => {
        sessions.delete(sessionId);
        const set = wcToSessionIds.get(wc.id);
        set?.delete(sessionId);
        if (!wc.isDestroyed()) {
          // 通知渲染进程进程已退出 | Notify renderer process has exited
          wc.send(IPC_CHANNELS.PTY_LOCAL_EXIT, { sessionId });
        }
      });

      return { sessionId };
    },
  );

  /**
   * 向PTY会话写入数据
   * IPC: pty:local:write
   * 参数: 会话ID, 数据 | Arguments: Session ID, data
   *
   * Write data to PTY session
   * IPC: pty:local:write
   */
  ipcMain.handle(
    IPC_CHANNELS.PTY_LOCAL_WRITE,
    (_event, sessionId: string, data: string | Uint8Array) => {
      const session = sessions.get(sessionId);
      if (!session) return;

      // 转换数据格式 | Convert data format
      const payload =
        typeof data === "string" ? data : Buffer.from(data).toString("utf8");
      session.proc.write(payload);
    },
  );

  /**
   * 调整PTY会话窗口大小
   * IPC: pty:local:resize
   * 参数: 会话ID, 列数, 行数 | Arguments: Session ID, cols, rows
   *
   * Resize PTY session window
   * IPC: pty:local:resize
   */
  ipcMain.handle(
    IPC_CHANNELS.PTY_LOCAL_RESIZE,
    (_event, sessionId: string, cols: number, rows: number) => {
      const session = sessions.get(sessionId);
      if (!session) return;

      try {
        session.proc.resize(Math.max(2, cols), Math.max(2, rows));
      } catch {
        /* 忽略resize错误 | Ignore resize errors */
      }
    },
  );

  /**
   * 杀死PTY会话
   * IPC: pty:local:kill
   * 参数: 会话ID | Arguments: Session ID
   *
   * Kill PTY session
   * IPC: pty:local:kill
   */
  ipcMain.handle(IPC_CHANNELS.PTY_LOCAL_KILL, (_event, sessionId: string) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    try {
      session.proc.kill();
    } catch {
      /* 忽略杀死错误 | Ignore kill errors */
    }

    sessions.delete(sessionId);
    const set = wcToSessionIds.get(session.wcId);
    set?.delete(sessionId);
  });
}
