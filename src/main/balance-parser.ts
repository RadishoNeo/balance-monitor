import { Logger } from './logger'
import { type ParserConfig } from '../shared/parser-types'
import { parserPluginManager, type ParsedBalance } from '../shared/parser-plugins'

export type { ParserType, ParserConfig } from '../shared/parser-types'
export type { ParsedBalance } from '../shared/parser-plugins'

export class BalanceParser {
  private logger: Logger
  private initialized = false

  constructor() {
    this.logger = new Logger('BalanceParser')
  }

  // 初始化插件管理器
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    try {
      await parserPluginManager.initialize()
      this.initialized = true
      this.logger.info('[BalanceParser] 插件管理器初始化完成')
    } catch (error) {
      this.logger.error(`[BalanceParser] 插件管理器初始化失败: ${error}`)
      throw error
    }
  }

  // 解析数据
  async parse(data: any, config: ParserConfig): Promise<ParsedBalance> {
    await this.ensureInitialized()

    this.logger.debug(`[Parser] 开始解析数据. parserType: ${config.parserType}`)

    if (!data) {
      throw new Error('解析失败: API 响应数据为空')
    }

    try {
      // 使用插件管理器解析数据
      const result = parserPluginManager.parseForMainProcess(data, config.parserType)
      this.logger.info(`[Parser] 使用插件解析成功: ${config.parserType}`)
      return result
    } catch (error) {
      this.logger.error(`[Parser] 解析失败 (${config.parserType}): ${error}`)
      throw new Error(`解析失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // 测试解析
  async testParse(data: any, config: ParserConfig) {
    try {
      const result = await this.parse(data, config)
      return { success: true, result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  // 获取支持的解析器类型列表
  async getSupportedTypes(): Promise<string[]> {
    await this.ensureInitialized()
    return parserPluginManager.getSupportedTypes()
  }

  // 检查是否支持某个类型
  async supportsType(type: string): Promise<boolean> {
    await this.ensureInitialized()
    return parserPluginManager.supportsType(type)
  }

  // 获取插件元数据列表
  async getPluginMetadata() {
    await this.ensureInitialized()
    return parserPluginManager.getPluginMetadataList()
  }
}
