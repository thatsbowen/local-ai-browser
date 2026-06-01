import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { logger } from '../utils/logger'

let db: Database.Database | null = null

export const initDatabase = async () => {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'browser_data.db')
  logger.info('Database path:', dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon TEXT,
      visitedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      chatId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (chatId) REFERENCES ai_chats(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_history_visitedAt ON history(visitedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_messages_chatId ON ai_messages(chatId);
  `)

  logger.info('Database tables created')
}

export const getDb = () => {
  if (!db) throw new Error('Database not initialized')
  return db
}
