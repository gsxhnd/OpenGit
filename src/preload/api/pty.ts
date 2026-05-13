/**
 * 本地PTY终端API - 本地伪终端控制相关的IPC调用
 * PTY API - IPC calls for local pseudo-terminal control
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

/**
 * 本地PTY终端API接口
 * Local PTY terminal API interface
 */
export const ptyApi = {
  /**
   * 创建新的本地PTY会话
   * 返回 { sessionId }
   * 参数: 可选配置 { cwd?, cols?, rows? }
   *
   * Create new local PTY session
   * Returns { sessionId }
   * Arguments: Optional config { cwd?, cols?, rows? }
   */
  create: (opts?: { cwd?: string; cols?: number; rows?: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_CREATE, opts),

  /**
   * 向PTY会话写入数据
   * Write data to PTY session
   */
  write: (sessionId: string, data: string | Uint8Array) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_WRITE, sessionId, data),

  /**
   * 调整PTY会话窗口大小
   * Resize PTY session window
   */
  resize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_RESIZE, sessionId, cols, rows),

  /**
   * 杀死PTY会话
   * Kill PTY session
   */
  kill: (sessionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PTY_LOCAL_KILL, sessionId),

  /**
   * 监听PTY会话数据输出
   * 返回移除监听的函数
   *
   * Listen to PTY session data output
   * Returns function to remove listener
   */
  onData: (cb: (payload: { sessionId: string; data: Uint8Array }) => void) => {
    const fn = (
      _: Electron.IpcRendererEvent,
      payload: { sessionId: string; data: Uint8Array },
    ) => cb(payload);
    ipcRenderer.on(IPC_CHANNELS.PTY_LOCAL_DATA, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PTY_LOCAL_DATA, fn);
    };
  },

  /**
   * 监听PTY会话退出事件
   * 返回移除监听的函数
   *
   * Listen to PTY session exit event
   * Returns function to remove listener
   */
  onExit: (cb: (payload: { sessionId: string }) => void) => {
    const fn = (_: Electron.IpcRendererEvent, payload: { sessionId: string }) =>
      cb(payload);
    ipcRenderer.on(IPC_CHANNELS.PTY_LOCAL_EXIT, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PTY_LOCAL_EXIT, fn);
    };
  },
};
