/**
 * Preload API聚合器 - 将所有功能模块API合并为统一接口
 * Preload API Aggregator - Combines all functional module APIs into unified interface
 */

import { settingsApi } from "./settings";
import { hostsApi } from "./hosts";
import { windowApi } from "./window";
import { dialogsApi } from "./dialogs";
import { ptyApi } from "./pty";
import { sshApi } from "./ssh";
import { knownHostsApi } from "./known-hosts";
import { sftpApi } from "./sftp";
import { localFilesApi } from "./local-files";
import { logApi } from "./log";

/**
 * 合并所有API模块为统一的api对象
 * Merges all API modules into unified api object
 */
export const api = {
  // 配置管理 | Configuration Management
  getSettings: settingsApi.getSettings,
  setSettings: settingsApi.setSettings,
  getThemes: settingsApi.getThemes,

  // 主机配置 | Host Management
  hostsAdd: hostsApi.add,
  hostsUpdate: hostsApi.update,
  hostsRemove: hostsApi.remove,

  // 窗口管理 | Window Management
  minimize: windowApi.minimize,
  maximize: windowApi.maximize,
  close: windowApi.close,
  isMaximized: windowApi.isMaximized,
  onMaximizedChange: windowApi.onMaximizedChange,
  platform: windowApi.platform,

  // 文件对话框 | File Dialogs
  openDirectory: dialogsApi.openDirectory,
  openFile: dialogsApi.openFile,
  saveFile: dialogsApi.saveFile,

  // PTY终端 | PTY Terminal
  ptyLocalCreate: ptyApi.create,
  ptyLocalWrite: ptyApi.write,
  ptyLocalResize: ptyApi.resize,
  ptyLocalKill: ptyApi.kill,
  onPtyLocalData: ptyApi.onData,
  onPtyLocalExit: ptyApi.onExit,

  // SSH连接 | SSH Connection
  sshConnect: sshApi.connect,
  sshDisconnect: sshApi.disconnect,
  sshShellStart: sshApi.shellStart,
  sshShellWrite: sshApi.shellWrite,
  sshShellResize: sshApi.shellResize,
  onSshData: sshApi.onData,
  onSshShellExit: sshApi.onShellExit,

  // Known Hosts | Known Hosts Management
  knownHostsList: knownHostsApi.list,
  knownHostsRemove: knownHostsApi.remove,
  knownHostsClear: knownHostsApi.clear,

  // SFTP文件操作 | SFTP File Operations
  sftpReaddir: sftpApi.readdir,
  sftpReadFileText: sftpApi.readFileText,
  sftpWriteFileText: sftpApi.writeFileText,
  sftpMkdir: sftpApi.mkdir,
  sftpRmdir: sftpApi.rmdir,
  sftpRename: sftpApi.rename,
  sftpStat: sftpApi.stat,
  sftpUnlink: sftpApi.unlink,
  sftpUploadFromLocal: sftpApi.uploadFromLocal,
  sftpDownloadToLocal: sftpApi.downloadToLocal,
  sftpExists: sftpApi.exists,
  onSftpTransferProgress: sftpApi.onTransferProgress,

  // 本地文件操作 | Local File Operations
  localReaddir: localFilesApi.readdir,
  localStat: localFilesApi.stat,
  localMkdir: localFilesApi.mkdir,
  localRmdir: localFilesApi.rmdir,
  localUnlink: localFilesApi.unlink,
  localRename: localFilesApi.rename,

  // Logging | Logging
  logWrite: logApi.logWrite,
};

/**
 * 导出分类API供细粒度导入
 * Export categorized APIs for fine-grained imports
 */
export {
  settingsApi,
  hostsApi,
  windowApi,
  dialogsApi,
  ptyApi,
  sshApi,
  knownHostsApi,
  sftpApi,
  localFilesApi,
  logApi,
};
