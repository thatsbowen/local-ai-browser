import { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI: {
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
        onMaximizeChange: (callback: (isMaximized: boolean) => void) => void
      }
      bookmarks: any
      history: any
      ai: any
      shell: { openExternal: (url: string) => Promise<void> }
      dialog: any
    }
  }
}

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
  createdAt: number
  updatedAt: number
}

export interface HistoryEntry {
  id: string
  title: string
  url: string
  favicon?: string
  visitedAt: number
}

export interface AIMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

export interface AIChat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface AIConfig {
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

export {}
