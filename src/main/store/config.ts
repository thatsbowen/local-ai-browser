import Store from 'electron-store'
import { logger } from '../utils/logger'

interface AIConfig {
  provider: string
  apiKey: string
  baseURL: string
  model: string
  customProviders: Array<{
    id: string
    name: string
    apiKey: string
    baseURL: string
    model: string
    apiFormat: 'openai' | 'anthropic'
  }>
  systemPrompt: string
}

interface StoreSchema {
  aiConfig: AIConfig
  browserConfig: {
    theme: 'dark' | 'light'
    homepage: string
    searchEngine: string
  }
  windowState: {
    width: number
    height: number
    x?: number
    y?: number
    isMaximized: boolean
  }
}

let store: Store<StoreSchema> | null = null

export const initStore = async () => {
  store = new Store<StoreSchema>({
    name: 'config',
    defaults: {
      aiConfig: {
        provider: 'zhipu',
        apiKey: '',
        baseURL: '',
        model: 'glm-4-flash',
        customProviders: [],
        systemPrompt: ''
      },
      browserConfig: {
        theme: 'dark',
        homepage: 'https://www.baidu.com',
        searchEngine: 'baidu'
      },
      windowState: {
        width: 1400,
        height: 900,
        isMaximized: false
      }
    },
    encryptionKey: 'local-ai-browser-secure-key-2024'
  })
  logger.info('Store path:', store.path)
}

export const getStore = () => {
  if (!store) throw new Error('Store not initialized')
  return store
}
