import { ipcMain, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../store/db'
import { getStore } from '../store/config'
import { logger } from '../utils/logger'
import { chatWithAI, ChatParams } from './ai/chat'

export const setupAIHandlers = () => {
  // 获取AI配置
  ipcMain.handle('ai:getConfig', () => {
    try {
      const store = getStore()
      return store.get('aiConfig')
    } catch (err) {
      logger.error('ai:getConfig error:', err)
      return null
    }
  })

  // 保存AI配置
  ipcMain.handle('ai:setConfig', (_, config: any) => {
    try {
      const store = getStore()
      store.set('aiConfig', config)
      return true
    } catch (err) {
      logger.error('ai:setConfig error:', err)
      throw err
    }
  })

  // 获取对话历史列表
  ipcMain.handle('ai:getChatHistory', () => {
    try {
      const db = getDb()
      const stmt = db.prepare('SELECT * FROM ai_chats ORDER BY updatedAt DESC')
      return stmt.all()
    } catch (err) {
      logger.error('ai:getChatHistory error:', err)
      return []
    }
  })

  // 获取某个对话的消息
  ipcMain.handle('ai:getChatMessages', (_, chatId: string) => {
    try {
      const db = getDb()
      const stmt = db.prepare('SELECT * FROM ai_messages WHERE chatId = ? ORDER BY createdAt ASC')
      return stmt.all(chatId)
    } catch (err) {
      logger.error('ai:getChatMessages error:', err)
      return []
    }
  })

  // 创建新对话
  ipcMain.handle('ai:createChat', () => {
    try {
      const db = getDb()
      const id = uuidv4()
      const now = Date.now()
      const stmt = db.prepare('INSERT INTO ai_chats (id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)')
      stmt.run(id, '新对话', now, now)
      return { id, title: '新对话', createdAt: now, updatedAt: now }
    } catch (err) {
      logger.error('ai:createChat error:', err)
      throw err
    }
  })

  // 删除对话
  ipcMain.handle('ai:deleteChat', (_, chatId: string) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM ai_messages WHERE chatId = ?').run(chatId)
      db.prepare('DELETE FROM ai_chats WHERE id = ?').run(chatId)
      return true
    } catch (err) {
      logger.error('ai:deleteChat error:', err)
      throw err
    }
  })

  // 清除对话消息
  ipcMain.handle('ai:clearChat', (_, chatId: string) => {
    try {
      const db = getDb()
      db.prepare('DELETE FROM ai_messages WHERE chatId = ?').run(chatId)
      // 更新对话更新时间
      db.prepare('UPDATE ai_chats SET updatedAt = ? WHERE id = ?').run(Date.now(), chatId)
      return true
    } catch (err) {
      logger.error('ai:clearChat error:', err)
      throw err
    }
  })

  // AI对话（流式）
  ipcMain.handle('ai:chat', async (event, params: ChatParams) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    try {
      // 保存用户消息
      const db = getDb()
      const userMsgId = uuidv4()
      const assistantMsgId = uuidv4()
      const now = Date.now()

      db.prepare(
        'INSERT INTO ai_messages (id, chatId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)'
      ).run(userMsgId, params.chatId, 'user', params.message, now)

      // 更新对话标题（如果这是第一条消息）
      const msgCount = db.prepare('SELECT COUNT(*) as count FROM ai_messages WHERE chatId = ?').get(params.chatId) as { count: number }
      if (msgCount.count === 1) {
        const title = params.message.slice(0, 30) + (params.message.length > 30 ? '...' : '')
        db.prepare('UPDATE ai_chats SET title = ?, updatedAt = ? WHERE id = ?').run(title, now, params.chatId)
      }

      // 调用AI
      const response = await chatWithAI(params, (chunk) => {
        win.webContents.send('ai:chat:chunk', { chatId: params.chatId, chunk })
      })

      // 保存助手消息
      db.prepare(
        'INSERT INTO ai_messages (id, chatId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)'
      ).run(assistantMsgId, params.chatId, 'assistant', response, Date.now())

      // 更新对话更新时间
      db.prepare('UPDATE ai_chats SET updatedAt = ? WHERE id = ?').run(Date.now(), params.chatId)

      return { success: true, message: response }
    } catch (err: any) {
      logger.error('ai:chat error:', err)
      return { success: false, error: err.message || 'AI调用失败' }
    }
  })
}
