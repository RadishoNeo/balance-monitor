import { ElectronAPI } from '@electron-toolkit/preload'

// API请求配置
export interface APIRequest {
  url: string
  method: 'GET' | 'POST'
  headers: Array<{ key: string; value: string }>
  body?: string
  timeout?: number
}

// API响应
export interface APIResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
  responseTime: number
}

// 解析器配置
export type ParserConfig = import('../shared/parser-types').ParserConfig

// 解析结果
export interface ParsedBalance {
  balance: number
  currency: string
  isAvailable: boolean
  raw?: any
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean
  interval: number
}

// 阈值配置
export interface ThresholdConfig {
  warning: number
  danger: number
  currency: string
}

// 完整配置
export interface BalanceMonitorConfig {
  id: string
  name: string
  url?: string // 扁平化配置字段
  method?: 'GET' | 'POST'
  auth?: {
    type: 'Basic' | 'Bearer' | 'APIKey'
    apiKey: string
    headerKey?: 'Authorization' | 'X-Api-Key' | string
  }
  timeout?: number
  body?: string
  api: {
    url: string
    method: 'GET' | 'POST'
    headers: Array<{ key: string; value: string; encrypted?: boolean }>
    body?: string
    timeout?: number
    auth?: {
      type: 'Basic' | 'Bearer' | 'APIKey'
      apiKey: string
      headerKey?: 'Authorization' | 'X-Api-Key' | string
    }
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

// 监控状态
export interface MonitorStatus {
  configId: string
  status: 'running' | 'stopped' | 'error'
  lastRun: string | null
  nextRun: string | null
  errorCount: number
  successCount: number
}

// 日志条目
export interface LogEntry {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  module: string
  message: string
}

// 应用信息
export interface AppInfo {
  version: string
  name: string
  platform: string
  configDir: string | null
}

// 验证结果
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// 扩展的Electron API
export interface ExtendedElectronAPI extends ElectronAPI {
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

declare global {
  interface Window {
    electron: ExtendedElectronAPI
    api: unknown
  }
}
