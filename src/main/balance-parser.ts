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
}

export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  grantedBalance?: number
  toppedUpBalance?: number
  raw?: any
}

export class BalanceParser {
  private logger: Logger

  constructor() {
    this.logger = new Logger('BalanceParser')
  }

  parse(data: any, config: ParserConfig): ParsedBalance {
    this.logger.debug(
      `[Parser] 开始解析数据. 数据类型: ${typeof data}, 顶级键: ${data ? Object.keys(data).join(', ') : 'null'}`
    )
    this.logger.debug(`[Parser] 使用配置: ${JSON.stringify(config)}`)

    try {
      if (!data) {
        throw new Error('解析失败: API 响应数据为空')
      }

      // 1. 自定义解析器优先
      if (config.customParser && config.customParser.trim()) {
        this.logger.info('[Parser] 使用自定义 JS 解析器')
        return this.parseCustom(data, config.customParser)
      }

      // 2. 字段映射逻辑 (Modern Mappings)
      if (
        config.balanceMappings &&
        Array.isArray(config.balanceMappings) &&
        config.balanceMappings.length > 0
      ) {
        this.logger.info('[Parser] 使用字段映射逻辑 (Modern Mappings)')
        let totalBalance = 0
        let grantedBalance = 0
        let toppedUpBalance = 0
        let currency = ''
        let hasFoundBalance = false

        for (const mapping of config.balanceMappings) {
          // 2.1 解析余额路径 (总额、赠送、充值)
          if (mapping.total_balance) {
            try {
              const val = this.parseByPath(data, mapping.total_balance)
              const num = this.convertToNumber(val)
              if (!isNaN(num)) {
                totalBalance += num
                hasFoundBalance = true
                this.logger.debug(`[Parser] 从路径 [${mapping.total_balance}] 提取到总余额: ${num}`)
              }
            } catch (e) {
              this.logger.warn(`[Parser] 总余额路径 [${mapping.total_balance}] 解析失败: ${e}`)
            }
          }

          if (mapping.granted_balance) {
            try {
              const val = this.parseByPath(data, mapping.granted_balance)
              const num = this.convertToNumber(val)
              if (!isNaN(num)) {
                grantedBalance += num
                this.logger.debug(`[Parser] 从路径 [${mapping.granted_balance}] 提取到赠送余额: ${num}`)
              }
            } catch {
              // 赠送余额解析失败不影响主流程
            }
          }

          if (mapping.topped_up_balance) {
            try {
              const val = this.parseByPath(data, mapping.topped_up_balance)
              const num = this.convertToNumber(val)
              if (!isNaN(num)) {
                toppedUpBalance += num
                this.logger.debug(`[Parser] 从路径 [${mapping.topped_up_balance}] 提取到充值余额: ${num}`)
              }
            } catch {
              // 充值余额解析失败不影响主流程
            }
          }

          // 2.2 解析币种 (优先解析路径，解析不到则视为字面量)
          if (!currency && mapping.currency) {
            try {
              const looksLikePath = mapping.currency.includes('.') || mapping.currency.includes('[')
              if (looksLikePath) {
                const curVal = this.parseByPath(data, mapping.currency)
                if (curVal) {
                  currency = String(curVal)
                }
              }
            } catch {
              // 忽略错误，后面会有字面量兜底
            }

            if (!currency) {
              currency = mapping.currency
            }
          }
        }

        if (!hasFoundBalance) {
          throw new Error(
            '解析失败: 无法在提供的所有映射路径中找到有效的余额数字。请验证 API 响应结构与映射路径配置是否一致。'
          )
        }

        // 2.3 解析可用性
        const availablePath = config.isAvailablePath || config.availablePath
        let isAvailable = true
        if (availablePath) {
          try {
            const availVal = this.parseByPath(data, availablePath)
            isAvailable =
              availVal === true ||
              availVal === 'true' ||
              availVal === 1 ||
              availVal === '1' ||
              availVal === 'active' ||
              availVal === 'success' ||
              availVal === 'ok'
          } catch {
            // 可用性解析失败默认为 true
          }
        }

        return {
          balance: totalBalance,
          grantedBalance: hasFoundBalance ? grantedBalance : undefined,
          toppedUpBalance: hasFoundBalance ? toppedUpBalance : undefined,
          currency: currency || '¥',
          isAvailable,
          raw: data
        }
      }

      // 3. 传统单路径解析回退
      if (config.balancePath && config.balancePath.trim()) {
        this.logger.info(`[Parser] 使用传统单路径解析: ${config.balancePath}`)
        const balanceVal = this.parseByPath(data, config.balancePath)
        const num = this.convertToNumber(balanceVal)

        if (isNaN(num)) {
          const type = balanceVal === null ? 'null' : typeof balanceVal
          const snippet =
            typeof balanceVal === 'object'
              ? JSON.stringify(balanceVal).substring(0, 50)
              : String(balanceVal)
          throw new Error(
            `解析失败: 路径 [${config.balancePath}] 返回的值不是有效数字 (得到类型: ${type}, 值: ${snippet})`
          )
        }

        let cur = '¥'
        if (config.currencyPath) {
          try {
            const v = this.parseByPath(data, config.currencyPath)
            if (v) cur = String(v)
          } catch {
            cur = config.currencyPath
          }
        }

        const availPath = config.availablePath || config.isAvailablePath
        let avail = true
        if (availPath) {
          try {
            const v = this.parseByPath(data, availPath)
            avail = v !== false && v !== 'false' && v !== 0 && v !== '0'
          } catch {
            // ignore
          }
        }

        return {
          balance: num,
          currency: cur,
          isAvailable: avail,
          raw: data
        }
      }

      throw new Error(
        `解析失败: 配置中未定义任何解析规则。收到配置包含的字段: ${Object.keys(config).join(', ') || '无'}`
      )
    } catch (error: any) {
      this.logger.error(`[Parser] 解析过程发生致命错误: ${error.message}`)
      throw error
    }
  }

  private convertToNumber(val: any): number {
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.-]/g, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? NaN : num
    }
    return NaN
  }

  private parseByPath(data: any, path: string): any {
    if (!path || !data) return null

    const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) || []
    let current = data

    for (const token of tokens) {
      if (token.startsWith('[')) {
        const index = parseInt(token.slice(1, -1))
        if (!Array.isArray(current)) {
          throw new Error(`路径错误: 在非数组字段上尝试访问索引 ${token}`)
        }
        current = current[index]
      } else {
        if (current === null || typeof current !== 'object') {
          throw new Error(`路径错误: 无法在非对象字段上访问属性 "${token}"`)
        }
        current = current[token]
      }

      if (current === undefined) {
        throw new Error(`路径错误: 字段 "${token}" 不存在`)
      }
    }

    return current
  }

  private parseCustom(data: any, code: string): ParsedBalance {
    const sandbox = {
      data,
      Math,
      Number,
      parseFloat,
      parseInt,
      Array,
      Object,
      console
    }

    const wrapped = `
      "use strict";
      ${code}
      if (typeof result === 'undefined') throw new Error('自定义脚本必须返回 result 变量');
      return result;
    `

    try {
      const fn = new Function(...Object.keys(sandbox), wrapped)
      const result = fn(...Object.values(sandbox))

      if (!result || typeof result.balance !== 'number') {
        throw new Error('脚本返回值格式错误 (必须包含 balance: number)')
      }

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
