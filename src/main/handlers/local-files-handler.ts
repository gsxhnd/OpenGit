/**
 * 本地文件系统处理器 - 注册本地文件操作的IPC处理器
 * Local File System Handler - Registers IPC handlers for local file operations
 */

import { ipcMain } from "electron";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { LocalFileEntry } from "../../shared/types";

/**
 * 注册所有本地文件操作的IPC处理器
 * Register all local file operation IPC handlers
 */
export function registerLocalFilesHandlers() {
  /**
   * 读取目录内容
   * IPC: local:readdir
   * 参数: 目录路径 | Arguments: Directory path
   * 返回: LocalFileEntry[] | Returns: LocalFileEntry[]
   *
   * Read directory contents
   * IPC: local:readdir
   */
  ipcMain.handle(
    IPC_CHANNELS.LOCAL_READDIR,
    async (_event, dirPath: string) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const result: LocalFileEntry[] = [];

        for (const entry of entries) {
          try {
            const fullPath = join(dirPath, entry.name);
            const stat = await fs.stat(fullPath);

            result.push({
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              size: stat.size,
              mtimeMs: stat.mtimeMs,
            });
          } catch {
            // Skip files that cannot be stat'd (permission denied, etc.)
            continue;
          }
        }

        return result;
      } catch (err) {
        throw new Error(
          `Failed to read directory: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  /**
   * 获取文件/目录统计信息
   * IPC: local:stat
   * 参数: 文件路径 | Arguments: File path
   * 返回: LocalFileEntry | Returns: LocalFileEntry
   *
   * Get file/directory stat info
   * IPC: local:stat
   */
  ipcMain.handle(IPC_CHANNELS.LOCAL_STAT, async (_event, filePath: string) => {
    try {
      const stat = await fs.stat(filePath);

      return {
        name: filePath.split(/[\\/]/).pop() || filePath,
        path: filePath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      };
    } catch (err) {
      throw new Error(
        `Failed to stat file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  /**
   * 创建目录
   * IPC: local:mkdir
   * 参数: 目录路径 | Arguments: Directory path
   *
   * Create directory
   * IPC: local:mkdir
   */
  ipcMain.handle(IPC_CHANNELS.LOCAL_MKDIR, async (_event, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      throw new Error(
        `Failed to create directory: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  /**
   * 删除空目录
   * IPC: local:rmdir
   * 参数: 目录路径 | Arguments: Directory path
   *
   * Remove empty directory
   * IPC: local:rmdir
   */
  ipcMain.handle(IPC_CHANNELS.LOCAL_RMDIR, async (_event, dirPath: string) => {
    try {
      await fs.rmdir(dirPath);
    } catch (err) {
      throw new Error(
        `Failed to remove directory: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  /**
   * 删除文件
   * IPC: local:unlink
   * 参数: 文件路径 | Arguments: File path
   *
   * Delete file
   * IPC: local:unlink
   */
  ipcMain.handle(
    IPC_CHANNELS.LOCAL_UNLINK,
    async (_event, filePath: string) => {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        throw new Error(
          `Failed to delete file: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );

  /**
   * 重命名/移动文件或目录
   * IPC: local:rename
   * 参数: [旧路径, 新路径] | Arguments: [oldPath, newPath]
   *
   * Rename/move file or directory
   * IPC: local:rename
   */
  ipcMain.handle(
    IPC_CHANNELS.LOCAL_RENAME,
    async (_event, oldPath: string, newPath: string) => {
      try {
        await fs.rename(oldPath, newPath);
      } catch (err) {
        throw new Error(
          `Failed to rename: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  );
}
