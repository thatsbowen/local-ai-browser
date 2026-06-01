import { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme } from 'electron'
import path from 'path'
import { setupIpcHandlers } from './ipc'
import { initStore } from './store/config'
import { initDatabase } from './store/db'
import { logger } from './utils/logger'

// 禁用GPU加速避免一些问题
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  logger.info('Creating main window')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    logger.info('Main window shown')
  })

  // 打开外部链接用系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

// 窗口控制IPC
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

// 打开外部链接
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  await shell.openExternal(url)
})

// 文件选择对话框
ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options)
  return result
})

// 应用入口
app.whenReady().then(async () => {
  logger.info('App ready, initializing...')

  try {
    // 初始化配置存储
    await initStore()
    logger.info('Store initialized')

    // 初始化数据库
    await initDatabase()
    logger.info('Database initialized')

    // 设置IPC处理程序
    setupIpcHandlers()
    logger.info('IPC handlers setup')

    // 创建窗口
    createWindow()
  } catch (err) {
    logger.error('Initialization error:', err)
    dialog.showErrorBox('启动错误', `初始化失败: ${err}`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
