// DeepSeek 解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class DeepSeekPlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.DEEPSEEK,
    name: 'DeepSeek 余额解析器',
    description: '用于解析 DeepSeek API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const balanceInfo = response.balance_infos?.[0] || {}

    const totalBalance = parseFloat(balanceInfo.total_balance || 0)
    const grantedBalance = parseFloat(balanceInfo.granted_balance || 0)
    const toppedUpBalance = parseFloat(balanceInfo.topped_up_balance || 0)

    // 计算可用余额（总余额）
    const availableBalance = totalBalance

    // 判断状态
    let status: StandardBalance['status'] = 'active'
    if (availableBalance <= 0) {
      status = 'inactive'
    } else if (availableBalance <= 10) {
      status = 'danger'
    } else if (availableBalance <= 50) {
      status = 'warning'
    }

    // 如果API明确返回不可用状态，则覆盖
    if (response.is_available === false) {
      status = 'inactive'
    }

    return {
      currency: this.standardizeCurrency(balanceInfo.currency || 'CNY'),
      available_balance: availableBalance,
      total_balance: totalBalance,
      granted_balance: grantedBalance,
      topped_up_balance: toppedUpBalance,
      status,
      last_updated: this.getCurrentTimestamp(),
      meta: {
        original_response: response,
        is_available: response.is_available,
        balance_info: balanceInfo
      }
    }
  }

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return (
      normalizedType === PARSER_STRATEGIES.DEEPSEEK ||
      normalizedType.includes('deepseek') ||
      normalizedType.includes('深度求索')
    )
  }
}
