// PPIO 解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class PPIOPlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.PPIO,
    name: 'PPIO 余额解析器',
    description: '用于解析 PPIO API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const creditBalance = parseFloat(response.credit_balance || 0)

    // 判断状态
    const status = this.determineStatus(creditBalance, 50, 10)

    return {
      currency: 'CNY',
      available_balance: creditBalance,
      status,
      last_updated: this.getCurrentTimestamp(),
      meta: {
        original_response: response,
        credit_balance: creditBalance
      }
    }
  }

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return normalizedType === PARSER_STRATEGIES.PPIO || normalizedType.includes('ppio')
  }
}
