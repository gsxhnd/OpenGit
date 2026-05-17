/**
 * 配置管理器 - 处理应用配置文件的读写和持久化
 * Config Manager - Handles reading, writing, and persisting application configuration files
 */

import { app } from "electron";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { AppSettings, HostProfile } from "../shared/types";
import { createLogger } from "./logger";

const log = () => createLogger("config");

// ============================================================================
// 私有缓存变量 | Private cached variables
// ============================================================================

let _configDir: string | null = null;
let _configFile: string | null = null;
let _themesDir: string | null = null;

// ============================================================================
// 路径获取函数 | Path getter functions
// ============================================================================

/**
 * 获取配置目录路径
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  if (!_configDir) {
    _configDir = join(app.getPath("userData"));
  }
  return _configDir;
}

/**
 * 获取配置文件完整路径
 * Get the full path to the configuration file
 */
function getConfigFile(): string {
  if (!_configFile) {
    _configFile = join(getConfigDir(), "config.json");
  }
  return _configFile;
}

/**
 * 获取主题目录路径
 * Get the themes directory path
 */
function getThemesDir(): string {
  if (!_themesDir) {
    _themesDir = join(app.getAppPath(), "themes");
  }
  return _themesDir;
}

// ============================================================================
// 默认配置 | Default configuration
// ============================================================================

/**
 * 应用默认设置
 * Application default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  window: { width: 1200, height: 760 },
  theme: "Standard Dark",
  language: "en",
  hosts: [],
  terminal: {
    fontSize: 14,
    scrollback: 5000,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    cursorStyle: "block",
    windowsShell: "powershell",
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: "on",
    minimap: true,
  },
  sidebar: {
    primaryExpanded: true,
    secondOpen: false,
  },
};

// ============================================================================
// 配置加载和保存 | Configuration loading and saving
// ============================================================================

/**
 * 从磁盘加载配置文件
 * 如果文件不存在或损坏，返回默认配置并创建备份
 *
 * Load configuration from disk
 * If file doesn't exist or is corrupted, return default config and create backup
 */
export function loadSettings(): AppSettings {
  try {
    if (existsSync(getConfigFile())) {
      const data = readFileSync(getConfigFile(), "utf-8");
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      return migrateSettings({ ...DEFAULT_SETTINGS, ...parsed });
    }
  } catch (err) {
    log().error("Failed to load settings", { error: String(err) });
    // 配置文件损坏时创建备份 | Create backup when config file is corrupted
    try {
      const backupPath = getConfigFile() + ".bak";
      if (existsSync(getConfigFile())) {
        const data = readFileSync(getConfigFile(), "utf-8");
        writeFileSync(backupPath, data);
      }
    } catch {
      /* 忽略备份失败 | Ignore backup failure */
    }
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 配置迁移函数 - 处理旧版本OpenGit配置向Puck的兼容性转换
 * Migration function - Handle compatibility conversion from legacy OpenGit config to Puck
 */
function migrateSettings(s: AppSettings): AppSettings {
  const any = s as unknown as Record<string, unknown>;

  // 迁移旧的recentRepos字段到hosts | Migrate legacy recentRepos field to hosts
  if (!Array.isArray(s.hosts) && Array.isArray(any.recentRepos)) {
    s.hosts = [];
  }

  // 确保terminal配置存在 | Ensure terminal config exists
  if (!s.terminal) {
    s.terminal = { ...DEFAULT_SETTINGS.terminal };
  } else {
    s.terminal = { ...DEFAULT_SETTINGS.terminal, ...s.terminal };
  }

  // 确保editor配置存在 | Ensure editor config exists
  if (!s.editor) {
    s.editor = { ...DEFAULT_SETTINGS.editor };
  }

  // 确保sidebar配置存在 | Ensure sidebar config exists
  if (!s.sidebar) {
    s.sidebar = { ...DEFAULT_SETTINGS.sidebar };
  }

  return s;
}

/**
 * 保存配置到磁盘
 * 会自动创建配置目录（如不存在）
 *
 * Save configuration to disk
 * Automatically creates config directory if it doesn't exist
 */
export function saveSettings(settings: AppSettings) {
  try {
    if (!existsSync(getConfigDir())) {
      mkdirSync(getConfigDir(), { recursive: true });
    }
    writeFileSync(getConfigFile(), JSON.stringify(settings, null, 2));
  } catch (err) {
    log().error("Failed to save settings", { error: String(err) });
  }
}

// ============================================================================
// 主机配置管理 | Host profile management
// ============================================================================

/**
 * 添加新的主机配置
 *
 * Add a new host profile
 */
export function addHost(host: Omit<HostProfile, "id">): HostProfile {
  const settings = loadSettings();
  const entry = { ...host, id: randomUUID() } as HostProfile;
  settings.hosts.push(entry);
  saveSettings(settings);
  return entry;
}

/**
 * 更新主机配置
 *
 * Update a host profile
 */
export function updateHost(
  id: string,
  updates: Partial<HostProfile>,
): HostProfile[] {
  const settings = loadSettings();
  const i = settings.hosts.findIndex((h) => h.id === id);
  if (i >= 0) {
    settings.hosts[i] = { ...settings.hosts[i], ...updates } as HostProfile;
    saveSettings(settings);
  }
  return loadSettings().hosts;
}

/**
 * 删除主机配置
 *
 * Remove a host profile
 */
export function removeHost(id: string): HostProfile[] {
  const settings = loadSettings();
  settings.hosts = settings.hosts.filter((h) => h.id !== id);
  saveSettings(settings);
  return settings.hosts;
}

// ============================================================================
// 主题管理 | Theme management
// ============================================================================

/**
 * 加载所有可用的主题
 * 从themes目录扫描.json文件
 *
 * Load all available themes
 * Scans themes directory for .json files
 */
export function loadThemes() {
  try {
    if (!existsSync(getThemesDir())) {
      return [];
    }
    const files = readdirSync(getThemesDir()).filter((f: string) =>
      f.endsWith(".json"),
    );
    return files.map((f: string) => {
      const data = JSON.parse(readFileSync(join(getThemesDir(), f), "utf-8"));
      return data;
    });
  } catch {
    return [];
  }
}
