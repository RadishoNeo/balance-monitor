import { VendorConfig } from '../types/balance'

export type { VendorConfig as BalanceTemplateConfig }

const balanceList: VendorConfig[] = [
  {
    name: 'DeepSeek',
    logo: 'src/assets/providers/deepseek.png',
    url: 'https://api.deepseek.com/user/balance',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      parserType: 'deepseek'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10
    },
    isPreset: true
  },
  {
    name: 'Moonshot (CN)',
    logo: 'src/assets/providers/moonshot.png',
    url: 'https://api.moonshot.cn/v1/users/me/balance',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      parserType: 'moonshot'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10
    },
    isPreset: true
  },
  {
    name: '欧派云',
    logo: 'src/assets/providers/ppio.png',
    url: 'https://api.ppinfra.com/v3/user',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      parserType: 'ppio'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10
    },
    isPreset: true
  },
  {
    name: 'Moonshot (AI)',
    logo: 'src/assets/providers/moonshot.png',
    url: 'https://api.moonshot.ai/v1/users/me/balance',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: 10000,
    parser: {
      parserType: 'moonshot'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 50,
      danger: 10
    },
    isPreset: true
  },
  {
    name: 'AIHubMix',
    logo: 'src/assets/providers/aihubmix.png',
    url: 'https://api.aihubmix.com/v1/user/usage',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    parser: {
      parserType: 'aihubmix'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 10,
      danger: 2
    },
    isPreset: true
  },
  {
    name: 'OpenRouter',
    logo: 'src/assets/providers/openrouter.png',
    url: 'https://openrouter.ai/api/v1/user/credits',
    method: 'GET',
    auth: {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    parser: {
      parserType: 'openrouter'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 10,
      danger: 2
    },
    isPreset: true
  },
  {
    name: 'VolcEngine',
    logo: 'src/assets/providers/volcengine.png',
    url: 'https://volcengine.com/api/balance',
    method: 'GET',
    auth: {
      type: 'APIKey',
      apiKey: '',
      headerKey: 'X-Api-Key'
    },
    parser: {
      parserType: 'volcengine'
    },
    monitoring: {
      enabled: false,
      interval: 30
    },
    thresholds: {
      warning: 100,
      danger: 20
    },
    isPreset: true
  }
]

export { balanceList }
