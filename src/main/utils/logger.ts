import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const logDir = path.join(app.getPath('userData'), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)

const formatMessage = (level: string, ...args: any[]) => {
  const time = new Date().toISOString()
  const message = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    }
    return String(arg)
  }).join(' ')
  return `[${time}] [${level}] ${message}`
}

const writeLog = (level: string, ...args: any[]) => {
  const formatted = formatMessage(level, ...args)
  console.log(formatted)
  try {
    fs.appendFileSync(logFile, formatted + '\n')
  } catch (err) {
    console.error('Failed to write log:', err)
  }
}

export const logger = {
  info: (...args: any[]) => writeLog('INFO', ...args),
  warn: (...args: any[]) => writeLog('WARN', ...args),
  error: (...args: any[]) => writeLog('ERROR', ...args),
  debug: (...args: any[]) => writeLog('DEBUG', ...args)
}
