/**
 * SSH连接API - SSH连接和Shell会话控制相关的IPC调用
 * SSH API - IPC calls for SSH connections and shell session control
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { SshConnectPayload, SshConnectResult } from "../../shared/types";

/**
 * SSH连接和Shell管理API接口
 * SSH connection and shell management API interface
 */
export const sshApi = {
  // ========================================================================
  // SSH连接 | SSH Connection
  // ========================================================================

  /**
   * 建立SSH连接
   * 返回 { connectionId, fingerprint, isNewHost }
   *
   * Establish SSH connection
   * Returns { connectionId, fingerprint, isNewHost }
   */
  connect: (payload: SshConnectPayload): Promise<SshConnectResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, payload),

  /**
   * 断开SSH连接
   * Disconnect SSH connection
   */
  disconnect: (connectionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_DISCONNECT, connectionId),

  // ========================================================================
  // SSH Shell | SSH Shell
  // ========================================================================

  /**
   * 启动SSH shell会话
   * Start SSH shell session
   */
  shellStart: (connectionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_START, connectionId),

  /**
   * 向SSH shell写入数据
   * Write data to SSH shell
   */
  shellWrite: (connectionId: string, data: string | Uint8Array) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_WRITE, connectionId, data),

  /**
   * 调整SSH shell窗口大小
   * Resize SSH shell window
   */
  shellResize: (connectionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SSH_SHELL_RESIZE, connectionId, cols, rows),

  /**
   * 监听SSH shell数据输出
   * 返回移除监听的函数
   *
   * Listen to SSH shell data output
   * Returns function to remove listener
   */
  onData: (
    cb: (payload: { connectionId: string; data: Uint8Array }) => void,
  ) => {
    const fn = (
      _: Electron.IpcRendererEvent,
      payload: { connectionId: string; data: Uint8Array },
    ) => cb(payload);
    ipcRenderer.on(IPC_CHANNELS.SSH_DATA, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SSH_DATA, fn);
    };
  },

  /**
   * 监听SSH shell退出事件
   * 返回移除监听的函数
   *
   * Listen to SSH shell exit event
   * Returns function to remove listener
   */
  onShellExit: (cb: (payload: { connectionId: string }) => void) => {
    const fn = (
      _: Electron.IpcRendererEvent,
      payload: { connectionId: string },
    ) => cb(payload);
    ipcRenderer.on(IPC_CHANNELS.SSH_SHELL_EXIT, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SSH_SHELL_EXIT, fn);
    };
  },
};
