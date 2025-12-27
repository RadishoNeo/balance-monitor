interface BalanceTemplateConfig {
  name: string
  url: string
  method: 'GET' | 'POST'
  auth: {
    type: 'Basic' | 'Bearer'
    apiKey: string
    headerKey?: 'Authorization' | 'X-Api-Key'
  }
  timeout?: number
  body?: string
  // 解析器配置
  parser: {
    isAvailablePath: string
    balanceMappings: Array<{
      currency: string
      total_balance: string
      granted_balance: string
      topped_up_balance: string
    }>
  }
  // 监控配置
  monitoring: {
    enabled: boolean
    interval: number
  }
  // 阈值配置
  thresholds: {
    warning: number
    danger: number
    currency: string
  }
  // 标识是否为预设配置
  isPreset: boolean
}

const balanceList: BalanceTemplateConfig[] = [
  /**
   * curl -L -X GET 'https://api.deepseek.com/user/balance' \
-H 'Accept: application/json' \
-H 'Authorization: Bearer <TOKEN>'

response
{
  "is_available": true,
  "balance_infos": [
    {
      "currency": "CNY",
      "total_balance": "110.00",
      "granted_balance": "10.00",
      "topped_up_balance": "100.00"
    }
  ]
}
   */
  {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/user/balance',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      isAvailablePath: 'is_available',
      balanceMappings: [
        {
          currency: 'balance_infos[0].currency',
          total_balance: 'balance_infos[0].total_balance',
          granted_balance: 'balance_infos[0].granted_balance',
          topped_up_balance: 'balance_infos[0].topped_up_balance'
        }
      ]
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10,
      currency: '¥'
    },
    isPreset: true
  },
  /**
   * 查询余额
  请求地址
  GET https://api.moonshot.cn/v1/users/me/balance

  调用示例
  curl https://api.moonshot.cn/v1/users/me/balance -H "Authorization: Bearer $MOONSHOT_API_KEY"

  返回内容
  {
    "code": 0,
    "data": {
      "available_balance": 49.58894,
      "voucher_balance": 46.58893,
      "cash_balance": 3.00001
    },
    "scode": "0x0",
    "status": true
  }

  返回内容说明
  字段	说明	类型	单位
  available_balance	可用余额，包括现金余额和代金券余额, 当它小于等于 0 时, 用户不可调用推理 API	float	人民币元（CNY）
  voucher_balance	代金券余额, 不会为负数	float	人民币元（CNY）
  cash_balance	现金余额, 可能为负数, 代表用户欠费, 当它为负数时, available_balance 为 voucher_balance 的值	float	人民币元（CNY）
   */
  {
    name: 'Moonshot',
    url: 'https://api.moonshot.cn/v1/users/me/balance',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      isAvailablePath: 'status',
      balanceMappings: [
        {
          currency: 'CNY',
          total_balance: 'data.available_balance',
          granted_balance: 'data.voucher_balance',
          topped_up_balance: 'data.cash_balance'
        }
      ]
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10,
      currency: '¥'
    },
    isPreset: true
  }
]

export { balanceList }
export type { BalanceTemplateConfig }
