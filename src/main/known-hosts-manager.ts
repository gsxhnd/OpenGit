/**
 * Known Hosts 管理器 - 管理SSH已知的主机密钥指纹
 * Known Hosts Manager - Manages SSH known host key fingerprints
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { KnownHostEntry } from "../shared/types";
import { getConfigDir } from "./config-manager";

// ============================================================================
// 私有缓存变量 | Private cached variables
// ============================================================================

let _knownHostsFile: string | null = null;

// ============================================================================
// 路径获取函数 | Path getter functions
// ============================================================================

/**
 * 获取known_hosts文件的完整路径
 * Get the full path to the known_hosts.json file
 */
function getKnownHostsFile(): string {
  if (!_knownHostsFile) {
    _knownHostsFile = join(getConfigDir(), "known_hosts.json");
  }
  return _knownHostsFile;
}

// ============================================================================
// 已知主机数据操作 | Known hosts data operations
// ============================================================================

/**
 * 加载所有已知的主机信息
 * 如果文件不存在或损坏，返回空数组
 *
 * Load all known host entries
 * Returns empty array if file doesn't exist or is corrupted
 */
export function loadKnownHosts(): KnownHostEntry[] {
  try {
    if (existsSync(getKnownHostsFile())) {
      const data = readFileSync(getKnownHostsFile(), "utf-8");
      return JSON.parse(data) as KnownHostEntry[];
    }
  } catch {
    /* 忽略文件损坏 | Ignore corrupted file */
  }
  return [];
}

/**
 * 将已知主机列表写入磁盘
 * 会自动创建配置目录（如不存在）
 *
 * Save known host entries to disk
 * Automatically creates config directory if it doesn't exist
 */
function saveKnownHosts(hosts: KnownHostEntry[]) {
  try {
    if (!existsSync(getConfigDir())) {
      mkdirSync(getConfigDir(), { recursive: true });
    }
    writeFileSync(getKnownHostsFile(), JSON.stringify(hosts, null, 2));
  } catch (err) {
    console.error("Failed to save known_hosts:", err);
  }
}

// ============================================================================
// 已知主机查询和修改 | Known host lookup and modification
// ============================================================================

/**
 * 添加或更新一个已知的主机信息
 * 如果主机已存在则更新，否则追加
 *
 * Add or update a known host entry
 * Updates if exists, otherwise appends
 */
export function addKnownHost(entry: KnownHostEntry) {
  const hosts = loadKnownHosts();
  // 查找是否已存在 | Check if entry already exists
  const idx = hosts.findIndex(
    (h) => h.host === entry.host && h.port === entry.port,
  );
  if (idx >= 0) {
    hosts[idx] = entry;
  } else {
    hosts.push(entry);
  }
  saveKnownHosts(hosts);
}

/**
 * 查找已知的主机信息
 * 根据主机地址和端口查找对应的指纹信息
 *
 * Find a known host entry
 * Lookup by host address and port
 */
export function findKnownHost(
  host: string,
  port: number,
): KnownHostEntry | undefined {
  return loadKnownHosts().find((h) => h.host === host && h.port === port);
}

/**
 * 移除指定的已知主机
 *
 * Remove a known host entry
 */
export function removeKnownHost(host: string, port: number): KnownHostEntry[] {
  const hosts = loadKnownHosts().filter(
    (h) => !(h.host === host && h.port === port),
  );
  saveKnownHosts(hosts);
  return hosts;
}

/**
 * 清空所有已知的主机信息
 *
 * Clear all known host entries
 */
export function clearKnownHosts(): KnownHostEntry[] {
  saveKnownHosts([]);
  return [];
}
