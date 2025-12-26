import { ipcMain, BrowserWindow } from 'electron'
import { ConfigManager, BalanceMonitorConfig } from './config-manager'
import { APIEngine, APIRequest } from './api-engine'
import { BalanceParser, ParsedBalance } from './balance-parser'
import { TrayManager, TrayState } from './tray-manager'
import { Logger } from './logger'

export interface MonitorStatus {
  configId: string
  status: 'running' | 'stopped' | 'error'
  lastRun: string | null
  nextRun: string | null
  errorCount: number
  successCount: number
}

export class MonitorScheduler {
  private configManager: ConfigManager
  private apiEngine: APIEngine
  private balanceParser: BalanceParser
  private trayManager: TrayManager
  private logger: Logger

  private timers: Map<string, NodeJS.Timeout>
  private statuses: Map<string, MonitorStatus>
  private mainWindow: BrowserWindow | null = null

  constructor(configManager: ConfigManager, trayManager: TrayManager) {
    this.configManager = configManager
    this.trayManager = trayManager
    this.apiEngine = new APIEngine()
    this.balanceParser = new BalanceParser()
    this.logger = new Logger('MonitorScheduler')

    this.timers = new Map()
    this.statuses = new Map()

    this.setupIPCHandlers()
  }

  private setupIPCHandlers(): void {
    // 启动监控
    ipcMain.handle('start-monitoring', async () => {
      return this.startAllMonitors()
    })

    // 停止监控
    ipcMain.handle('stop-monitoring', async () => {
      return this.stopAllMonitors()
    })

    // 手动查询
    ipcMain.handle('manual-query', async () => {
      return this.manualQuery()
    })

    // 启动单个配置
    ipcMain.handle('start-config-monitor', async (_event, configId: string) => {
      return this.startMonitor(configId)
    })

    // 停止单个配置
    ipcMain.handle('stop-config-monitor', async (_event, configId: string) => {
      return this.stopMonitor(configId)
    })

    // 获取监控状态
    ipcMain.handle('get-monitor-status', async () => {
      return this.getAllStatuses()
    })
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window
  }

  // 启动所有监控
  async startAllMonitors(): Promise<{ success: boolean; message: string }> {
    const configs = this.configManager.getAllConfigs()
    const enabledConfigs = configs.filter((c) => c.monitoring.enabled)

    if (enabledConfigs.length === 0) {
      return { success: false, message: '没有启用的监控配置' }
    }

    let started = 0
    let failed = 0

    for (const config of enabledConfigs) {
      const result = await this.startMonitor(config.id)
      if (result.success) {
        started++
      } else {
        failed++
      }
    }

    if (started > 0) {
      this.trayManager.updateState({ status: 'normal' })
    }

    return {
      success: started > 0,
      message: `启动 ${started} 个监控${failed > 0 ? `, ${failed} 个失败` : ''}`
    }
  }

  // 停止所有监控
  async stopAllMonitors(): Promise<{ success: boolean; message: string }> {
    const configIds = Array.from(this.timers.keys())
    let stopped = 0

    for (const configId of configIds) {
      if (this.stopMonitor(configId)) {
        stopped++
      }
    }

    this.trayManager.updateState({ status: 'stopped', balance: null })

    return {
      success: stopped > 0,
      message: `停止 ${stopped} 个监控`
    }
  }

  // 启动单个监控
  async startMonitor(configId: string): Promise<{ success: boolean; message: string }> {
    const config = this.configManager.getConfig(configId)
    if (!config) {
      return { success: false, message: '配置不存在' }
    }

    // 验证配置
    const validation = this.configManager.validateConfig(config)
    if (!validation.valid) {
      return { success: false, message: `配置无效: ${validation.errors.join(', ')}` }
    }

    // 如果已存在，先停止
    if (this.timers.has(configId)) {
      this.stopMonitor(configId)
    }

    // 立即执行一次
    try {
      await this.executeMonitor(config)
    } catch (error) {
      this.logger.error(`初始查询失败: ${error}`)
    }

    // 设置定时器
    const interval = config.monitoring.interval * 1000
    const timer = setInterval(async () => {
      try {
        await this.executeMonitor(config)
      } catch (error) {
        this.logger.error(`定时查询失败: ${error}`)
      }
    }, interval)

    this.timers.set(configId, timer)

    // 更新状态
    const status: MonitorStatus = {
      configId,
      status: 'running',
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + interval).toISOString(),
      errorCount: 0,
      successCount: 0
    }
    this.statuses.set(configId, status)

    this.logger.success(`启动监控: ${config.name} (间隔: ${config.monitoring.interval}s)`)
    this.notifyUI('status-change', status)

