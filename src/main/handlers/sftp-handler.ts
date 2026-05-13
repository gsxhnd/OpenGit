/**
 * SFTP处理器 - 注册所有SFTP文件操作的IPC处理器
 * SFTP Handler - Registers all SFTP file operation IPC handlers
 */

import { ipcMain } from "electron";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { SftpListEntry } from "../../shared/types";
import { getConnection, getSftp } from "../ssh-connection-manager";

// ============================================================================
// 常量 | Constants
// ============================================================================

/**
 * 远程文件文本读取的最大字节数
 * Maximum bytes for remote text file reading
 */
const MAX_REMOTE_TEXT_BYTES = 50 * 1024 * 1024;

// ============================================================================
// SFTP处理器注册 | SFTP handler registration
// ============================================================================

/**
 * 注册所有SFTP文件操作的IPC处理器
 * 列目录、读写文件、创建删除目录、文件传输等
 *
 * Register all SFTP file operation IPC handlers
 * List directories, read/write files, create/delete directories, transfers, etc.
 */
export function registerSftpHandlers() {
  /**
   * 列出远程目录内容
   * IPC: sftp:readdir
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: SftpListEntry数组 | Returns: Array of SftpListEntry
   *
   * List remote directory contents
   * IPC: sftp:readdir
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_READDIR,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<SftpListEntry[]>((resolve, reject) => {
        sftp.readdir(remotePath, (err, list) => {
          if (err) {
            reject(err);
            return;
          }

          // 将SSH2文件列表转换为统一格式 | Convert SSH2 file list to unified format
          const out: SftpListEntry[] = (list || []).map((item) => {
            const mode = item.attrs.mode || 0;
            const isDirectory = (mode & 0o40000) === 0o40000;
            const mtime = item.attrs.mtime;

            return {
              name: item.filename,
              longname: item.longname,
              isDirectory,
              size: item.attrs.size ?? 0,
              mtimeMs: typeof mtime === "number" ? mtime * 1000 : null,
            };
          });

          // 排序：目录在前，同类按名称字母排序 | Sort: directories first, then alphabetically
          out.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) {
              return a.isDirectory ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });

          resolve(out);
        });
      });
    },
  );

  /**
   * 读取远程文本文件
   * IPC: sftp:read-file-text
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: 文件内容字符串 | Returns: File content as string
   *
   * Read remote text file
   * IPC: sftp:read-file-text
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_READ_FILE_TEXT,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<string>((resolve, reject) => {
        sftp.readFile(remotePath, (err, data) => {
          if (err) {
            reject(err);
            return;
          }

          // 检查文件大小限制 | Check file size limit
          if (data.length > MAX_REMOTE_TEXT_BYTES) {
            reject(
              new Error(`File too large (max ${MAX_REMOTE_TEXT_BYTES} bytes)`),
            );
            return;
          }

          resolve(data.toString("utf8"));
        });
      });
    },
  );

  /**
   * 写入远程文本文件
   * IPC: sftp:write-file-text
   * 参数: 连接ID, 远程路径, 文件内容 | Arguments: Connection ID, remote path, content
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Write remote text file
   * IPC: sftp:write-file-text
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_WRITE_FILE_TEXT,
    async (
      _event,
      connectionId: string,
      remotePath: string,
      content: string,
    ) => {
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.writeFile(remotePath, Buffer.from(content, "utf8"), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  );

  /**
   * 在远程服务器创建目录
   * IPC: sftp:mkdir
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Create directory on remote server
   * IPC: sftp:mkdir
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_MKDIR,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.mkdir(remotePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  );

  /**
   * 删除远程目录
   * IPC: sftp:rmdir
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Remove remote directory
   * IPC: sftp:rmdir
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_RMDIR,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.rmdir(remotePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  );

  /**
   * 重命名或移动远程文件/目录
   * IPC: sftp:rename
   * 参数: 连接ID, 原始路径, 新路径 | Arguments: Connection ID, old path, new path
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Rename or move remote file/directory
   * IPC: sftp:rename
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_RENAME,
    async (_event, connectionId: string, oldPath: string, newPath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  );

  /**
   * 获取远程文件/目录信息
   * IPC: sftp:stat
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: SftpListEntry对象 | Returns: SftpListEntry object
   *
   * Get remote file/directory information
   * IPC: sftp:stat
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_STAT,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<SftpListEntry>((resolve, reject) => {
        sftp.stat(remotePath, (err, stats) => {
          if (err) {
            reject(err);
            return;
          }

          const mode = stats.mode || 0;
          const isDirectory = (mode & 0o40000) === 0o40000;
          const mtime = stats.mtime;
          const name = remotePath.split("/").pop() || remotePath;

          resolve({
            name,
            longname: `-rwxr-xr-x 1 user group ${stats.size ?? 0} Jan 01 1970 ${name}`,
            isDirectory,
            size: stats.size ?? 0,
            mtimeMs: typeof mtime === "number" ? mtime * 1000 : null,
          });
        });
      });
    },
  );

  /**
   * 删除远程文件
   * IPC: sftp:unlink
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Delete remote file
   * IPC: sftp:unlink
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_UNLINK,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.unlink(remotePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  );

  /**
   * 检查远程文件是否存在
   * IPC: sftp:exists
   * 参数: 连接ID, 远程路径 | Arguments: Connection ID, remote path
   * 返回: boolean | Returns: boolean
   *
   * Check if remote file exists
   * IPC: sftp:exists
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_EXISTS,
    async (_event, connectionId: string, remotePath: string) => {
      const sftp = await getSftp(connectionId);

      return new Promise<boolean>((resolve) => {
        sftp.stat(remotePath, (err) => {
          resolve(!err);
        });
      });
    },
  );

  /**
   * 从本地上传文件到远程
   * IPC: sftp:upload-from-local
   * 参数: 连接ID, 远程路径, 本地路径 | Arguments: Connection ID, remote path, local path
   * 返回: Promise<void> | Returns: Promise<void>
   * 发送进度事件: sftp:transfer-progress | Emits: sftp:transfer-progress
   *
   * Upload file from local to remote
   * IPC: sftp:upload-from-local
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_UPLOAD_FROM_LOCAL,
    async (
      event,
      connectionId: string,
      remotePath: string,
      localPath: string,
    ) => {
      if (!existsSync(localPath)) {
        throw new Error("Local file not found");
      }

      const wc = event.sender;
      const buf = readFileSync(localPath);
      const total = buf.length;

      // 发送初始进度 | Send initial progress
      wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
        connectionId,
        remotePath,
        kind: "upload",
        bytes: 0,
        total,
        done: false,
      });

      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.writeFile(remotePath, buf, (err) => {
          if (err) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: "upload",
              bytes: total,
              total,
              done: true,
              error: err.message,
            });
            reject(err);
            return;
          }

          // 发送完成进度 | Send completion progress
          wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
            connectionId,
            remotePath,
            kind: "upload",
            bytes: total,
            total,
            done: true,
          });
          resolve();
        });
      });
    },
  );

  /**
   * 从远程下载文件到本地
   * IPC: sftp:download-to-local
   * 参数: 连接ID, 远程路径, 本地路径 | Arguments: Connection ID, remote path, local path
   * 返回: Promise<void> | Returns: Promise<void>
   * 发送进度事件: sftp:transfer-progress | Emits: sftp:transfer-progress
   *
   * Download file from remote to local
   * IPC: sftp:download-to-local
   */
  ipcMain.handle(
    IPC_CHANNELS.SFTP_DOWNLOAD_TO_LOCAL,
    async (
      event,
      connectionId: string,
      remotePath: string,
      localPath: string,
    ) => {
      const wc = event.sender;
      const sftp = await getSftp(connectionId);

      return new Promise<void>((resolve, reject) => {
        sftp.readFile(remotePath, (err, data) => {
          if (err) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: "download",
              bytes: 0,
              total: 0,
              done: true,
              error: err.message,
            });
            reject(err);
            return;
          }

          const total = data.length;

          // 发送初始进度 | Send initial progress
          wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
            connectionId,
            remotePath,
            kind: "download",
            bytes: 0,
            total,
            done: false,
          });

          try {
            writeFileSync(localPath, data);

            // 发送完成进度 | Send completion progress
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: "download",
              bytes: total,
              total,
              done: true,
            });
            resolve();
          } catch (e) {
            wc.send(IPC_CHANNELS.SFTP_TRANSFER_PROGRESS, {
              connectionId,
              remotePath,
              kind: "download",
              bytes: 0,
              total,
              done: true,
              error: String(e),
            });
            reject(e);
          }
        });
      });
    },
  );
}
