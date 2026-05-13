/**
 * 窗口管理API - 应用窗口控制相关的IPC调用
 * Window API - IPC calls for application window management
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

/**
 * 窗口管理API接口
 * Window management API interface
 */
export const windowApi = {
  /**
   * 最小化应用窗口
   * Minimize application window
   */
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),

  /**
   * 最大化或恢复窗口
   * Maximize or restore window
   */
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),

  /**
   * 关闭应用窗口
   * Close application window
   */
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  /**
   * 检查窗口是否处于最大化状态
   * Check if window is maximized
   */
  isMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

  /**
   * 监听窗口最大化状态变化
   * 返回移除监听的函数
   *
   * Listen to window maximized state changes
   * Returns function to remove listener
   */
  onMaximizedChange: (cb: (maximized: boolean) => void) => {
    const fn = (_: Electron.IpcRendererEvent, maximized: boolean) =>
      cb(maximized);
    ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, fn);
    };
  },

  /**
   * 当前操作系统平台
   * 可能的值: 'darwin' | 'linux' | 'win32'
   *
   * Current operating system platform
   * Possible values: 'darwin' | 'linux' | 'win32'
   */
  platform: process.platform,
};
