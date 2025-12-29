import { app } from 'electron'
import { join } from 'path'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
  readdirSync,
  statSync
} from 'fs'
import { safeStorage } from 'electron'
import { Logger } from './logger'
import { v4 as uuidv4 } from 'uuid'
import type { ParserConfig } from './balance-parser'

export interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  headers: Array<{ key: string; value: string; encrypted?: boolean }>
  body?: string
  timeout?: number
  auth?: any
}

export interface MonitoringConfig {
  enabled: boolean
  interval: number
}

export interface ThresholdConfig {
  warning: number
  danger: number
  currency: string
}

export interface BalanceMonitorConfig {
  id: string
  name: string
  api: APIConfig
  parser: ParserConfig
  monitoring: MonitoringConfig
  thresholds: ThresholdConfig
  createdAt: string
  updatedAt: string
  enabled: boolean
}

export interface ConfigManagerOptions {
  autoSave?: boolean
  backup?: boolean
}

export class ConfigManager {
  private configDir: string
  private configFile: string
  private backupDir: string
  private logger: Logger
  private configs: Map<string, BalanceMonitorConfig>
  private activeConfigId: string | null

  constructor(_options: ConfigManagerOptions = {}) {
    console.log(_options)

    this.logger = new Logger('ConfigManager')
    this.configs = new Map()
    this.activeConfigId = null

    // 配置目录: ~/.balance-monitor
    const homeDir = app.getPath('home')
    this.configDir = join(homeDir, '.balance-monitor')
    this.backupDir = join(this.configDir, 'backups')
    this.configFile = join(this.configDir, 'configs.enc.json')

    this.initializeDirectories()
    this.loadConfigs()
  }

  private initializeDirectories(): void {
    try {
      if (!existsSync(this.configDir)) {
        mkdirSync(this.configDir, { recursive: true })
        this.logger.info(`创建配置目录: ${this.configDir}`)
      }

      if (!existsSync(this.backupDir)) {
        mkdirSync(this.backupDir, { recursive: true })
        this.logger.info(`创建备份目录: ${this.backupDir}`)
      }
    } catch (error) {
      this.logger.error(`初始化目录失败: ${error}`)
    }
  }

  private loadConfigs(): void {
    if (!existsSync(this.configFile)) {
      this.logger.info('配置文件不存在，使用空配置')
      return
    }

    try {
      const encrypted = readFileSync(this.configFile)

      // 检查是否使用了安全存储加密
      if (safeStorage.isEncryptionAvailable()) {
        try {
          const decrypted = safeStorage.decryptString(encrypted)
          const configsArray = JSON.parse(decrypted)
          this.configs.clear()
          configsArray.forEach((config: BalanceMonitorConfig) => {
            // 加载到内存时解密敏感字段
            this.configs.set(config.id, this.decryptConfig(config))
          })
          this.logger.info(`成功加载 ${this.configs.size} 个配置`)
          return
        } catch (decryptError) {
          this.logger.warn(`安全存储解密失败，尝试明文解析,错误信息: ${String(decryptError)}`)
        }
      }

      // 降级：尝试明文解析
      const decrypted = encrypted.toString()
      const configsArray = JSON.parse(decrypted)
      this.configs.clear()
      configsArray.forEach((config: BalanceMonitorConfig) => {
        this.configs.set(config.id, this.decryptConfig(config))
      })
      this.logger.info(`成功加载 ${this.configs.size} 个配置（明文）`)
    } catch (error) {
      this.logger.error(`加载配置失败: ${error}`)
    }
  }

