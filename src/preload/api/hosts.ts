/**
 * 主机配置API - SSH主机书签管理相关的IPC调用
 * Hosts API - IPC calls for SSH host bookmarks management
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { HostProfile } from "../../shared/types";

/**
 * 主机配置管理API接口
 * Host profile management API interface
 */
export const hostsApi = {
  /**
   * 添加新的SSH主机配置
   * 返回创建的主机配置（包含生成的ID）
   *
   * Add new SSH host profile
   * Returns created host profile with generated ID
   */
  add: (host: Omit<HostProfile, "id">): Promise<HostProfile> =>
    ipcRenderer.invoke(IPC_CHANNELS.HOSTS_ADD, host),

  /**
   * 更新指定的SSH主机配置
   * 返回更新后的所有主机列表
   *
   * Update specified SSH host profile
   * Returns updated host list
   */
  update: (id: string, updates: Partial<HostProfile>): Promise<HostProfile[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.HOSTS_UPDATE, id, updates),

  /**
   * 删除指定的SSH主机配置
   * 返回删除后的主机列表
   *
   * Remove specified SSH host profile
   * Returns updated host list
   */
  remove: (id: string): Promise<HostProfile[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.HOSTS_REMOVE, id),
};
