import { BalanceMonitorConfig } from '../types'
import { BalanceTemplateConfig } from '../config/balace'

// 适配函数：将模板配置转换为应用程序使用的配置
export function adaptTemplateConfig(
  template: BalanceTemplateConfig
): Partial<BalanceMonitorConfig> {
  return {
    name: template.name,
    url: template.url,
    method: template.method,
    auth: template.auth,
    response: template.response
  }
}

// 适配函数：将应用程序配置转换为可用于解析器的格式
export function getParserConfig(config: BalanceMonitorConfig): any {
  const parserConfig: any = {
    balancePath: config.parser.balancePath,
    currencyPath: config.parser.currencyPath,
    availablePath: config.parser.availablePath,
    customParser: config.parser.customParser
  }

  // 如果存在新的字段映射，也包含它们
  if (config.parser.isAvailablePath) {
    parserConfig.isAvailablePath = config.parser.isAvailablePath
  }
  if (config.parser.balanceMappings) {
    parserConfig.balanceMappings = config.parser.balanceMappings
  }

  return parserConfig
}

// 兼容性的表单状态转换
export function toPartialBalanceMonitorConfig(
  partialConfig: Partial<BalanceMonitorConfig>
): Partial<BalanceMonitorConfig> {
  // 确保重要字段有默认值
  if (!partialConfig.auth) {
    partialConfig.auth = {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    }
  }

  if (!partialConfig.method) {
    partialConfig.method = 'GET'
  }

  if (!partialConfig.timeout) {
    partialConfig.timeout = 10000
  }

  return partialConfig
}
