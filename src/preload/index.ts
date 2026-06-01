import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      ipcRenderer.on('window:maximizeChange', (_, isMaximized) => callback(isMaximized))
    }
  },

  // 书签
  bookmarks: {
    getAll: () => ipcRenderer.invoke('bookmarks:getAll'),
    add: (bookmark: any) => ipcRenderer.invoke('bookmarks:add', bookmark),
    remove: (id: string) => ipcRenderer.invoke('bookmarks:remove', id),
    update: (id: string, data: any) => ipcRenderer.invoke('bookmarks:update', id, data)
  },

  // 历史记录
  history: {
    getAll: (limit?: number) => ipcRenderer.invoke('history:getAll', limit),
    add: (entry: any) => ipcRenderer.invoke('history:add', entry),
    search: (query: string) => ipcRenderer.invoke('history:search', query),
    clear: () => ipcRenderer.invoke('history:clear')
  },

  // AI配置
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:getConfig'),
    setConfig: (config: any) => ipcRenderer.invoke('ai:setConfig', config),
    // 对话
    chat: (params: any) => ipcRenderer.invoke('ai:chat', params),
    // 对话历史
    getChatHistory: () => ipcRenderer.invoke('ai:getChatHistory'),
    getChatMessages: (chatId: string) => ipcRenderer.invoke('ai:getChatMessages', chatId),
    createChat: () => ipcRenderer.invoke('ai:createChat'),
    deleteChat: (chatId: string) => ipcRenderer.invoke('ai:deleteChat', chatId),
    clearChat: (chatId: string) => ipcRenderer.invoke('ai:clearChat', chatId)
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },

  // 对话框
  dialog: {
    openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options)
  }
})
