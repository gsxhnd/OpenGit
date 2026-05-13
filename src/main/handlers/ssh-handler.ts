/**
 * SSH处理器 - 注册SSH连接和shell相关的IPC处理器
 * SSH Handler - Registers SSH connection and shell IPC handlers
 */

import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { SshConnectPayload } from "../../shared/types";
import {
  createSshConnection,
  getConnection,
  disconnectConnection,
  getSftp,
  registerDestroyHook,
} from "../ssh-connection-manager";

// ============================================================================
// SSH连接处理 | SSH connection handling
// ============================================================================

/**
 * 注册所有SSH相关的IPC处理器
 * SSH shell启动、写入、resize、断开连接
 *
 * Register all SSH-related IPC handlers
 * SSH shell start, write, resize, disconnect
 */
export function registerSshHandlers() {
  /**
   * SSH连接建立
   * IPC: ssh:connect
   * 参数: SshConnectPayload | Arguments: SshConnectPayload
   * 返回: SshConnectResult (connectionId, fingerprint) | Returns: SshConnectResult
   *
   * Establish SSH connection
   * IPC: ssh:connect
   */
  ipcMain.handle(
    IPC_CHANNELS.SSH_CONNECT,
    async (event, payload: SshConnectPayload) => {
      const wc = event.sender;
      const connectionId = randomUUID();

      try {
        const result = await createSshConnection(wc, payload, connectionId);
        return result;
      } catch (err) {
        throw err;
      }
    },
  );

  /**
   * 断开SSH连接
   * IPC: ssh:disconnect
   * 参数: 连接ID | Arguments: Connection ID
   *
   * Disconnect SSH connection
   * IPC: ssh:disconnect
   */
  ipcMain.handle(
    IPC_CHANNELS.SSH_DISCONNECT,
    (_event, connectionId: string) => {
      disconnectConnection(connectionId);
    },
  );

  /**
   * 启动SSH shell会话
   * IPC: ssh:shell:start
   * 参数: 连接ID | Arguments: Connection ID
   * 返回: Promise<void> | Returns: Promise<void>
   *
   * Start SSH shell session
   * IPC: ssh:shell:start
   */
  ipcMain.handle(
    IPC_CHANNELS.SSH_SHELL_START,
    (event, connectionId: string) => {
      const wc = event.sender;
      const conn = getConnection(connectionId);

      if (!conn) {
        throw new Error("Unknown connection");
      }

      return new Promise<void>((resolve, reject) => {
        conn.client.shell(
          { term: "xterm-256color", cols: 80, rows: 24 },
          (err, stream) => {
            if (err) {
              reject(err);
              return;
            }

            conn.shellStream = stream;

            // 监听标准输出 | Listen to stdout
            stream.on("data", (chunk: Buffer) => {
              if (wc.isDestroyed()) return;
              wc.send(IPC_CHANNELS.SSH_DATA, { connectionId, data: chunk });
            });

            // 监听标准错误 | Listen to stderr
            stream.stderr?.on("data", (chunk: Buffer) => {
              if (wc.isDestroyed()) return;
              wc.send(IPC_CHANNELS.SSH_DATA, { connectionId, data: chunk });
            });

            // 监听关闭事件 | Listen to close event
            stream.on("close", () => {
              conn.shellStream = null;
              if (!wc.isDestroyed()) {
                wc.send(IPC_CHANNELS.SSH_SHELL_EXIT, { connectionId });
              }
            });

            resolve();
          },
        );
      });
    },
  );

  /**
   * 向SSH shell写入数据
   * IPC: ssh:shell:write
   * 参数: 连接ID, 数据 | Arguments: Connection ID, data
   *
   * Write data to SSH shell
   * IPC: ssh:shell:write
   */
  ipcMain.handle(
    IPC_CHANNELS.SSH_SHELL_WRITE,
    (_event, connectionId: string, data: string | Uint8Array) => {
      const conn = getConnection(connectionId);

      if (!conn?.shellStream) {
        return;
      }

      const buf =
        typeof data === "string"
          ? Buffer.from(data, "utf8")
          : Buffer.from(data);
      conn.shellStream.write(buf);
    },
  );

  /**
   * 调整SSH shell窗口大小
   * IPC: ssh:shell:resize
   * 参数: 连接ID, 列数, 行数 | Arguments: Connection ID, cols, rows
   *
   * Resize SSH shell window
   * IPC: ssh:shell:resize
   */
  ipcMain.handle(
    IPC_CHANNELS.SSH_SHELL_RESIZE,
    (_event, connectionId: string, cols: number, rows: number) => {
      const conn = getConnection(connectionId);

      if (!conn?.shellStream) {
        return;
      }

      try {
        // setWindow(rows, cols, height, width)
        conn.shellStream.setWindow(Math.max(2, rows), Math.max(2, cols), 0, 0);
      } catch {
        /* 忽略resize错误 | Ignore resize errors */
      }
    },
  );
}
