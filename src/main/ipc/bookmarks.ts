import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../store/db'
import { logger } from '../utils/logger'

export const setupBookmarkHandlers = () => {
  ipcMain.handle('bookmarks:getAll', () => {
    try {
      const db = getDb()
      const stmt = db.prepare('SELECT * FROM bookmarks ORDER BY createdAt DESC')
      return stmt.all()
    } catch (err) {
      logger.error('bookmarks:getAll error:', err)
      return []
    }
  })

  ipcMain.handle('bookmarks:add', (_, bookmark: { title: string; url: string; favicon?: string }) => {
    try {
      const db = getDb()
      const id = uuidv4()
      const now = Date.now()
      const stmt = db.prepare(
        'INSERT INTO bookmarks (id, title, url, favicon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
      )
      stmt.run(id, bookmark.title, bookmark.url, bookmark.favicon || null, now, now)
      return { id, ...bookmark, createdAt: now, updatedAt: now }
    } catch (err) {
      logger.error('bookmarks:add error:', err)
      throw err
    }
  })

  ipcMain.handle('bookmarks:remove', (_, id: string) => {
    try {
      const db = getDb()
      const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?')
      stmt.run(id)
      return true
    } catch (err) {
      logger.error('bookmarks:remove error:', err)
      throw err
    }
  })

  ipcMain.handle('bookmarks:update', (_, id: string, data: Partial<{ title: string; url: string; favicon: string }>) => {
    try {
      const db = getDb()
      const now = Date.now()
      const fields = Object.keys(data).map(key => `${key} = ?`).join(', ')
      const values = Object.values(data)
      const stmt = db.prepare(`UPDATE bookmarks SET ${fields}, updatedAt = ? WHERE id = ?`)
      stmt.run(...values, now, id)
      return true
    } catch (err) {
      logger.error('bookmarks:update error:', err)
      throw err
    }
  })
}