    return { success: true, message: '监控已启动' }
  }

  // 停止单个监控
  stopMonitor(configId: string): boolean {
    const timer = this.timers.get(configId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(configId)

      const status = this.statuses.get(configId)
      if (status) {
        status.status = 'stopped'
        this.statuses.set(configId, status)
        this.notifyUI('status-change', status)
      }

      this.logger.info(`停止监控: ${configId}`)
      return true
    }
    return false
  }

  // 执行监控查询
  private async executeMonitor(config: BalanceMonitorConfig): Promise<void> {
    // const startTime = Date.now()
    const status = this.statuses.get(config.id) || {
      configId: config.id,
      status: 'running',
      lastRun: null,
      nextRun: null,
      errorCount: 0,
      successCount: 0
    }

    // 更新托盘状态为加载中
    this.trayManager.updateState({
      status: 'loading',
      configName: config.name
    })

    // 构建请求
    const request: APIRequest = {
      url: config.api.url,
      method: config.api.method,
      headers: config.api.headers,
      body: config.api.body,
      timeout: config.api.timeout || 10000
    }

    // 执行API请求
    const response = await this.apiEngine.executeRequest(request)

    if (!response.success) {
      status.errorCount++
      status.lastRun = new Date().toISOString()
      this.statuses.set(config.id, status)

      this.logger.error(`[${config.name}] API错误: ${response.error}`)

      // 更新托盘为错误状态
      this.trayManager.updateState({
        status: 'error',
        configName: config.name,
        lastUpdate: new Date().toLocaleTimeString(),
        responseTime: response.responseTime
      })

      this.notifyUI('balance-update', {
        configId: config.id,
        success: false,
        error: response.error,
        responseTime: response.responseTime
      })

      return
    }

    // 解析数据
    let parsed: ParsedBalance
    try {
      parsed = this.balanceParser.parse(response.data, config.parser)
    } catch (error) {
      status.errorCount++
      status.lastRun = new Date().toISOString()
      this.statuses.set(config.id, status)

      this.logger.error(`[${config.name}] 解析错误: ${error}`)

      this.trayManager.updateState({
        status: 'error',
        configName: config.name,
        lastUpdate: new Date().toLocaleTimeString(),
        responseTime: response.responseTime
      })

      this.notifyUI('balance-update', {
        configId: config.id,
        success: false,
        error: String(error),
        responseTime: response.responseTime
      })

      return
    }

    // 成功处理
    status.successCount++
    status.lastRun = new Date().toISOString()
    status.nextRun = new Date(Date.now() + config.monitoring.interval * 1000).toISOString()
    this.statuses.set(config.id, status)

    // 计算状态
    const trayStatus = this.calculateTrayStatus(parsed.balance, config.thresholds)

    // 更新托盘
    this.trayManager.updateState({
      balance: parsed.balance,
      currency: parsed.currency,
      status: trayStatus,
      configName: config.name,
      lastUpdate: new Date().toLocaleTimeString(),
      responseTime: response.responseTime
    })

    // 记录成功日志
    this.logger.success(
      `[${config.name}] 余额: ${parsed.currency}${parsed.balance.toFixed(2)} ` +
        `(响应: ${response.responseTime}ms)`
    )

    // 通知UI
    this.notifyUI('balance-update', {
      configId: config.id,
      success: true,
      balance: parsed.balance,
      currency: parsed.currency,
      isAvailable: parsed.isAvailable,
      responseTime: response.responseTime,
      timestamp: new Date().toISOString()
    })
  }

  // 手动查询
  async manualQuery(): Promise<{ success: boolean; message: string }> {
    const activeConfig = this.configManager.getActiveConfig()
    if (!activeConfig) {
      return { success: false, message: '没有活动配置' }
    }

    try {
      await this.executeMonitor(activeConfig)
      return { success: true, message: '查询完成' }
    } catch (error) {
      return { success: false, message: `查询失败: ${error}` }
    }
  }

  // 计算托盘状态
  private calculateTrayStatus(
    balance: number,
    thresholds: { warning: number; danger: number }
  ): TrayState['status'] {
    if (balance <= thresholds.danger) {
      return 'danger'
    } else if (balance <= thresholds.warning) {
      return 'warning'
    } else {
      return 'normal'
    }
  }

  // 获取所有状态
  getAllStatuses(): MonitorStatus[] {
    return Array.from(this.statuses.values())
  }

  // 通知UI
  private notifyUI(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  // 清理
  destroy(): void {
    for (const [configId, timer] of this.timers) {
      clearInterval(timer)
      this.logger.info(`清理定时器: ${configId}`)
    }
    this.timers.clear()
    this.statuses.clear()
  }

  // 获取特定配置的状态
  getStatus(configId: string): MonitorStatus | null {
    return this.statuses.get(configId) || null
  }

  // 重新加载配置时的处理
  async reloadConfig(configId: string): Promise<void> {
    const isRunning = this.timers.has(configId)

    if (isRunning) {
      this.stopMonitor(configId)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await this.startMonitor(configId)
    }
  }
}
