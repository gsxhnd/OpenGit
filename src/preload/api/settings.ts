/**
 * 设置API - 应用配置管理相关的IPC调用
 * Settings API - IPC calls for application configuration management
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { AppSettings } from "../../shared/types";

/**
 * 配置管理API接口
 * Configuration management API interface
 */
export const settingsApi = {
  /**
   * 获取当前应用配置
   * Get current application settings
   */
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

  /**
   * 更新应用配置的部分字段
   * 返回更新后的完整配置
   *
   * Update partial application settings
   * Returns updated full settings
   */
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, partial),

  /**
   * 获取所有可用的应用主题
   * Get all available application themes
   */
  getThemes: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_THEMES),
};
