/**
 * Electron 主进程 - 窗口生命周期、IPC处理、事件处理
 * Electron Main Process - Window lifecycle, IPC handling, event management
 */
import { app, BrowserWindow, ipcMain, dialog, Menu, session } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { updateElectronApp } from "update-electron-app";
import { registerSettingsHandlers } from "./handlers/settings-handler";
import { registerSshSftpHandlers } from "./handlers/ssh-sftp-handler";
import { registerLocalFilesHandlers } from "./handlers/local-files-handler";
import { loadSettings, saveSettings } from "./config-manager";
import { registerPtyHandlers } from "./pty-handlers";
import { IPC_CHANNELS } from "../shared/ipc";

let mainWindow: BrowserWindow | null = null;

// ============================================================================
// 应用菜单 | Application Menu
// ============================================================================

/**
 * 加载开发者扩展 (仅在 dev 模式)
 * Load developer extensions (dev mode only)
 */
async function loadDevExtensions() {
  // Only load extensions in dev mode
  if (app.isPackaged) {
    return;
  }

  try {
    const extensionsDir = join(__dirname, "../../extensions");
    const reactDevToolsPath = join(extensionsDir, "react_dev_tool", "7.0.1_0");
    console.log("[main] React DevTools extension path:", reactDevToolsPath);

    // Load React DevTools extension
    if (existsSync(reactDevToolsPath)) {
      try {
        await session.defaultSession.extensions.loadExtension(
          reactDevToolsPath,
          { allowFileAccess: true },
        );
        console.log("[main] React DevTools extension loaded successfully");
      } catch (err: any) {
        console.warn(
          "[main] Failed to load React DevTools extension:",
          err?.message || err,
        );
      }
    } else {
      console.warn(
        "[main] React DevTools extension path not found:",
        reactDevToolsPath,
      );
    }
  } catch (err: any) {
    console.warn("[main] Error loading extensions:", err?.message || err);
  }
}

/**
 * 构建应用菜单模板
 * 在macOS上显示在菜单栏，在Windows/Linux上可通过Alt访问
 *
 * Build application menu template
 * On macOS shows in menu bar, on Windows/Linux accessible via Alt
 */
function buildAppMenu() {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" as const } : { role: "quit" as const }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [{ type: "separator" as const }, { role: "front" as const }]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

// ============================================================================
// 窗口管理 | Window Management
// ============================================================================

/**
 * 创建主窗口
 * 处理窗口配置、IPC处理器注册、事件监听
 *
 * Create the main window
 * Handles window configuration, IPC handler registration, event listeners
 */
function createWindow() {
  const settings = loadSettings();
  const isMac = process.platform === "darwin";

  // Set application menu (macOS: shown in menu bar; Windows/Linux: hidden but accessible via Alt)
  Menu.setApplicationMenu(buildAppMenu());

  mainWindow = new BrowserWindow({
    width: settings.window.width,
    height: settings.window.height,
    x: settings.window.x,
    y: settings.window.y,
    minWidth: 800,
    minHeight: 500,
    // macOS: hiddenInset keeps native traffic lights; Windows/Linux: hidden = fully frameless
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

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow?.minimize());
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow?.close());
  ipcMain.handle(
    IPC_CHANNELS.WINDOW_IS_MAXIMIZED,
    () => mainWindow?.isMaximized() ?? false,
  );

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory"],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (_e, suggestedName?: string) => {
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: suggestedName,
      });
      if (result.canceled || !result.filePath) return null;
      return result.filePath;
    },
  );

  if (!app.isPackaged) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// ============================================================================
// 应用生命周期 | Application Lifecycle
// ============================================================================

/**
 * 当Electron应用准备就绪时执行
 * 注册所有IPC处理器，创建主窗口
 *
 * Execute when Electron app is ready
 * Register all IPC handlers, create main window
 */
app.whenReady().then(async () => {
  console.log(
    `[main] App is ready (${app.isPackaged ? "production" : "development"}), starting initialization...`,
  );

  // Load developer extensions in dev mode
  if (!app.isPackaged) {
    console.log("[main] Loading developer extensions...");
    await loadDevExtensions();
  }

  console.log("[main] Registering IPC handlers...");
  registerSettingsHandlers();
  registerPtyHandlers();
  registerSshSftpHandlers();
  registerLocalFilesHandlers();

  console.log("[main] Creating main window...");
  createWindow();
  console.log("[main] Main window created successfully");

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

// Global error handling
process.on("uncaughtException", (error) => {
  console.error("[main] Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[main] Unhandled Rejection at:", promise, "reason:", reason);
});

if (!app.isPackaged) {
  console.log("[main] Development mode - DevTools and extensions enabled");
} else {
  console.log("[main] Production mode - DevTools and extensions disabled");
}

console.log("[main] Electron main process initialized");

export { mainWindow };
