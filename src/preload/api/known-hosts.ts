/**
 * Known Hosts管理API - SSH已知主机信息管理相关的IPC调用
 * Known Hosts API - IPC calls for SSH known hosts management
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { KnownHostEntry } from "../../shared/types";

/**
 * Known Hosts管理API接口
 * Known hosts management API interface
 */
export const knownHostsApi = {
  /**
   * 获取所有已知的主机信息
   * Get all known host entries
   */
  list: (): Promise<KnownHostEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_LIST),

  /**
   * 删除指定的已知主机
   * Remove specified known host entry
   */
  remove: (host: string, port: number): Promise<KnownHostEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_REMOVE, host, port),

  /**
   * 清空所有已知的主机信息
   * Clear all known host entries
   */
  clear: (): Promise<KnownHostEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.KNOWN_HOSTS_CLEAR),
};