  private saveConfigs(): void {
    try {
      const configsArray = Array.from(this.configs.values())
      // const json = JSON.stringify(configsArray, null, 2)

      // 加密敏感数据
      const encryptedConfigs = configsArray.map((config: any) => {
        const encryptedConfig = JSON.parse(JSON.stringify(config))

        // 加密请求头中的敏感值
        if (encryptedConfig.api && encryptedConfig.api.headers) {
          encryptedConfig.api.headers = encryptedConfig.api.headers.map((header: any) => ({
            key: header.key,
            value: this.encryptValue(header.value),
            encrypted: true
          }))
        }

        // 加密自定义解析器（如果包含敏感信息）
        if (encryptedConfig.parser?.customParser) {
          encryptedConfig.parser.customParser = this.encryptValue(
            encryptedConfig.parser.customParser
          )
        }

        // 加密 Auth 中的 API Key
        if (encryptedConfig.api?.auth?.apiKey) {
          encryptedConfig.api.auth.apiKey = this.encryptValue(encryptedConfig.api.auth.apiKey)
        }

        return encryptedConfig
      })

      const encryptedJson = JSON.stringify(encryptedConfigs, null, 2)

      // 使用安全存储加密整个文件
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(encryptedJson)
        writeFileSync(this.configFile, encrypted)
        this.logger.info('配置已加密保存')
      } else {
        // 降级：明文保存（但敏感字段已单独加密）
        writeFileSync(this.configFile, encryptedJson)
        this.logger.warn('安全存储不可用，使用字段级加密保存')
      }

      // 创建备份
      this.createBackup()
    } catch (error) {
      this.logger.error(`保存配置失败: ${error}`)
      throw error
    }
  }

  private createBackup(): void {
    if (!existsSync(this.configFile)) return

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = join(this.backupDir, `configs-${timestamp}.enc.json`)
      const data = readFileSync(this.configFile)
      writeFileSync(backupFile, data)

      // 清理旧备份（保留最近10个）
      this.cleanupOldBackups()
    } catch (error) {
      this.logger.warn(`备份创建失败: ${error}`)
    }
  }

  private cleanupOldBackups(): void {
    try {
      const files = existsSync(this.backupDir)
        ? readdirSync(this.backupDir).map((f: string) => ({
            name: f,
            time: statSync(join(this.backupDir, f)).mtime
          }))
        : []

      if (files.length > 10) {
        files.sort((a: any, b: any) => a.time - b.time)
        const toDelete = files.slice(0, files.length - 10)
        toDelete.forEach((file: any) => {
          unlinkSync(join(this.backupDir, file.name))
        })
      }
    } catch (error) {
      this.logger.warn(`清理备份失败: ${error}`)
    }
  }

  private encryptValue(value: string): string {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value)
        return encrypted.toString('base64')
      }
      // 降级：简单的base64编码（不安全，但比明文好）
      return Buffer.from(value).toString('base64')
    } catch (error) {
      this.logger.error(`加密失败: ${error}`)
      return value
    }
  }

  private decryptValue(encryptedValue: string): string {
    if (!encryptedValue || encryptedValue.length < 5) return encryptedValue
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encryptedValue, 'base64')
        return safeStorage.decryptString(buffer)
      }
      return Buffer.from(encryptedValue, 'base64').toString()
    } catch (error: any) {
      // 如果报错暗示不是加密内容，则直接返回原值，不记录错误
      const errorMsg = String(error)
      if (
        errorMsg.includes('Ciphertext does not appear to be encrypted') ||
        errorMsg.includes('decryption failed')
      ) {
        return encryptedValue
      }
      this.logger.warn(`解密失败 (假定为明文): ${error}`)
      return encryptedValue
    }
  }

  // 公共API
  createConfig(
    config: Omit<BalanceMonitorConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): BalanceMonitorConfig {
    const id = uuidv4()
    const now = new Date().toISOString()

    const fullConfig: BalanceMonitorConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.configs.set(id, fullConfig)

    if (config.monitoring?.enabled) {
      this.activeConfigId = id
    }

    this.saveConfigs()
    this.logger.info(`创建配置: ${config.name} (${id})`)

    return fullConfig
  }

  updateConfig(id: string, updates: Partial<BalanceMonitorConfig>): BalanceMonitorConfig | null {
    const config = this.configs.get(id)
    if (!config) {
      this.logger.warn(`配置不存在: ${id}`)
      return null
    }

    const updated = {
      ...config,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.configs.set(id, updated)
    this.saveConfigs()
    this.logger.info(`更新配置: ${config.name}`)

    return updated
  }

  deleteConfig(id: string): boolean {
    const config = this.configs.get(id)
    if (!config) return false

    this.configs.delete(id)

    if (this.activeConfigId === id) {
      this.activeConfigId = null
    }

    this.saveConfigs()
    this.logger.info(`删除配置: ${config.name}`)
    return true
  }

  getConfig(id: string): BalanceMonitorConfig | null {
    const config = this.configs.get(id)
    if (!config) return null

    // 内存中已经是解密状态
    return config
  }

  getAllConfigs(): BalanceMonitorConfig[] {
    // 内存中已经是解密状态
    return Array.from(this.configs.values())
  }

  private decryptConfig(config: BalanceMonitorConfig): BalanceMonitorConfig {
    const decrypted = JSON.parse(JSON.stringify(config))

    // 解密请求头
    if (decrypted.api?.headers) {
      decrypted.api.headers = decrypted.api.headers.map((header: any) => ({
        key: header.key,
        value: header.encrypted ? this.decryptValue(header.value) : header.value,
        encrypted: false
      }))
    }

    // 解密自定义解析器
    if (decrypted.parser?.customParser) {
      // 检查是否是加密的（如果包含换行符等，可能是明文）
      if (
        !decrypted.parser.customParser.includes('\n') &&
        decrypted.parser.customParser.length > 50
      ) {
        try {
          decrypted.parser.customParser = this.decryptValue(decrypted.parser.customParser)
        } catch {
          // 忽略
        }
      }
    }

    // 解密 Auth 中的 API Key
    if (decrypted.api?.auth?.apiKey) {
      try {
        decrypted.api.auth.apiKey = this.decryptValue(decrypted.api.auth.apiKey)
      } catch {
        // 忽略
      }
    }

    return decrypted
  }

  setActiveConfig(id: string): boolean {
    if (!this.configs.has(id)) {
      this.logger.warn(`无法设置活动配置: ${id} 不存在`)
      return false
    }

    this.activeConfigId = id
    this.logger.info(`设置活动配置: ${id}`)
    return true
  }

  getActiveConfig(): BalanceMonitorConfig | null {
    if (!this.activeConfigId) return null
    return this.getConfig(this.activeConfigId)
  }

  exportConfig(id: string): string | null {
    const config = this.getConfig(id)
    if (!config) return null

    // 导出时移除敏感数据，但保留结构
    const exportData = {
      ...config,
      api: {
        ...config.api,
        headers: (config.api.headers || []).map((h) => ({
          key: h.key,
          value:
            h.key.toLowerCase().includes('authorization') || h.key.toLowerCase().includes('token')
              ? 'ENCRYPTED_PLACEHOLDER'
              : h.value
        }))
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  importConfig(jsonString: string): BalanceMonitorConfig | null {
    try {
      const data = JSON.parse(jsonString)

      // 验证必要字段
      const hasValidParser =
        data.parser?.balancePath ||
        data.parser?.parserType ||
        data.parser?.balanceMappings ||
        data.parser?.customParser
      if (!data.name || !data.api?.url || !hasValidParser) {
        throw new Error('配置缺少必要字段')
      }

      // 创建新配置
      const config: any = {
        name: data.name,
        api: data.api,
        parser: data.parser,
        monitoring: data.monitoring || { enabled: false, interval: 30 },
        thresholds: data.thresholds || { warning: 50, danger: 10, currency: '¥' },
        enabled: data.enabled !== false
      }

      const created = this.createConfig(config)
      this.logger.info(`导入配置: ${created.name}`)
      return created
    } catch (error) {
      this.logger.error(`导入配置失败: ${error}`)
      return null
    }
  }

  // 配置验证
  validateConfig(config: BalanceMonitorConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push('配置名称不能为空')
    }

    if (!config.api.url || !config.api.url.match(/^https?:\/\/.+/)) {
      errors.push('API地址必须是有效的HTTP/HTTPS URL')
    }

    if (!['GET', 'POST'].includes(config.api.method)) {
      errors.push('请求方法必须是GET或POST')
    }

    const hasParserType = config.parser.parserType && config.parser.parserType.trim().length > 0

    if (!hasParserType) {
      errors.push('必须选择一个解析器策略类型（如: deepseek, moonshot, aihubmix等）')
    }

    if (config.monitoring.interval < 5) {
      errors.push('轮询间隔不能小于5秒')
    }

    if (config.thresholds.warning <= config.thresholds.danger) {
      errors.push('黄色警告阈值必须大于红色危险阈值')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 获取统计信息
  getStats(): { total: number; active: number; lastUpdate: string | null } {
    const configs = this.getAllConfigs()
    const active = configs.filter((c) => c.monitoring.enabled).length
    const lastUpdate =
      configs.length > 0
        ? configs.reduce(
            (latest, c) => {
              const time = new Date(c.updatedAt).getTime()
              return !latest || time > new Date(latest).getTime() ? c.updatedAt : latest
            },
            null as string | null
          )
        : null

    return {
      total: configs.length,
      active,
      lastUpdate
    }
  }
}
