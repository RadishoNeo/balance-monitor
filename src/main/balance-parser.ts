import { Logger } from './logger'

export interface ParserConfig {
  balancePath: string
  currencyPath?: string
  availablePath?: string
  customParser?: string
}

export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  raw?: any
}

export class BalanceParser {
  private logger: Logger

  constructor() {
    this.logger = new Logger('BalanceParser')
  }

  parse(data: any, config: ParserConfig): ParsedBalance {
    try {
      // 如果有自定义解析器，优先使用
      if (config.customParser && config.customParser.trim()) {
        return this.parseCustom(data, config.customParser)
      }

      // 使用JSON路径解析
      const balance = this.parseByPath(data, config.balancePath)
      const currency = config.currencyPath ? this.parseByPath(data, config.currencyPath) : '¥'
      const isAvailable = config.availablePath ? this.parseByPath(data, config.availablePath) : true

      if (typeof balance !== 'number') {
        throw new Error(`解析失败: 余额字段不是数字 (得到: ${typeof balance})`)
      }

      return {
        balance,
        currency: String(currency || '¥'),
        isAvailable: Boolean(isAvailable),
        raw: data
      }
    } catch (error) {
      this.logger.error(`解析错误: ${error}`)
      throw error
    }
  }

  private parseByPath(data: any, path: string): any {
    if (!path || !data) return null

    // 支持的路径格式:
    // - "balance"
    // - "user.balance"
    // - "balance_infos[0].total_balance"
    // - "data.items[0].value"

    const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) || []
    let result = data

    for (const token of tokens) {
      if (token.startsWith('[')) {
        // 数组索引
        const index = parseInt(token.slice(1, -1))
        if (!Array.isArray(result)) {
          throw new Error(`路径错误: ${token} 期望数组但得到 ${typeof result}`)
        }
        if (index >= result.length) {
          throw new Error(`数组越界: 索引 ${index} 超出长度 ${result.length}`)
        }
        result = result[index]
      } else {
        // 对象属性
        if (result === null || typeof result !== 'object') {
          throw new Error(`路径错误: 无法访问属性 "${token}"`)
        }
        result = result[token]
      }

      if (result === undefined) {
        throw new Error(`路径错误: 未找到 "${token}"`)
      }
    }

    return result
  }

  private parseCustom(data: any, customCode: string): ParsedBalance {
    // 创建安全的执行环境
    const sandbox = {
      data,
      Math,
      Number,
      parseFloat,
      parseInt,
      Array,
      Object,
      console: {
        log: (...args: any[]) => {
          this.logger.debug(`自定义解析器日志: ${args.map((a) => String(a)).join(' ')}`)
        }
      }
    }

    // 包装用户代码，添加安全限制
    const wrappedCode = `
      "use strict";
      // 禁止访问危险全局对象
      const window = undefined;
      const document = undefined;
      const global = undefined;
      const process = undefined;
      const require = undefined;
      const module = undefined;
      const exports = undefined;
      const Function = undefined;
      const eval = undefined;

      // 用户代码
      ${customCode}

      // 必须返回一个对象
      if (typeof result === 'undefined') {
        throw new Error('自定义解析器必须定义 result 变量');
      }
      return result;
    `

    try {
      const fn = new Function(...Object.keys(sandbox), wrappedCode)
      const result = fn(...Object.values(sandbox))

      // 验证返回结果
      if (typeof result !== 'object' || result === null) {
        throw new Error(
          '自定义解析器必须返回对象 { balance: number, currency?: string, isAvailable?: boolean }'
        )
      }

      if (typeof result.balance !== 'number') {
        throw new Error(`自定义解析器返回的 balance 必须是数字，得到: ${typeof result.balance}`)
      }

      return {
        balance: result.balance,
        currency: result.currency || '¥',
        isAvailable: result.isAvailable !== false,
        raw: data
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`自定义解析器执行错误: ${error.message}`)
      }
      throw new Error(`自定义解析器执行错误: ${String(error)}`)
    }
  }

  // 用于测试解析器配置
  testParse(
    data: any,
    config: ParserConfig
  ): { success: boolean; result?: ParsedBalance; error?: string } {
    try {
      const result = this.parse(data, config)
      return { success: true, result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // 生成示例代码
  generateExampleCode(data: any): string {
    const example = `// 示例：从复杂数据中提取余额
// 原始数据: ${JSON.stringify(data, null, 2).substring(0, 100)}...

// 方法1: 简单路径
// balancePath: "balance"

// 方法2: 嵌套路径
// balancePath: "user.account.balance"

// 方法3: 数组路径
// balancePath: "balance_infos[0].total_balance"

// 方法4: 自定义解析器
// 如果需要复杂逻辑，使用自定义解析器:

// 示例1: 多币种转换
const result = {
  balance: data.balance_cny + data.balance_usd * 7.2,
  currency: "CNY",
  isAvailable: data.is_active
};

// 示例2: 条件逻辑
const result = {
  balance: data.balances.find(b => b.currency === 'CNY')?.amount || 0,
  currency: "CNY",
  isAvailable: data.status === 'active'
};

// 示例3: 计算总和
const result = {
  balance: data.balances.reduce((sum, b) => sum + b.amount, 0),
  currency: data.balances[0]?.currency || "CNY",
  isAvailable: true
};

return result;`
    return example
  }
}
