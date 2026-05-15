import { ipcMain, dialog, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

export function registerDialogHandlers(
  getMainWindow: () => BrowserWindow | null,
) {
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const win = getMainWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async () => {
    const win = getMainWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (_e, suggestedName?: string) => {
      const win = getMainWindow();
      if (!win) return null;
      const result = await dialog.showSaveDialog(win, {
        defaultPath: suggestedName,
      });
      if (result.canceled || !result.filePath) return null;
      return result.filePath;
    },
  );
}
