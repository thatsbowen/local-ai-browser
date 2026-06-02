/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  bookmark: {
    getAll: () => Promise<any[]>
    add: (data: { title: string; url: string; folder?: string }) => Promise<{ id: number }>
    remove: (id: number) => Promise<boolean>
    update: (id: number, data: { title?: string; url?: string; folder?: string }) => Promise<boolean>
  }
  history: {
    getAll: (limit?: number) => Promise<any[]>
    add: (data: { title: string; url: string }) => Promise<boolean>
    clear: () => Promise<boolean>
  }
  ai: {
    getModels: () => Promise<any[]>
    saveModel: (data: { name: string; endpoint: string; apiKey: string; isDefault?: boolean }) => Promise<{ id: number }>
    deleteModel: (id: number) => Promise<boolean>
    setDefault: (id: number) => Promise<boolean>
  }
  browser: {
    openUrls: (urls: string[]) => Promise<boolean>
    getCurrentUrl: () => Promise<string>
    onOpenUrl: (callback: (data: { url: string; background: boolean }) => void) => void
  }
  shell: {
    openExternal: (url: string) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}