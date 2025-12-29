// 解析器插件系统导出
export * from './plugin-interface'
export * from './plugin-manager'

// 导出插件管理器单例
import { ParserPluginManager } from './plugin-manager'
export const parserPluginManager = ParserPluginManager.getInstance()

// 导出类型
export type {
  StandardBalance,
  ParsedBalance,
  ParserPlugin,
  ParserPluginMetadata
} from './plugin-interface'
