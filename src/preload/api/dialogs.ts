/**
 * 文件对话框API - 文件选择和保存相关的IPC调用
 * Dialogs API - IPC calls for file selection and saving
 */
import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

/**
 * 文件对话框API接口
 * File dialogs API interface
 */
export const dialogsApi = {
  /**
   * 打开文件夹选择对话框
   * 返回选中的文件夹路径或null
   *
   * Open folder selection dialog
   * Returns selected folder path or null
   */
  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  /**
   * 打开文件选择对话框
   * 返回选中的文件路径或null
   *
   * Open file selection dialog
   * Returns selected file path or null
   */
  openFile: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),

  /**
   * 打开文件保存对话框
   * 返回保存位置或null
   *
   * Open file save dialog
   * Returns save location or null
   */
  saveFile: (suggestedName?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, suggestedName),
};
