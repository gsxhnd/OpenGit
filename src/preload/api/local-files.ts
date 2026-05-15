/**
 * 本地文件系统API - Preload bridge
 * Local File System API - Preload bridge
 */

import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { LocalFileEntry } from "../../shared/types";

/**
 * 本地文件系统API对象
 * Local file system API object
 */
export const localFilesApi = {
  /**
   * 读取目录内容
   * Read directory contents
   */
  readdir: (dirPath: string): Promise<LocalFileEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_READDIR, dirPath),

  /**
   * 获取文件/目录统计信息
   * Get file/directory stat info
   */
  stat: (filePath: string): Promise<LocalFileEntry> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_STAT, filePath),

  /**
   * 创建目录
   * Create directory
   */
  mkdir: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_MKDIR, dirPath),

  /**
   * 删除空目录
   * Remove empty directory
   */
  rmdir: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_RMDIR, dirPath),

  /**
   * 删除文件
   * Delete file
   */
  unlink: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_UNLINK, filePath),

  /**
   * 重命名/移动文件或目录
   * Rename/move file or directory
   */
  rename: (oldPath: string, newPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOCAL_RENAME, oldPath, newPath),
};
