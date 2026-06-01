import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../store/db'
import { logger } from '../utils/logger'

export const setupHistoryHandlers = () => {
  ipcMain.handle('history:getAll', (_, limit = 100) => {
    try {
      const db = getDb()
      const stmt = db.prepare('SELECT * FROM history ORDER BY visitedAt DESC LIMIT ?')
      return stmt.all(limit)
    } catch (err) {
      logger.error('history:getAll error:', err)
      return []
    }
  })

  ipcMain.handle('history:add', (_, entry: { title: string; url: string; favicon?: string }) => {
    try {
      const db = getDb()
      const id = uuidv4()
      const now = Date.now()
      const stmt = db.prepare(
        'INSERT INTO history (id, title, url, favicon, visitedAt) VALUES (?, ?, ?, ?, ?)'
      )
      stmt.run(id, entry.title, entry.url, entry.favicon || null, now)
      return { id, ...entry, visitedAt: now }
    } catch (err) {
      logger.error('history:add error:', err)
      throw err
    }
  })

  ipcMain.handle('history:search', (_, query: string) => {
    try {
      const db = getDb()
      const stmt = db.prepare(
        'SELECT * FROM history WHERE title LIKE ? OR url LIKE ? ORDER BY visitedAt DESC LIMIT 50'
      )
      const pattern = `%${query}%`
      return stmt.all(pattern, pattern)
    } catch (err) {
      logger.error('history:search error:', err)
      return []
    }
  })

  ipcMain.handle('history:clear', () => {
    try {
      const db = getDb()
      db.exec('DELETE FROM history')
      return true
    } catch (err) {
      logger.error('history:clear error:', err)
      throw err
    }
  })
}
