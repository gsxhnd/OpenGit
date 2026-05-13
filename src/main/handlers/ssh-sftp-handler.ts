/**
 * SSH+SFTP综合处理器 - 统一注册SSH和SFTP处理器
 * SSH+SFTP Combined Handler - Unified registration of SSH and SFTP handlers
 */

import { registerSshHandlers } from "./ssh-handler";
import { registerSftpHandlers } from "./sftp-handler";

/**
 * 注册所有SSH和SFTP相关的IPC处理器
 * 包括SSH连接、shell、SFTP文件操作等
 *
 * Register all SSH and SFTP related IPC handlers
 * Includes SSH connections, shell, SFTP file operations, etc.
 */
export function registerSshSftpHandlers() {
  registerSshHandlers();
  registerSftpHandlers();
}
