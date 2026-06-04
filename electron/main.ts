import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import Store from 'electron-store'

// 阻止外部 ffmpeg.dll 干扰 Electron 内置 libffmpeg
// 解决 "av_stream_get_side_data" 找不到入口点的版本冲突问题
process.env.PATH = (process.env.PATH || '')
  .split(path.delimiter)
  .filter(dir => !dir.toLowerCase().includes('ffmpeg'))
  .join(path.delimiter)

interface Bookmark {
  id: number
  title: string
  url: string
  folder: string
  createdAt: string
}

interface AIModel {
  id: number
  name: string
  endpoint: string
  apiKey: string
  enabled: boolean
  isDefault: boolean
  createdAt: string
}

interface HistoryItem {
  id: number
  title: string
  url: string
  visitedAt: string
}

interface StoreSchema {
  bookmarks: Bookmark[]
  history: HistoryItem[]
  aiModels: AIModel[]
  nextBookmarkId: number
  nextHistoryId: number
  nextModelId: number
}

let mainWindow: BrowserWindow | null = null
let store: Store<StoreSchema> | null = null

function initStore() {
  store = new Store<StoreSchema>({
    name: 'browser-data',
    defaults: {
      bookmarks: [],
      history: [],
      aiModels: [],
      nextBookmarkId: 1,
      nextHistoryId: 1,
      nextModelId: 1
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '本地AI智能浏览器',
    backgroundColor: '#F5F7FA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initStore()
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

// ============ IPC ============

// --- 收藏夹 ---
ipcMain.handle('bookmark:getAll', () => {
  return store!.get('bookmarks', [])
})

ipcMain.handle('bookmark:add', (_, data: { title: string; url: string; folder?: string }) => {
  const bookmarks = store!.get('bookmarks', [])
  const id = store!.get('nextBookmarkId', 1)
  const newBookmark: Bookmark = {
    id,
    title: data.title,
    url: data.url,
    folder: data.folder || '',
    createdAt: new Date().toISOString()
  }
  bookmarks.unshift(newBookmark)
  store!.set('bookmarks', bookmarks)
  store!.set('nextBookmarkId', id + 1)
  return { id }
})

ipcMain.handle('bookmark:remove', (_, id: number) => {
  const bookmarks = store!.get('bookmarks', [])
  store!.set('bookmarks', bookmarks.filter(b => b.id !== id))
  return true
})

ipcMain.handle('bookmark:update', (_, id: number, data: { title?: string; url?: string; folder?: string }) => {
  const bookmarks = store!.get('bookmarks', [])
  const idx = bookmarks.findIndex(b => b.id === id)
  if (idx !== -1) {
    if (data.title !== undefined) bookmarks[idx].title = data.title
    if (data.url !== undefined) bookmarks[idx].url = data.url
    if (data.folder !== undefined) bookmarks[idx].folder = data.folder
    store!.set('bookmarks', bookmarks)
  }
  return true
})

// --- 历史记录 ---
ipcMain.handle('history:getAll', (_, limit = 100) => {
  const history = store!.get('history', [])
  return history.slice(0, limit)
})

ipcMain.handle('history:add', (_, data: { title: string; url: string }) => {
  const history = store!.get('history', [])
  const id = store!.get('nextHistoryId', 1)
  history.unshift({
    id,
    title: data.title,
    url: data.url,
    visitedAt: new Date().toISOString()
  })
  store!.set('history', history.slice(0, 1000))
  store!.set('nextHistoryId', id + 1)
  return true
})

ipcMain.handle('history:clear', () => {
  store!.set('history', [])
  return true
})

// --- AI 模型 ---
ipcMain.handle('ai:getModels', () => {
  return store!.get('aiModels', [])
})

ipcMain.handle('ai:saveModel', (_, data: { name: string; endpoint: string; apiKey: string; isDefault?: boolean }) => {
  const models = store!.get('aiModels', [])
  if (data.isDefault) {
    models.forEach(m => m.isDefault = false)
  }
  const id = store!.get('nextModelId', 1)
  models.push({
    id,
    name: data.name,
    endpoint: data.endpoint,
    apiKey: data.apiKey,
    enabled: true,
    isDefault: !!data.isDefault,
    createdAt: new Date().toISOString()
  })
  store!.set('aiModels', models)
  store!.set('nextModelId', id + 1)
  return { id }
})

ipcMain.handle('ai:deleteModel', (_, id: number) => {
  const models = store!.get('aiModels', [])
  store!.set('aiModels', models.filter(m => m.id !== id))
  return true
})

ipcMain.handle('ai:setDefault', (_, id: number) => {
  const models = store!.get('aiModels', [])
  models.forEach(m => m.isDefault = m.id === id)
  store!.set('aiModels', models)
  return true
})

// --- 浏览器控制 ---
ipcMain.handle('browser:openUrls', (_, urls: string[]) => {
  if (!mainWindow) return
  mainWindow.webContents.send('open-urls', urls)
  return true
})

ipcMain.handle('browser:getCurrentUrl', () => {
  return mainWindow?.webContents.getURL() || ''
})

// --- Shell ---
ipcMain.handle('shell:openExternal', (_, url: string) => {
  shell.openExternal(url)
  return true
})