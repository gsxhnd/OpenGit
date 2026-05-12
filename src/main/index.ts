/**
 * Main Process Entry - Electron 主进程入口
 *
 * 负责应用生命周期管理：
 * - 创建主窗口（BrowserWindow）
 * - 注册 IPC 处理器（Git 操作、设置、窗口控制）
 * - 管理窗口状态持久化（位置、尺寸）
 * - 加载渲染进程（开发模式用 URL，生产模式用文件）
 *
 * 窗口配置：
 * - macOS: hiddenInset 标题栏 + traffic light 按钮
 * - 其他平台: 标准窗口框架
 * - contextIsolation: true（安全隔离）
 * - nodeIntegration: false（禁止渲染进程直接访问 Node）
 */
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { registerGitHandlers } from './git-handlers'
import { registerSettingsHandlers, loadSettings, saveSettings } from './settings'
import { setupFileWatcher } from './file-watcher'
import { IPC_CHANNELS } from '../shared/ipc'

/** 主窗口实例引用 */
let mainWindow: BrowserWindow | null = null

function createWindow() {
  const settings = loadSettings()

  mainWindow = new BrowserWindow({
    width: settings.window.width,
    height: settings.window.height,
    x: settings.window.x,
    y: settings.window.y,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    frame: process.platform === 'darwin',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      const settings = loadSettings()
      settings.window = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      }
      saveSettings(settings)
    }
  })

  // Window control IPC
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow?.close())

  // Dialog IPC
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerGitHandlers()
  registerSettingsHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
