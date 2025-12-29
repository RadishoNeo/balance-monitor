// Moonshot 解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class MoonshotPlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.MOONSHOT,
    name: 'Moonshot 余额解析器',
    description: '用于解析 Moonshot API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const data = response.data || {}
    const availableBalance = parseFloat(data.available_balance || 0)
    const cashBalance = parseFloat(data.cash_balance || 0)
    const voucherBalance = parseFloat(data.voucher_balance || 0)

    // 判断状态
    const status = this.determineStatus(availableBalance, 50, 10)

    // 如果API返回错误状态，则覆盖
    if (response.status === false || response.code !== 0) {
      return {
        currency: 'CNY',
        available_balance: 0,
        cash_balance: 0,
        voucher_balance: 0,
        status: 'inactive',
        last_updated: this.getCurrentTimestamp(),
        meta: {
          original_response: response,
          code: response.code,
          scode: response.scode,
          status: response.status,
          message: response.message
        }
      }
    }

    return {
      currency: 'CNY',
      available_balance: availableBalance,
      cash_balance: cashBalance,
      voucher_balance: voucherBalance,
      status,
      last_updated: this.getCurrentTimestamp(),
      meta: {
        original_response: response,
        code: response.code,
        scode: response.scode,
        status: response.status,
        data: data
      }
    }
  }

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return (
      normalizedType === PARSER_STRATEGIES.MOONSHOT ||
      normalizedType.includes('moonshot') ||
      normalizedType.includes('月之暗面')
    )
  }
}
