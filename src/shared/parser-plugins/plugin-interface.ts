// 解析器插件接口定义
// ParserType 类型在类型定义中使用，但不需要显式导入

// 标准化余额信息接口（统一主进程和渲染进程）
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

// 主进程使用的简化接口（兼容现有代码）
export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  grantedBalance?: number
  toppedUpBalance?: number
  raw?: any
}

// 解析器插件元数据
export interface ParserPluginMetadata {
  id: string // 插件ID，对应 PARSER_STRATEGIES 中的值
  name: string // 插件显示名称
  description?: string // 插件描述
  version: string // 插件版本
  author?: string // 作者
}

// 解析器插件接口
export interface ParserPlugin {
  metadata: ParserPluginMetadata

  // 解析API响应为标准化余额信息
  parse(response: any): StandardBalance

  // 检查是否支持该厂商/类型
  supports(type: string): boolean

  // 转换为主进程使用的简化格式（可选）
  toParsedBalance?(standardBalance: StandardBalance): ParsedBalance
}

// 抽象基类，提供通用功能
export abstract class BaseParserPlugin implements ParserPlugin {
  abstract metadata: ParserPluginMetadata
  abstract parse(response: any): StandardBalance
  abstract supports(type: string): boolean

  // 货币标准化
  protected standardizeCurrency(currency: string): string {
    const currencyMap: Record<string, string> = {
      '¥': 'CNY',
      '￥': 'CNY',
      $: 'USD',
      '€': 'EUR',
      '£': 'GBP'
    }
    return currencyMap[currency] || currency
  }

  // 默认的转换方法
  toParsedBalance(standardBalance: StandardBalance): ParsedBalance {
    return {
      balance: standardBalance.available_balance,
      currency: standardBalance.currency,
      isAvailable: standardBalance.status === 'active',
      grantedBalance: standardBalance.granted_balance,
      toppedUpBalance: standardBalance.topped_up_balance,
      raw: standardBalance.meta?.original_response
    }
  }

  // 状态判断辅助方法
  protected determineStatus(
    balance: number,
    warningThreshold = 50,
    dangerThreshold = 10
  ): StandardBalance['status'] {
    if (balance <= 0) return 'inactive'
    if (balance <= dangerThreshold) return 'danger'
    if (balance <= warningThreshold) return 'warning'
    return 'active'
  }

  // 获取当前时间戳
  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}
