// 渲染进程解析器服务 - 使用插件系统
import {
  parserPluginManager,
  type StandardBalance,
  type ParserPlugin
} from '@shared/parser-plugins'
import type { BalanceParser as IBalanceParser } from '../../types/balance'

// 兼容性包装器，实现原有的 BalanceParser 接口
class PluginBalanceParser implements IBalanceParser {
  private plugin: ParserPlugin

  constructor(plugin: ParserPlugin) {
    this.plugin = plugin
  }

  parse(response: any): StandardBalance {
    return this.plugin.parse(response)
  }

  supports(vendor: string): boolean {
    return this.plugin.supports(vendor)
  }
}

// 解析器工厂（兼容现有代码）
export class BalanceParserFactory {
  private initialized = false

  // 初始化插件管理器
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return

    try {
      await parserPluginManager.initialize()
      this.initialized = true
      console.log('[BalanceParserFactory] 插件管理器初始化完成')
    } catch (error) {
      console.error('[BalanceParserFactory] 插件管理器初始化失败:', error)
      throw error
    }
  }

  // 获取解析器
  async getParser(vendor: string): Promise<IBalanceParser> {
    await this.ensureInitialized()

    const plugin = parserPluginManager.findPluginByType(vendor)
    if (!plugin) {
      throw new Error(`未找到支持的解析器插件: ${vendor}`)
    }

    return new PluginBalanceParser(plugin)
  }

  // 获取所有支持的厂商类型
  async getSupportedVendors(): Promise<string[]> {
    await this.ensureInitialized()
    return parserPluginManager.getSupportedTypes()
  }

  // 检查是否支持某个厂商
  async supportsVendor(vendor: string): Promise<boolean> {
    await this.ensureInitialized()
    return parserPluginManager.supportsType(vendor)
  }

  // 直接解析数据（便捷方法）
  async parse(response: any, vendor: string): Promise<StandardBalance> {
    await this.ensureInitialized()
    return parserPluginManager.parse(response, vendor as any)
  }

  // 获取插件元数据
  async getPluginMetadata() {
    await this.ensureInitialized()
    return parserPluginManager.getPluginMetadataList()
  }
}
