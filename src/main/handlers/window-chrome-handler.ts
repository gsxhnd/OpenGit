import { ipcMain, type BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";

export function registerWindowChromeHandlers(
  getMainWindow: () => BrowserWindow | null,
) {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => getMainWindow()?.minimize());

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getMainWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => getMainWindow()?.close());

  ipcMain.handle(
    IPC_CHANNELS.WINDOW_IS_MAXIMIZED,
    () => getMainWindow()?.isMaximized() ?? false,
  );
}
