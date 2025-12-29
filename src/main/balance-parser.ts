import { Logger } from './logger'
import { PARSER_STRATEGIES, type ParserConfig } from '../shared/parser-types'

export type { ParserType, ParserConfig } from '../shared/parser-types'

export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  grantedBalance?: number
  toppedUpBalance?: number
  raw?: any
}

// 策略接口
interface IBalanceStrategy {
  parse(data: any): ParsedBalance
  supports(type: string): boolean
}

// 基础策略类
abstract class BaseStrategy implements IBalanceStrategy {
  abstract parse(data: any): ParsedBalance
  abstract supports(type: string): boolean

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
}

// DeepSeek 策略
class DeepSeekStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const balanceInfo = response.balance_infos?.[0] || {}
    return {
      balance: parseFloat(balanceInfo.total_balance || 0),
      currency: this.standardizeCurrency(balanceInfo.currency || 'CNY'),
      isAvailable: response.is_available !== false,
      grantedBalance: parseFloat(balanceInfo.granted_balance || 0),
      toppedUpBalance: parseFloat(balanceInfo.topped_up_balance || 0),
      raw: response
    }
  }
  supports(type: string): boolean {
    return type.toLowerCase() === PARSER_STRATEGIES.DEEPSEEK
  }
}

// Moonshot 策略
class MoonshotStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const data = response.data || {}
    return {
      balance: parseFloat(data.available_balance || 0),
      currency: 'CNY',
      isAvailable: response.status !== false && parseFloat(data.available_balance || 0) > 0,
      grantedBalance: parseFloat(data.voucher_balance || 0),
      toppedUpBalance: parseFloat(data.cash_balance || 0),
      raw: response
    }
  }
  supports(type: string): boolean {
    return type.toLowerCase() === PARSER_STRATEGIES.MOONSHOT
  }
}

// AIHubMix 策略
class AIHubMixStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const totalUsage = parseFloat(response.total_usage || 0)
    return {
      balance: totalUsage < 0 ? 999999 : totalUsage, // 负数代表无限
      currency: 'USD',
      isAvailable: totalUsage !== 0,
      raw: response
    }
  }
  supports(type: string): boolean {
    return type.toLowerCase() === PARSER_STRATEGIES.AIHUBMIX
  }
}

// OpenRouter 策略
class OpenRouterStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const data = response.data || {}
    const totalCredits = parseFloat(data.total_credits || 0)
    const totalUsage = parseFloat(data.total_usage || 0)
    return {
      balance: totalCredits - totalUsage,
      currency: 'USD',
      isAvailable: totalCredits - totalUsage > 0,
      raw: response
    }
  }
  supports(type: string): boolean {
    return type.toLowerCase() === PARSER_STRATEGIES.OPENROUTER
  }
}

// 火山引擎策略
class VolcEngineStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const result = response.Result || {}
    return {
      balance: parseFloat(result.AvailableBalance || 0),
      currency: 'CNY',
      isAvailable: parseFloat(result.AvailableBalance || 0) > 0,
      raw: response
    }
  }
  supports(type: string): boolean {
    const t = type.toLowerCase()
    return t === PARSER_STRATEGIES.VOLCENGINE || t === 'volcano' || t === '火山'
  }
}

export class BalanceParser {
  private logger: Logger
  private strategies: IBalanceStrategy[] = []

  constructor() {
    this.logger = new Logger('BalanceParser')
    this.strategies = [
      new DeepSeekStrategy(),
      new MoonshotStrategy(),
      new AIHubMixStrategy(),
      new OpenRouterStrategy(),
      new VolcEngineStrategy()
    ]
  }

  parse(data: any, config: ParserConfig): ParsedBalance {
    this.logger.debug(`[Parser] 开始解析数据. parserType: ${config.parserType}`)

    if (!data) {
      throw new Error('解析失败: API 响应数据为空')
    }

    // 策略模式: 根据 parserType 选择对应的解析策略
    const strategy = this.strategies.find((s) => s.supports(config.parserType))
    if (strategy) {
      this.logger.info(`[Parser] 使用策略: ${config.parserType}`)
      return strategy.parse(data)
    }

    this.logger.error('[Parser] 未找到匹配的解析策略')
    throw new Error(`不支持的解析类型: ${config.parserType}. 请指定有效的 parserType`)
  }


  testParse(data: any, config: ParserConfig) {
    try {
      const result = this.parse(data, config)
      return { success: true, result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
