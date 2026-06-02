import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
const api = {
  // 收藏夹
  bookmark: {
    getAll: () => ipcRenderer.invoke('bookmark:getAll'),
    add: (data: { title: string; url: string; folder?: string }) =>
      ipcRenderer.invoke('bookmark:add', data),
    remove: (id: number) => ipcRenderer.invoke('bookmark:remove', id),
    update: (id: number, data: { title?: string; url?: string; folder?: string }) =>
      ipcRenderer.invoke('bookmark:update', id, data)
  },

  // 历史记录
  history: {
    getAll: (limit?: number) => ipcRenderer.invoke('history:getAll', limit),
    add: (data: { title: string; url: string }) => ipcRenderer.invoke('history:add', data),
    clear: () => ipcRenderer.invoke('history:clear')
  },

  // AI 模型
  ai: {
    getModels: () => ipcRenderer.invoke('ai:getModels'),
    saveModel: (data: { name: string; endpoint: string; apiKey: string; isDefault?: boolean }) =>
      ipcRenderer.invoke('ai:saveModel', data),
    deleteModel: (id: number) => ipcRenderer.invoke('ai:deleteModel', id),
    setDefault: (id: number) => ipcRenderer.invoke('ai:setDefault', id)
  },

  // 浏览器控制
  browser: {
    openUrls: (urls: string[]) => ipcRenderer.invoke('browser:openUrls', urls),
    getCurrentUrl: () => ipcRenderer.invoke('browser:getCurrentUrl'),
    onOpenUrl: (callback: (data: { url: string; background: boolean }) => void) => {
      ipcRenderer.on('open-url', (_, data) => callback(data))
    }
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api