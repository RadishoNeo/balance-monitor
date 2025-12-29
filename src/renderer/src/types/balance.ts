// 使用共享的插件系统类型定义
import type { StandardBalance as SharedStandardBalance } from '@shared/parser-plugins'
export type { ParserPlugin } from '@shared/parser-plugins'

// 解析策略接口（兼容现有代码）
export interface BalanceParser {
  parse(response: any): SharedStandardBalance
  supports(vendor: string): boolean
}

// 重新导出 StandardBalance 类型
export type StandardBalance = SharedStandardBalance
// 厂商模板配置（与 BalanceMonitorConfig 接口对齐）
export interface VendorConfig {
  name: string
  logo: string // Logo图片路径，如 'src/assets/providers/deepseek.png'
  url: string
  method: 'GET' | 'POST'
  auth: {
    type: 'Basic' | 'Bearer' | 'APIKey'
    apiKey: string
    headerKey?: string
  }
  timeout?: number
  body?: any
  parser: {
    parserType: import('@shared/parser-types').ParserType
  }
  monitoring: {
    enabled: boolean
    interval: number // 秒 (与 MonitorScheduler 保持一致，虽然 UI 上可能显示分钟)
  }
  thresholds: {
    warning: number
    danger: number
  }
  isPreset?: boolean
}
