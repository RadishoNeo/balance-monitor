// 标准化余额信息接口
export interface StandardBalance {
  currency: string // 货币代码
  available_balance: number // 可用余额（标准化后的总余额）
  total_balance?: number // 总余额（可选）
  granted_balance?: number // 赠送余额（可选）
  topped_up_balance?: number // 充值余额（可选）
  cash_balance?: number // 现金余额（可选）
  voucher_balance?: number // 代金券余额（可选）
  total_credits?: number // 总积分/额度（可选）
  total_usage?: number // 已使用额度（可选）
  status: 'active' | 'inactive' | 'warning' | 'danger'
  last_updated: string
  meta: Record<string, any> // 原始数据和其他厂商特有字段
}

// 解析策略接口
export interface BalanceParser {
  parse(response: any): StandardBalance
  supports(vendor: string): boolean
}
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
