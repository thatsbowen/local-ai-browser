import { setupBookmarkHandlers } from './bookmarks'
import { setupHistoryHandlers } from './history'
import { setupAIHandlers } from './ai'
import { logger } from '../utils/logger'

export const setupIpcHandlers = () => {
  logger.info('Setting up IPC handlers')
  setupBookmarkHandlers()
  setupHistoryHandlers()
  setupAIHandlers()
  logger.info('All IPC handlers ready')
}
