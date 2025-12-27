interface BalanceTemplateConfig {
  url: string
  name: string
  method: 'GET' | 'POST'
  auth: {
    type: 'Basic' | 'Bearer'
    apiKey: string
    headerKey?: 'Authorization' | 'X-Api-Key'
  }
  response: {
    is_available: string
    balance_infos: Array<{
      currency: string
      total_balance: string
      granted_balance: string
      topped_up_balance: string
    }>
  }
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
    url: 'https://api.deepseek.com/user/balance',
    name: 'DeepSeek',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    response: {
      is_available: 'is_available',
      balance_infos: [
        {
          currency: 'currency',
          total_balance: 'total_balance',
          granted_balance: 'granted_balance',
          topped_up_balance: 'topped_up_balance'
        }
      ]
    }
  },
  /**
   * �����ַ
GET https://api.moonshot.cn/v1/users/me/balance

����ʾ��
curl https://api.moonshot.cn/v1/users/me/balance -H "Authorization: Bearer $MOONSHOT_API_KEY"

��������
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

��������˵��
�ֶ�	˵��	����	��λ
available_balance	�����������ֽ����ʹ���ȯ���, ����С�ڵ��� 0 ʱ, �û����ɵ������� API	float	�����Ԫ��CNY��
voucher_balance	����ȯ���, ����Ϊ����	float	�����Ԫ��CNY��
cash_balance	�ֽ����, ����Ϊ����, �����û�Ƿ��, ����Ϊ����ʱ, available_balance Ϊ voucher_balance ��ֵ	float	�����Ԫ��CNY��
   */
  {
    url: 'https://api.moonshot.cn/v1/users/me/balance',
    name: 'Moonshot',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    response: {
      is_available: 'status',
      balance_infos: [
        {
          currency: 'CNY',
          total_balance: 'available_balance',
          granted_balance: 'voucher_balance',
          topped_up_balance: 'cash_balance'
        }
      ]
    }
  }
]

export { balanceList }
export type { BalanceTemplateConfig }
