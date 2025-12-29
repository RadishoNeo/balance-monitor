// 解析器插件管理器
import type {
  ParserPlugin,
  ParserPluginMetadata,
  StandardBalance,
  ParsedBalance
} from './plugin-interface'
import { type ParserType } from '../parser-types'

export class ParserPluginManager {
  private plugins: Map<string, ParserPlugin> = new Map()
  private initialized = false

  // 单例模式
  private static instance: ParserPluginManager
  static getInstance(): ParserPluginManager {
    if (!ParserPluginManager.instance) {
      ParserPluginManager.instance = new ParserPluginManager()
    }
    return ParserPluginManager.instance
  }

  // 私有构造函数
  private constructor() {}

  // 初始化插件管理器
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 动态加载插件目录中的所有插件
      await this.loadPluginsFromDirectory()
      this.initialized = true
      console.log(`[ParserPluginManager] 初始化完成，加载了 ${this.plugins.size} 个插件`)
    } catch (error) {
      console.error('[ParserPluginManager] 初始化失败:', error)
      throw error
    }
  }

  // 从目录加载插件（使用静态导入）
  private async loadPluginsFromDirectory(): Promise<void> {
    console.log('[ParserPluginManager] 开始加载插件...')

    try {
      // 使用插件加载器获取所有插件
      const { getAllPlugins } = await import('./plugin-loader')
      const plugins = getAllPlugins()

      // 注册所有插件
      this.registerPlugins(plugins)
      console.log(`[ParserPluginManager] 成功加载 ${plugins.length} 个插件`)
    } catch (error) {
      console.error('[ParserPluginManager] 加载插件失败:', error)
      throw error
    }
  }

  // 注册插件
  registerPlugin(plugin: ParserPlugin): void {
    const pluginId = plugin.metadata.id

    if (this.plugins.has(pluginId)) {
      console.warn(`[ParserPluginManager] 插件 ${pluginId} 已存在，将被覆盖`)
    }

    this.plugins.set(pluginId, plugin)
    console.log(`[ParserPluginManager] 注册插件: ${plugin.metadata.name} (${pluginId})`)
  }

  // 批量注册插件
  registerPlugins(plugins: ParserPlugin[]): void {
    plugins.forEach((plugin) => this.registerPlugin(plugin))
  }

  // 获取插件
  getPlugin(pluginId: string): ParserPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  // 根据类型查找支持的插件
  findPluginByType(type: string): ParserPlugin | undefined {
    const normalizedType = type.toLowerCase()

    // 首先尝试精确匹配
    for (const plugin of this.plugins.values()) {
      if (plugin.supports(normalizedType)) {
        return plugin
      }
    }

    // 如果没有找到，尝试模糊匹配（包含关系）
    for (const plugin of this.plugins.values()) {
      const pluginId = plugin.metadata.id.toLowerCase()
      if (normalizedType.includes(pluginId) || pluginId.includes(normalizedType)) {
        return plugin
      }
    }

    return undefined
  }

  // 解析数据（使用插件）
  parse(response: any, parserType: ParserType): StandardBalance {
    const plugin = this.findPluginByType(parserType)

    if (!plugin) {
      throw new Error(`未找到支持的解析器插件: ${parserType}`)
    }

    try {
      return plugin.parse(response)
    } catch (error) {
      throw new Error(
        `解析失败 (${plugin.metadata.name}): ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // 解析数据并转换为主进程格式
  parseForMainProcess(response: any, parserType: ParserType): ParsedBalance {
    const standardBalance = this.parse(response, parserType)
    const plugin = this.findPluginByType(parserType)

    if (!plugin) {
      throw new Error(`未找到插件: ${parserType}`)
    }

    // 使用插件的转换方法，如果不存在则使用默认方法
    if (plugin.toParsedBalance) {
      return plugin.toParsedBalance(standardBalance)
    } else {
      // 使用基类的默认转换方法
      const basePlugin = plugin as any
      if (typeof basePlugin.toParsedBalance === 'function') {
        return basePlugin.toParsedBalance(standardBalance)
      }

      // 最后的手段：手动转换
      return {
        balance: standardBalance.available_balance,
        currency: standardBalance.currency,
        isAvailable: standardBalance.status === 'active',
        grantedBalance: standardBalance.granted_balance,
        toppedUpBalance: standardBalance.topped_up_balance,
        raw: standardBalance.meta?.original_response
      }
    }
  }

  // 获取所有插件
  getAllPlugins(): ParserPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取插件元数据列表
  getPluginMetadataList(): ParserPluginMetadata[] {
    return this.getAllPlugins().map((plugin) => plugin.metadata)
  }

  // 检查是否支持某个类型
  supportsType(type: string): boolean {
    return this.findPluginByType(type) !== undefined
  }

  // 获取支持的解析器类型列表
  getSupportedTypes(): string[] {
    return Array.from(this.plugins.keys())
  }

  // 清空所有插件（主要用于测试）
  clearPlugins(): void {
    this.plugins.clear()
    this.initialized = false
  }
}
