import { VendorConfig } from '../types/balance'
import deepseekLogo from '../assets/providers/deepseek.png'
import moonshotLogo from '../assets/providers/moonshot.png'
import ppioLogo from '../assets/providers/ppio.png'
import aihubmixLogo from '../assets/providers/aihubmix.png'
import openrouterLogo from '../assets/providers/openrouter.png'
import volcengineLogo from '../assets/providers/volcengine.png'

export type { VendorConfig as BalanceTemplateConfig }

const balanceList: VendorConfig[] = [
  {
    name: 'DeepSeek',
    logo: deepseekLogo,
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
    logo: moonshotLogo,
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
    logo: ppioLogo,
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
    logo: moonshotLogo,
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
    logo: aihubmixLogo,
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
    logo: openrouterLogo,
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
    logo: volcengineLogo,
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
