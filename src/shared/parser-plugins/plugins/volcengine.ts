// 火山引擎解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class VolcEnginePlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.VOLCENGINE,
    name: '火山引擎余额解析器',
    description: '用于解析火山引擎 API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const result = response.Result || {}
    const availableBalance = parseFloat(result.AvailableBalance || 0)
    const cashBalance = parseFloat(result.CashBalance || 0)

    // 判断状态
    const status = this.determineStatus(availableBalance, 50, 10)

    return {
      currency: 'CNY',
      available_balance: availableBalance,
      cash_balance: cashBalance,
      status,
      last_updated: this.getCurrentTimestamp(),
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

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return (
      normalizedType === PARSER_STRATEGIES.VOLCENGINE ||
      normalizedType.includes('volcengine') ||
      normalizedType.includes('volcano') ||
      normalizedType.includes('火山')
    )
  }
}
