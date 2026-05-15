import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";
import { updateElectronApp } from "update-electron-app";
import { buildAppMenu } from "./app-menu";
import { loadDevExtensions } from "./dev-extensions";
import { registerSettingsHandlers } from "./handlers/settings-handler";
import { registerSshSftpHandlers } from "./handlers/ssh-sftp-handler";
import { registerLocalFilesHandlers } from "./handlers/local-files-handler";
import { registerPtyHandlers } from "./pty-handlers";
import { registerLogHandlers } from "./handlers/log-handler";
import { registerWindowChromeHandlers } from "./handlers/window-chrome-handler";
import { registerDialogHandlers } from "./handlers/dialog-handler";
import { loadSettings, saveSettings } from "./config-manager";
import { initLogger, createLogger } from "./logger";
import { IPC_CHANNELS } from "../shared/ipc";
import { isDev, rendererUrl } from "../shared/build";

const log = () => createLogger("main");
let mainWindow: BrowserWindow | null = null;

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function createWindow() {
  const settings = loadSettings();
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: settings.window.width,
    height: settings.window.height,
    x: settings.window.x,
    y: settings.window.y,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    trafficLightPosition: isMac ? { x: 12, y: 13 } : undefined,
    frame: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const s = loadSettings();
      s.window = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      };
      saveSettings(s);
    }
  });

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGE, false);
  });

  if (isDev) {
    mainWindow.loadURL(rendererUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  initLogger();

  process.on("uncaughtException", (error) => {
    log().error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });
  });

  process.on("unhandledRejection", (reason, promise) => {
    log().error("Unhandled Rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: String(promise),
    });
  });

  log().info(`App is ready (dev=${isDev}), starting initialization...`);

  if (isDev) {
    log().debug("Loading developer extensions...");
    await loadDevExtensions();
  }

  Menu.setApplicationMenu(buildAppMenu());

  log().debug("Registering IPC handlers...");
  registerLogHandlers();
  registerSettingsHandlers();
  registerPtyHandlers();
  registerSshSftpHandlers();
  registerLocalFilesHandlers();
  registerWindowChromeHandlers(getMainWindow);
  registerDialogHandlers(getMainWindow);

  log().debug("Creating main window...");
  createWindow();
  log().info("Main window created successfully");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

export { mainWindow };
