import { Logger } from './logger'

export interface BalanceInfoMapping {
  currency: string
  total_balance: string
  granted_balance?: string
  topped_up_balance?: string
}

export interface ParserConfig {
  balancePath?: string
  currencyPath?: string
  availablePath?: string
  isAvailablePath?: string
  balanceMappings?: BalanceInfoMapping[]
  customParser?: string
  parserType?: string
}

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
  parse(data: any): ParsedBalance;
  supports(type: string): boolean;
}

// 基础策略类
abstract class BaseStrategy implements IBalanceStrategy {
  abstract parse(data: any): ParsedBalance;
  abstract supports(type: string): boolean;

  protected standardizeCurrency(currency: string): string {
    const currencyMap: Record<string, string> = {
      '¥': 'CNY',
      '￥': 'CNY',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP'
    };
    return currencyMap[currency] || currency;
  }
}

// DeepSeek 策略
class DeepSeekStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const balanceInfo = response.balance_infos?.[0] || {};
    return {
      balance: parseFloat(balanceInfo.total_balance || 0),
      currency: this.standardizeCurrency(balanceInfo.currency || 'CNY'),
      isAvailable: response.is_available !== false,
      grantedBalance: parseFloat(balanceInfo.granted_balance || 0),
      toppedUpBalance: parseFloat(balanceInfo.topped_up_balance || 0),
      raw: response
    };
  }
  supports(type: string): boolean {
    return type.toLowerCase() === 'deepseek';
  }
}

// Moonshot 策略
class MoonshotStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const data = response.data || {};
    return {
      balance: parseFloat(data.available_balance || 0),
      currency: 'CNY',
      isAvailable: response.status !== false && parseFloat(data.available_balance || 0) > 0,
      grantedBalance: parseFloat(data.voucher_balance || 0),
      toppedUpBalance: parseFloat(data.cash_balance || 0),
      raw: response
    };
  }
  supports(type: string): boolean {
    return type.toLowerCase() === 'moonshot';
  }
}

// AIHubMix 策略
class AIHubMixStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const totalUsage = parseFloat(response.total_usage || 0);
    return {
      balance: totalUsage < 0 ? 999999 : totalUsage, // 负数代表无限
      currency: 'USD',
      isAvailable: totalUsage !== 0,
      raw: response
    };
  }
  supports(type: string): boolean {
    return type.toLowerCase() === 'aihubmix';
  }
}

// OpenRouter 策略
class OpenRouterStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const data = response.data || {};
    const totalCredits = parseFloat(data.total_credits || 0);
    const totalUsage = parseFloat(data.total_usage || 0);
    return {
      balance: totalCredits - totalUsage,
      currency: 'USD',
      isAvailable: (totalCredits - totalUsage) > 0,
      raw: response
    };
  }
  supports(type: string): boolean {
    return type.toLowerCase() === 'openrouter';
  }
}

// 火山引擎策略
class VolcEngineStrategy extends BaseStrategy {
  parse(response: any): ParsedBalance {
    const result = response.Result || {};
    return {
      balance: parseFloat(result.AvailableBalance || 0),
      currency: 'CNY',
      isAvailable: parseFloat(result.AvailableBalance || 0) > 0,
      raw: response
    };
  }
  supports(type: string): boolean {
    const t = type.toLowerCase();
    return t === 'volcengine' || t === 'volcano' || t === '火山';
  }
}

export class BalanceParser {
  private logger: Logger
  private strategies: IBalanceStrategy[] = [];

  constructor() {
    this.logger = new Logger('BalanceParser')
    this.strategies = [
      new DeepSeekStrategy(),
      new MoonshotStrategy(),
      new AIHubMixStrategy(),
      new OpenRouterStrategy(),
      new VolcEngineStrategy()
    ];
  }

  parse(data: any, config: ParserConfig): ParsedBalance {
    this.logger.debug(`[Parser] 开始解析数据. parserType: ${config.parserType || 'none'}`)

    // 1. 如果指定了 parserType，使用策略模式
    if (config.parserType) {
      const strategy = this.strategies.find(s => s.supports(config.parserType!));
      if (strategy) {
        this.logger.info(`[Parser] 使用策略: ${config.parserType}`)
        return strategy.parse(data);
      }
    }

    // 2. 兜底：原始解析逻辑 (为了兼容已有配置)
    try {
      if (!data) throw new Error('解析失败: API 响应数据为空')

      // 自定义解析器优先
      if (config.customParser && config.customParser.trim()) {
        return this.parseCustom(data, config.customParser)
      }

      // 字段映射逻辑
      if (config.balanceMappings && Array.isArray(config.balanceMappings) && config.balanceMappings.length > 0) {
        return this.parseByMappings(data, config)
      }

      // 传统单路径解析
      if (config.balancePath && config.balancePath.trim()) {
        return this.parseByPathRule(data, config)
      }

      throw new Error('未定义解析规则')
    } catch (error: any) {
      this.logger.error(`[Parser] 解析失败: ${error.message}`)
      throw error
    }
  }

  private parseByMappings(data: any, config: ParserConfig): ParsedBalance {
    let totalBalance = 0
    let grantedBalance = 0
    let toppedUpBalance = 0
    let currency = '¥'

    for (const mapping of config.balanceMappings!) {
      if (mapping.total_balance) {
        const val = this.getValueByPath(data, mapping.total_balance)
        totalBalance += this.convertToNumber(val)
      }
      if (mapping.granted_balance) {
        const val = this.getValueByPath(data, mapping.granted_balance)
        grantedBalance += this.convertToNumber(val)
      }
      if (mapping.topped_up_balance) {
        const val = this.getValueByPath(data, mapping.topped_up_balance)
        toppedUpBalance += this.convertToNumber(val)
      }
      if (mapping.currency && !currency) {
        const curVal = this.getValueByPath(data, mapping.currency)
        currency = curVal ? String(curVal) : mapping.currency
      }
    }

    return {
      balance: totalBalance,
      grantedBalance,
      toppedUpBalance,
      currency: currency || '¥',
      isAvailable: totalBalance > 0,
      raw: data
    }
  }

  private parseByPathRule(data: any, config: ParserConfig): ParsedBalance {
    const balanceVal = this.getValueByPath(data, config.balancePath!)
    const num = this.convertToNumber(balanceVal)
    let cur = '¥'
    if (config.currencyPath) {
      const v = this.getValueByPath(data, config.currencyPath)
      cur = v ? String(v) : '¥'
    }
    return {
      balance: num,
      currency: cur,
      isAvailable: num > 0,
      raw: data
    }
  }

  private convertToNumber(val: any): number {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.-]/g, '')
      return parseFloat(cleaned) || 0
    }
    return 0
  }

  private getValueByPath(data: any, path: string): any {
    if (!path || !data) return null
    const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) || []
    let current = data
    for (const token of tokens) {
      if (token.startsWith('[')) {
        current = current[parseInt(token.slice(1, -1))]
      } else {
        current = current[token]
      }
      if (current === undefined || current === null) return null
    }
    return current
  }

  private parseCustom(data: any, code: string): ParsedBalance {
    try {
      const fn = new Function('data', `
        "use strict";
        ${code}
        return result;
      `)
      const result = fn(data)
      return {
        balance: result.balance,
        currency: result.currency || '¥',
        isAvailable: result.isAvailable !== false,
        raw: data
      }
    } catch (e: any) {
      throw new Error(`自定义脚本执行失败: ${e.message}`)
    }
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
