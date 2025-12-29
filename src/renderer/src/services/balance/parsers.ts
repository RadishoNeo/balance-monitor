import { StandardBalance, BalanceParser } from '../../types/balance'

// 基础解析器
export abstract class BaseBalanceParser implements BalanceParser {
  abstract parse(response: any): StandardBalance
  abstract supports(vendor: string): boolean

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

// DeepSeek 解析器
export class DeepSeekParser extends BaseBalanceParser {
  parse(response: any): StandardBalance {
    const balanceInfo = response.balance_infos?.[0] || {}

    return {
      currency: this.standardizeCurrency(balanceInfo.currency || 'CNY'),
      available_balance: parseFloat(balanceInfo.total_balance || 0),
      total_balance: parseFloat(balanceInfo.total_balance || 0),
      granted_balance: parseFloat(balanceInfo.granted_balance || 0),
      topped_up_balance: parseFloat(balanceInfo.topped_up_balance || 0),
      status: response.is_available ? 'active' : 'inactive',
      last_updated: new Date().toISOString(),
      meta: {
        original_response: response,
        is_available: response.is_available
      }
    }
  }

  supports(vendor: string): boolean {
    return vendor.toLowerCase().includes('deepseek')
  }
}

// Moonshot 解析器
export class MoonshotParser extends BaseBalanceParser {
  parse(response: any): StandardBalance {
    const data = response.data || {}
    const availableBalance = parseFloat(data.available_balance || 0)

    let status: StandardBalance['status'] = 'active'
    if (availableBalance <= 0) status = 'inactive'
    else if (availableBalance <= 10) status = 'danger'
    else if (availableBalance <= 50) status = 'warning'

    return {
      currency: this.standardizeCurrency('CNY'),
      available_balance: availableBalance,
      cash_balance: parseFloat(data.cash_balance || 0),
      voucher_balance: parseFloat(data.voucher_balance || 0),
      status,
      last_updated: new Date().toISOString(),
      meta: {
        original_response: response,
        code: response.code,
        scode: response.scode,
        status: response.status
      }
    }
  }

  supports(vendor: string): boolean {
    return vendor.toLowerCase().includes('moonshot')
  }
}

// AIHubMix 解析器
export class AIHubMixParser extends BaseBalanceParser {
  parse(response: any): StandardBalance {
    const totalUsage = parseFloat(response.total_usage || 0)

    let availableBalance = totalUsage
    let status: StandardBalance['status'] = 'active'

    // 根据文档，负值代表无限额度
    if (totalUsage < 0) {
      availableBalance = Infinity
    } else if (totalUsage === 0) {
      status = 'inactive'
    }

    return {
      currency: 'USD',
      available_balance: availableBalance,
      total_usage: totalUsage,
      status,
      last_updated: new Date().toISOString(),
      meta: {
        original_response: response,
        object: response.object,
        is_unlimited: totalUsage < 0
      }
    }
  }

  supports(vendor: string): boolean {
    return vendor.toLowerCase().includes('aihubmix')
  }
}

// OpenRouter 解析器
export class OpenRouterParser extends BaseBalanceParser {
  parse(response: any): StandardBalance {
    const data = response.data || {}
    const totalCredits = parseFloat(data.total_credits || 0)
    const totalUsage = parseFloat(data.total_usage || 0)
    const availableBalance = totalCredits - totalUsage

    let status: StandardBalance['status'] = 'active'
    if (availableBalance <= 0) status = 'inactive'
    else if (availableBalance <= 10) status = 'danger'
    else if (availableBalance <= 50) status = 'warning'

    return {
      currency: 'USD',
      available_balance: availableBalance,
      total_credits: totalCredits,
      total_usage: totalUsage,
      status,
      last_updated: new Date().toISOString(),
      meta: {
        original_response: response
      }
    }
  }

  supports(vendor: string): boolean {
    return vendor.toLowerCase().includes('openrouter')
  }
}

// 火山引擎解析器
export class VolcEngineParser extends BaseBalanceParser {
  parse(response: any): StandardBalance {
    const result = response.Result || {}
    const availableBalance = parseFloat(result.AvailableBalance || 0)
    const cashBalance = parseFloat(result.CashBalance || 0)

    let status: StandardBalance['status'] = 'active'
    if (availableBalance <= 0) status = 'inactive'
    else if (availableBalance <= 10) status = 'danger'
    else if (availableBalance <= 50) status = 'warning'

    return {
      currency: 'CNY',
      available_balance: availableBalance,
      cash_balance: cashBalance,
      status,
      last_updated: new Date().toISOString(),
      meta: {
        original_response: response,
        account_id: result.AccountID,
        arrears_balance: result.ArrearsBalance,
        credit_limit: result.CreditLimit,
        freeze_amount: result.FreezeAmount,
        response_metadata: response.ResponseMetadata
      }
    }
  }

  supports(vendor: string): boolean {
    const v = vendor.toLowerCase()
    return v.includes('volcengine') || v.includes('volcano') || v.includes('火山')
  }
}

// 解析器工厂
export class BalanceParserFactory {
  private parsers: BalanceParser[] = []

  constructor() {
    this.registerParsers()
  }

  private registerParsers() {
    this.parsers.push(
      new DeepSeekParser(),
      new MoonshotParser(),
      new AIHubMixParser(),
      new OpenRouterParser(),
      new VolcEngineParser()
    )
  }

  getParser(vendor: string): BalanceParser {
    const parser = this.parsers.find((p) => p.supports(vendor))
    if (!parser) {
      throw new Error(`No parser found for vendor: ${vendor}`)
    }
    return parser
  }

  registerCustomParser(parser: BalanceParser) {
    this.parsers.push(parser)
  }
}
