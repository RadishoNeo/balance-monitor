// OpenRouter 解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class OpenRouterPlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.OPENROUTER,
    name: 'OpenRouter 余额解析器',
    description: '用于解析 OpenRouter API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const data = response.data || {}
    const totalCredits = parseFloat(data.total_credits || 0)
    const totalUsage = parseFloat(data.total_usage || 0)
    const availableBalance = totalCredits - totalUsage

    // 判断状态
    const status = this.determineStatus(availableBalance, 50, 10)

    return {
      currency: 'USD',
      available_balance: availableBalance,
      total_credits: totalCredits,
      total_usage: totalUsage,
      status,
      last_updated: this.getCurrentTimestamp(),
      meta: {
        original_response: response,
        data: data
      }
    }
  }

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return (
      normalizedType === PARSER_STRATEGIES.OPENROUTER ||
      normalizedType.includes('openrouter') ||
      normalizedType.includes('open router')
    )
  }
}
