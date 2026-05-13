/**
 * SSH连接管理器 - 管理SSH客户端连接、生命周期和清理
 * SSH Connection Manager - Manages SSH client connections, lifecycle, and cleanup
 */

import { WebContents } from "electron";
import { Client, ConnectConfig, SFTPWrapper, ClientChannel } from "ssh2";
import type { SshConnectPayload, SshConnectResult } from "../shared/types";
import { findKnownHost, addKnownHost } from "./known-hosts-manager";
import { readFileSync, existsSync } from "fs";

// ============================================================================
// 类型定义 | Type definitions
// ============================================================================

/**
 * SSH连接对象
 * Stores SSH client and related stream state
 */
type SshConnection = {
  client: Client;
  wcId: number;
  shellStream: ClientChannel | null;
  sftp: SFTPWrapper | null;
  sftpPromise: Promise<SFTPWrapper> | null;
};

// ============================================================================
// 私有存储 | Private storage
// ============================================================================

/**
 * SSH连接映射 - connectionId -> SshConnection
 * SSH connections map - connectionId -> SshConnection
 */
const connections = new Map<string, SshConnection>();

/**
 * WebContents到连接映射 - wcId -> connectionIds集合
 * WebContents to connections map - wcId -> Set of connectionIds
 * 用于窗口关闭时清理 | Used for cleanup when window closes
 */
const wcToConnIds = new Map<number, Set<string>>();

/**
 * 已注册销毁钩子的WebContents ID集合
 * Set of WebContents IDs with destroy hooks already registered
 */
const sshDestroyHooked = new Set<number>();

// ============================================================================
// 连接跟踪和清理 | Connection tracking and cleanup
// ============================================================================

/**
 * 跟踪WebContents到连接的映射
 * Track the mapping between WebContents and connection IDs
 */
function trackConn(wcId: number, connectionId: string) {
  let set = wcToConnIds.get(wcId);
  if (!set) {
    set = new Set();
    wcToConnIds.set(wcId, set);
  }
  set.add(connectionId);
}

/**
 * 清理指定WebContents的所有SSH连接
 * 当浏览器窗口被销毁时调用，关闭所有关联的连接
 *
 * Clean up all SSH connections for a WebContents
 * Called when browser window is destroyed, closes all associated connections
 */
export function cleanupWebContents(wc: WebContents) {
  const set = wcToConnIds.get(wc.id);
  if (!set) return;

  for (const connectionId of set) {
    const conn = connections.get(connectionId);
    if (conn) {
      try {
        conn.shellStream?.destroy();
        conn.client.end();
      } catch {
        /* 忽略清理错误 | Ignore cleanup errors */
      }
      connections.delete(connectionId);
    }
  }

  wcToConnIds.delete(wc.id);
}

/**
 * 为WebContents注册destroy事件监听器
 * 确保当窗口关闭时自动清理连接
 *
 * Register destroy event listener for WebContents
 * Ensures connections are cleaned up when window closes
 */
export function registerDestroyHook(wc: WebContents) {
  if (sshDestroyHooked.has(wc.id)) {
    return;
  }

  sshDestroyHooked.add(wc.id);
  wc.once("destroyed", () => {
    cleanupWebContents(wc);
    sshDestroyHooked.delete(wc.id);
  });
}

// ============================================================================
// 私钥加载 | Private key loading
// ============================================================================

/**
 * 从磁盘加载私钥文件
 * 如果文件不存在返回undefined
 *
 * Load private key from disk
 * Returns undefined if file doesn't exist
 */
function loadPrivateKey(path: string): Buffer | undefined {
  if (!path || !existsSync(path)) return undefined;
  return readFileSync(path);
}

// ============================================================================
// 连接创建 | Connection creation
// ============================================================================

/**
 * 创建SSH连接
 * 处理密钥验证、指纹检查、已知主机管理
 *
 * Create SSH connection
 * Handles key verification, fingerprint checking, known hosts management
 */
