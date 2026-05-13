/**
 * 设置处理器 - 注册所有IPC处理器用于配置和主机管理
 * Settings Handler - Registers all IPC handlers for configuration and host management
 */

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { AppSettings, HostProfile } from "../../shared/types";
import {
  loadSettings,
  saveSettings,
  loadThemes,
  addHost,
  updateHost,
  removeHost,
} from "../config-manager";
import {
  loadKnownHosts,
  addKnownHost,
  removeKnownHost,
  clearKnownHosts,
} from "../known-hosts-manager";

// ============================================================================
// 配置相关处理器 | Configuration handlers
// ============================================================================

/**
 * 注册所有设置相关的IPC处理器
 * 包括：配置CRUD、主题加载、主机配置管理、Known hosts管理
 *
 * Register all settings-related IPC handlers
 * Includes: Config CRUD, theme loading, host management, known hosts management
 */
export function registerSettingsHandlers() {
  // ========================================================================
  // 基本设置操作 | Basic settings operations
  // ========================================================================

  /**
   * 获取当前应用配置
   * IPC: settings:get
   *
   * Get current application settings
   * IPC: settings:get
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return loadSettings();
  });

  /**
   * 更新部分应用配置
   * IPC: settings:set
   * 参数: 部分配置对象 | Arguments: Partial config object
   * 返回: 更新后的完整配置 | Returns: Updated full config
   *
   * Update partial application settings
   * IPC: settings:set
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET,
    (_event, partial: Partial<AppSettings>) => {
      const current = loadSettings();
      const merged = { ...current, ...partial };
      saveSettings(merged);
      return merged;
    },
  );

  // ========================================================================
  // 主题操作 | Theme operations
  // ========================================================================

  /**
   * 获取所有可用的主题
   * IPC: settings:get-themes
   * 返回: 主题对象数组 | Returns: Array of theme objects
   *
   * Get all available themes
   * IPC: settings:get-themes
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_THEMES, () => {
    return loadThemes();
  });

  // ========================================================================
  // 主机管理 | Host management
  // ========================================================================

  /**
   * 添加新主机配置
   * IPC: hosts:add
   * 参数: 主机配置（不含id） | Arguments: Host config (without id)
   * 返回: 创建的主机配置（含id） | Returns: Created host config (with id)
   *
   * Add a new host profile
   * IPC: hosts:add
   */
  ipcMain.handle(
    IPC_CHANNELS.HOSTS_ADD,
    (_event, host: Omit<HostProfile, "id">) => {
      return addHost(host);
    },
  );

  /**
   * 更新主机配置
   * IPC: hosts:update
   * 参数: 主机ID, 部分更新数据 | Arguments: Host ID, partial update data
   * 返回: 更新后的所有主机列表 | Returns: Updated host list
   *
   * Update a host profile
   * IPC: hosts:update
   */
  ipcMain.handle(
    IPC_CHANNELS.HOSTS_UPDATE,
    (_event, id: string, updates: Partial<HostProfile>) => {
      return updateHost(id, updates);
    },
  );

  /**
   * 删除主机配置
   * IPC: hosts:remove
   * 参数: 主机ID | Arguments: Host ID
   * 返回: 删除后的主机列表 | Returns: Updated host list
   *
   * Remove a host profile
   * IPC: hosts:remove
   */
  ipcMain.handle(IPC_CHANNELS.HOSTS_REMOVE, (_event, id: string) => {
    return removeHost(id);
  });

  // ========================================================================
  // Known Hosts 管理 | Known hosts management
  // ========================================================================

  /**
   * 获取所有已知的主机信息
   * IPC: known-hosts:list
   * 返回: KnownHostEntry数组 | Returns: Array of KnownHostEntry
   *
   * Get all known host entries
   * IPC: known-hosts:list
   */
  ipcMain.handle(IPC_CHANNELS.KNOWN_HOSTS_LIST, () => {
    return loadKnownHosts();
  });

  /**
   * 删除指定的已知主机
   * IPC: known-hosts:remove
   * 参数: 主机地址, 端口号 | Arguments: Host address, port number
   * 返回: 删除后的KnownHostEntry列表 | Returns: Updated KnownHostEntry list
   *
   * Remove a known host entry
   * IPC: known-hosts:remove
   */
  ipcMain.handle(
    IPC_CHANNELS.KNOWN_HOSTS_REMOVE,
    (_event, host: string, port: number) => {
      return removeKnownHost(host, port);
    },
  );

  /**
   * 清空所有已知的主机信息
   * IPC: known-hosts:clear
   * 返回: 空数组 | Returns: Empty array
   *
   * Clear all known host entries
   * IPC: known-hosts:clear
   */
  ipcMain.handle(IPC_CHANNELS.KNOWN_HOSTS_CLEAR, () => {
    return clearKnownHosts();
  });
}
