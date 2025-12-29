// AIHubMix 解析器插件
import { BaseParserPlugin, type StandardBalance } from '../plugin-interface'
import { PARSER_STRATEGIES } from '../../parser-types'

export class AIHubMixPlugin extends BaseParserPlugin {
  metadata = {
    id: PARSER_STRATEGIES.AIHUBMIX,
    name: 'AIHubMix 余额解析器',
    description: '用于解析 AIHubMix API 余额响应的插件',
    version: '1.0.0',
    author: 'Balance Monitor Team'
  }

  parse(response: any): StandardBalance {
    const totalUsage = parseFloat(response.total_usage || 0)

    let availableBalance = totalUsage
    let status: StandardBalance['status'] = 'active'

    // 根据文档，负值代表无限额度
    if (totalUsage < 0) {
      availableBalance = Infinity
      status = 'active' // 无限额度视为活跃
    } else if (totalUsage === 0) {
      status = 'inactive'
    } else {
      // 对于正数，使用标准状态判断
      status = this.determineStatus(totalUsage, 50, 10)
    }

    return {
      currency: 'USD',
      available_balance: availableBalance,
      total_usage: totalUsage,
      status,
      last_updated: this.getCurrentTimestamp(),
      meta: {
        original_response: response,
        object: response.object,
        is_unlimited: totalUsage < 0
      }
    }
  }

  supports(type: string): boolean {
    const normalizedType = type.toLowerCase()
    return (
      normalizedType === PARSER_STRATEGIES.AIHUBMIX ||
      normalizedType.includes('aihubmix') ||
      normalizedType.includes('ai hub mix')
    )
  }
}
