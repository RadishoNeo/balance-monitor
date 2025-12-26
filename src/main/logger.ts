import { app } from 'electron'
import { join } from 'path'
import { existsSync, appendFileSync, mkdirSync, statSync, renameSync, unlinkSync, readdirSync, truncateSync } from 'fs'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
}

export class Logger {
  private static logDir: string
  private static logFile: string
  private static maxFileSize = 5 * 1024 * 1024 // 5MB
  private static maxBackupFiles = 5
  private module: string

  constructor(module: string) {
    this.module = module
    Logger.initialize()
  }

  private static initialize(): void {
    if (this.logDir) return

    const appData = app.getPath('appData')
    this.logDir = join(appData, 'balance-monitor', 'logs')
    this.logFile = join(this.logDir, 'app.log')

    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }

    // 检查日志文件大小
    this.rotateIfNeeded()
  }

  private static rotateIfNeeded(): void {
    if (!existsSync(this.logFile)) return

    try {
      const stats = statSync(this.logFile)
      if (stats.size > this.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFile = join(this.logDir, `app-${timestamp}.log`)

        renameSync(this.logFile, backupFile)

        // 清理旧备份
        this.cleanupOldBackups()
      }
    } catch (error) {
      console.error('日志轮换失败:', error)
    }
  }

  private static cleanupOldBackups(): void {
    try {
      const files = existsSync(this.logDir)
        ? readdirSync(this.logDir)
            .filter((f: string) => f.startsWith('app-') && f.endsWith('.log'))
            .map((f: string) => ({
              name: f,
              time: statSync(join(this.logDir, f)).mtime
            }))
        : []

      if (files.length > this.maxBackupFiles) {
        files.sort((a: any, b: any) => a.time - b.time)
        const toDelete = files.slice(0, files.length - this.maxBackupFiles)
        toDelete.forEach((file: any) => {
          unlinkSync(join(this.logDir, file.name))
        })
      }
    } catch (error) {
      console.error('清理旧日志失败:', error)
    }
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] [${this.module}] ${message}\n`
  }

  private writeLog(level: LogLevel, message: string): void {
    const logEntry = this.formatMessage(level, message)

    // 同时输出到控制台和文件
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        DEBUG: '\x1b[36m', // 青色
        INFO: '\x1b[37m', // 白色
        WARN: '\x1b[33m', // 黄色
        ERROR: '\x1b[31m', // 红色
        SUCCESS: '\x1b[32m' // 绿色
      }
      const reset = '\x1b[0m'
      console.log(`${colors[level]}${logEntry}${reset}`)
    }

    // 写入文件
    try {
      appendFileSync(Logger.logFile, logEntry)
    } catch (error) {
      console.error('写入日志失败:', error)
    }
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('DEBUG', message)
    }
  }

  info(message: string): void {
    this.writeLog('INFO', message)
  }

  warn(message: string): void {
    this.writeLog('WARN', message)
  }

  error(message: string): void {
    this.writeLog('ERROR', message)
  }

  success(message: string): void {
    this.writeLog('SUCCESS', message)
  }

  // 静态方法，用于全局日志
  static getLogEntries(limit: number = 100): LogEntry[] {
    if (!existsSync(this.logFile)) return []

    try {
      const content = require('fs').readFileSync(this.logFile, 'utf-8')
      const lines = content.trim().split('\n').slice(-limit)

      return lines.map((line) => {
        const match = line.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/)
        if (match) {
          return {
            timestamp: match[1],
            level: match[2] as LogLevel,
            module: match[3],
            message: match[4]
          }
        }
        return {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          module: 'Parser',
          message: line
        }
      })
    } catch (error) {
      console.error('读取日志失败:', error)
      return []
    }
  }

  static clearLogs(): void {
    try {
      if (existsSync(this.logFile)) {
        truncateSync(this.logFile, 0)
      }
    } catch (error) {
      console.error('清空日志失败:', error)
    }
  }

  static getLogFilePath(): string {
    return this.logFile
  }
}