export function createSshConnection(
  wc: WebContents,
  payload: SshConnectPayload,
  connectionId: string,
): Promise<SshConnectResult> {
  return new Promise((resolve, reject) => {
    const client = new Client();
    let fingerprint = "";
    let hostKeyAccepted = false;

    const existing = findKnownHost(payload.host, payload.port);

    const config: ConnectConfig = {
      host: payload.host,
      port: payload.port || 22,
      username: payload.username,
      readyTimeout: 20000,
      tryKeyboard: true,
      /**
       * 主机密钥验证回调
       * 比对用户期望的指纹或已知主机记录
       *
       * Host key verification callback
       * Compares against user's expected fingerprint or known hosts
       */
      hostVerifier: (hashedKey: string) => {
        fingerprint = hashedKey;

        // 如果用户提供了期望的指纹，进行验证 | If user provided expected fingerprint, verify it
        if (payload.expectedFingerprint) {
          hostKeyAccepted = hashedKey === payload.expectedFingerprint;
          return hostKeyAccepted;
        }

        // 如果已知主机存在，验证指纹匹配 | If known host exists, verify fingerprint matches
        if (existing) {
          hostKeyAccepted = hashedKey === existing.fingerprint;
          return hostKeyAccepted;
        }

        // 首次连接 - 接受并稍后保存 | First time connecting - accept and save later
        hostKeyAccepted = true;
        return true;
      },
    };

    // 配置认证方式 | Configure authentication
    if (payload.password) {
      config.password = payload.password;
    }
    if (payload.privateKeyPath) {
      const pk = loadPrivateKey(payload.privateKeyPath);
      if (!pk) {
        reject(new Error("Private key file not found"));
        return;
      }
      config.privateKey = pk;
    }
    if (payload.passphrase) {
      config.passphrase = payload.passphrase;
    }

    if (!config.password && !config.privateKey) {
      reject(new Error("Password or private key required"));
      return;
    }

    client
      .on("ready", () => {
        // 连接成功 - 存储连接对象 | Connection successful - store connection object
        connections.set(connectionId, {
          client,
          wcId: wc.id,
          shellStream: null,
          sftp: null,
          sftpPromise: null,
        });
        trackConn(wc.id, connectionId);
        registerDestroyHook(wc);

        // 保存指纹到已知主机 | Save fingerprint to known hosts
        const isNewHost = !existing || existing.fingerprint !== fingerprint;
        if (hostKeyAccepted && fingerprint) {
          addKnownHost({
            host: payload.host,
            port: payload.port || 22,
            fingerprint,
            addedAt: Date.now(),
          });
        }

        resolve({ connectionId, fingerprint, isNewHost });
      })
      .on("error", (err) => {
        reject(err);
      })
      .connect(config);
  });
}

// ============================================================================
// 连接查询 | Connection queries
// ============================================================================

/**
 * 获取指定ID的SSH连接
 *
 * Get SSH connection by ID
 */
export function getConnection(connectionId: string): SshConnection | undefined {
  return connections.get(connectionId);
}

/**
 * 所有活跃的SSH连接是否存在
 *
 * Check if any active SSH connections exist
 */
export function hasActiveConnections(): boolean {
  return connections.size > 0;
}

// ============================================================================
// 连接断开 | Connection disconnection
// ============================================================================

/**
 * 断开指定的SSH连接
 * 关闭shell流、SFTP连接和SSH客户端
 *
 * Disconnect specified SSH connection
 * Closes shell stream, SFTP connection, and SSH client
 */
export function disconnectConnection(connectionId: string) {
  const conn = connections.get(connectionId);
  if (!conn) return;

  try {
    conn.shellStream?.destroy();
    conn.client.end();
  } catch {
    /* 忽略断开错误 | Ignore disconnection errors */
  }

  connections.delete(connectionId);

  // 从WebContents映射中移除 | Remove from WebContents map
  const set = wcToConnIds.get(conn.wcId);
  set?.delete(connectionId);
}

// ============================================================================
// SFTP获取 | SFTP retrieval
// ============================================================================

/**
 * 获取或创建SFTP子系统
 * 对单个连接使用缓存以避免重复创建
 *
 * Get or create SFTP subsystem
 * Caches per connection to avoid recreating
 */
export function getSftp(connectionId: string): Promise<SFTPWrapper> {
  const conn = connections.get(connectionId);
  if (!conn) return Promise.reject(new Error("Unknown connection"));

  if (conn.sftp) {
    return Promise.resolve(conn.sftp);
  }

  if (conn.sftpPromise) {
    return conn.sftpPromise;
  }

  conn.sftpPromise = new Promise((resolve, reject) => {
    conn.client.sftp((err, sftp) => {
      if (err) {
        conn.sftpPromise = null;
        reject(err);
        return;
      }
      conn.sftp = sftp;
      conn.sftpPromise = null;
      resolve(sftp);
    });
  });

  return conn.sftpPromise;
}
