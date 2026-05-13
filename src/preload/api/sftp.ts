/**
 * SFTP文件操作API - 远程SFTP文件系统操作相关的IPC调用
 * SFTP API - IPC calls for remote SFTP file system operations
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

/**
 * SFTP文件操作API接口
 * SFTP file operations API interface
 */
export const sftpApi = {
  /**
   * 列出远程目录内容
   * List remote directory contents
   */
  readdir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_READDIR, connectionId, remotePath),

  /**
   * 读取远程文本文件
   * Read remote text file
   */
  readFileText: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.SFTP_READ_FILE_TEXT,
      connectionId,
      remotePath,
    ),

  /**
   * 写入远程文本文件
   * Write remote text file
   */
  writeFileText: (connectionId: string, remotePath: string, content: string) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.SFTP_WRITE_FILE_TEXT,
      connectionId,
      remotePath,
      content,
    ),

  /**
   * 在远程服务器创建目录
   * Create directory on remote server
   */
  mkdir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_MKDIR, connectionId, remotePath),

  /**
   * 删除远程目录
   * Remove remote directory
   */
  rmdir: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_RMDIR, connectionId, remotePath),

  /**
   * 重命名或移动远程文件/目录
   * Rename or move remote file/directory
   */
  rename: (connectionId: string, oldPath: string, newPath: string) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.SFTP_RENAME,
      connectionId,
      oldPath,
      newPath,
    ),

  /**
   * 获取远程文件/目录的元数据
   * Get metadata of remote file/directory
   */
  stat: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_STAT, connectionId, remotePath),

  /**
   * 删除远程文件
   * Delete remote file
   */
  unlink: (connectionId: string, remotePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_UNLINK, connectionId, remotePath),

  /**
   * 从本地上传文件到远程
   * Upload file from local to remote
   */
  uploadFromLocal: (
    connectionId: string,
    remotePath: string,
    localPath: string,
  ) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.SFTP_UPLOAD_FROM_LOCAL,
      connectionId,
      remotePath,
      localPath,
    ),

  /**
   * 从远程下载文件到本地
   * Download file from remote to local
   */
  downloadToLocal: (
    connectionId: string,
    remotePath: string,
    localPath: string,
  ) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.SFTP_DOWNLOAD_TO_LOCAL,
      connectionId,
      remotePath,
      localPath,
    ),

  /**
   * 检查远程文件/目录是否存在
   * Check if remote file/directory exists
   */
  exists: (connectionId: string, remotePath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SFTP_EXISTS, connectionId, remotePath),

  /**
   * 监听SFTP文件传输进度
   * 包括上传和下载操作
   * 返回移除监听的函数
   *
   * Listen to SFTP file transfer progress
   * Includes upload and download operations
   * Returns function to remove listener
   */
  onTransferProgress: (
    cb: (payload: {
      connectionId: string;
      remotePath: string;
      kind: "upload" | "download";
      bytes: number;
      total: number;
      done: boolean;
      error?: string;
    }) => void,
  ) => {
    const fn = (
      _: Electron.IpcRendererEvent,
      payload: {
        connectionId: string;
        remotePath: string;
        kind: "upload" | "download";
        bytes: number;
        total: number;
        done: boolean;
        error?: string;
      },
    ) => cb(payload);
    ipcRenderer.on(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, fn);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, fn);
    };
  },
};
