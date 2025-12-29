// UI状态类型
export interface UIState {
  configs: BalanceMonitorConfig[]
  activeConfigId: string | null
  monitorStatuses: MonitorStatus[]
  logs: LogEntry[]
  appInfo: AppInfo | null
  loading: boolean
  error: string | null
}

// 表单状态类型
export interface ConfigFormState {
  name: string
  api: {
    url: string
    method: 'GET' | 'POST'
    headers: Array<{ key: string; value: string }>
    body: string
    timeout: number
  }
  parser: {
    parserType: string
  }
  monitoring: {
    enabled: boolean
    interval: number
  }
  thresholds: {
    warning: number
    danger: number
    currency: string
  }
}

// 测试结果类型
export interface TestResult {
  success: boolean
  message: string
  data?: any
  responseTime?: number
  parsed?: ParsedBalance
}

// 页面类型
export type PageType = 'dashboard' | 'config' | 'logs'

// 余额状态颜色
export type BalanceStatusColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue'

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
}

// 认证配置类型
export interface AuthConfig {
  type: 'Basic' | 'Bearer' | 'APIKey'
  apiKey: string
  headerKey?: 'Authorization' | 'X-Api-Key' | string
}


// 以下类型应从 preload 导入
export interface APIRequest {
  url: string
  method: 'GET' | 'POST'
  headers: Array<{ key: string; value: string }>
  auth?: any
  body?: string
  timeout?: number
}

export interface APIResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
  responseTime: number
}

export type ParserConfig = import('@shared/parser-types').ParserConfig
export type ParserType = import('@shared/parser-types').ParserType

export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  grantedBalance?: number
  toppedUpBalance?: number
  raw?: any
}

export interface MonitoringConfig {
  enabled: boolean
  interval: number
}

export interface ThresholdConfig {
  warning: number
  danger: number
  currency: string
}

// 针对API配置的扩展接口（用于简化表单）
export interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  auth?: AuthConfig
  timeout?: number
  body?: string
  name?: string
}

export interface BalanceMonitorConfig {
  id: string
  name: string
  logo?: string // Logo图片路径，如 'src/assets/providers/deepseek.png'
  url?: string // 扁平化配置字段
  method?: 'GET' | 'POST'
  auth?: AuthConfig
  timeout?: number
  body?: string
  api: {
    url: string
    method: 'GET' | 'POST'
    headers: Array<{ key: string; value: string; encrypted?: boolean }>
    body?: string
    timeout?: number
    auth?: AuthConfig // 新增认证配置
  }
  parser: {
    parserType: string // 策略类型标识
  }
  monitoring: MonitoringConfig
  thresholds: ThresholdConfig
  createdAt: string
  updatedAt: string
  enabled: boolean
  isPreset?: boolean // 标识是否为预设配置
}

export interface MonitorStatus {
  configId: string
  status: 'running' | 'stopped' | 'error'
  lastRun: string | null
  nextRun: string | null
  errorCount: number
  successCount: number
  balance?: number
  currency?: string
  grantedBalance?: number
  toppedUpBalance?: number
}

export interface LogEntry {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  module: string
  message: string
}

export interface AppInfo {
  version: string
  name: string
  platform: string
  configDir: string | null
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// 扩展的 Electron API 接口（简化版）
export interface ExtendedElectronAPI {
  // 配置管理
  saveConfig: (config: Partial<BalanceMonitorConfig>) => Promise<BalanceMonitorConfig>
  loadConfig: () => Promise<{ configs: BalanceMonitorConfig[]; activeConfigId: string | null }>
  deleteConfig: (configId: string) => Promise<boolean>
  setActiveConfig: (configId: string) => Promise<boolean>
  exportConfig: (configId: string) => Promise<string | null>
  importConfig: (jsonString: string) => Promise<BalanceMonitorConfig | null>
  validateConfig: (config: any) => Promise<ValidationResult>

  // API测试
  testApiConnection: (request: APIRequest) => Promise<APIResponse>
  testParser: (
    data: any,
    parserConfig: ParserConfig
  ) => Promise<{ success: boolean; result?: ParsedBalance; error?: string }>

  // 监控控制
  startMonitoring: () => Promise<{ success: boolean; message: string }>
  stopMonitoring: () => Promise<{ success: boolean; message: string }>
  manualQuery: () => Promise<{ success: boolean; message: string }>
  startConfigMonitor: (configId: string) => Promise<{ success: boolean; message: string }>
  stopConfigMonitor: (configId: string) => Promise<boolean>
  getMonitorStatus: () => Promise<MonitorStatus[]>
  getAllStatuses: () => Promise<MonitorStatus[]>

  // 日志管理
  getLogs: (limit?: number) => Promise<LogEntry[]>
  clearLogs: () => Promise<boolean>

  // 窗口控制
  minimizeWindow: () => Promise<boolean>
  closeWindow: () => Promise<boolean>

  // 应用信息
  getAppInfo: () => Promise<AppInfo>

  // 事件监听
  onBalanceUpdate: (callback: (data: any) => void) => () => void
  onStatusChange: (callback: (data: any) => void) => () => void
  onAppReady: (callback: () => void) => () => void
  onNavigateToConfig: (callback: () => void) => () => void
}
