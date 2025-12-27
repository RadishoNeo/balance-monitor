import React, { useState, useEffect, useCallback } from 'react'
import { useConfigManager, useBalanceMonitor, useElectronAPI, useElectronEvents } from './hooks'
import { BalanceMonitorConfig, PageType, APIRequest } from './types'
import logo from './assets/logo.svg'

import { Toaster, toast } from 'sonner'

// 组件导入
import { ConfigManager } from './components/ConfigManager'
import { APIConfigForm } from './components/APIConfigForm'
import { ParserConfig } from './components/ParserConfig'
import { MonitoringSettings } from './components/MonitoringSettings'
import { StatusPanel } from './components/StatusPanel'
import { LogViewer } from './components/LogViewer'
import { TestConnection } from './components/TestConnection'

const generateDefaultName = () => `配置-${Date.now()}`

function App(): React.JSX.Element {
  const { api } = useElectronAPI()
  const { appReady } = useElectronEvents()

  // Hooks
  const configManager = useConfigManager()
  const balanceMonitor = useBalanceMonitor()

  // UI状态
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [editingConfig, setEditingConfig] = useState<BalanceMonitorConfig | undefined>(undefined)
  const [showNewConfig, setShowNewConfig] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'config' | 'parser' | 'monitoring' | 'test'>('config')
  const [sampleData, setSampleData] = useState<any>(null)

  // 加载日志
  const loadLogs = useCallback(async () => {
    if (!api) return
    const logEntries = await api.getLogs(200)
    setLogs(logEntries)
  }, [api])

  // 显示通知（使用 toast）
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    if (type === 'error') {
      toast.error(message)
    } else if (type === 'warning') {
      toast.warning(message)
    } else {
      toast.success(message)
    }
  }

  // 新建配置
  const handleNewConfig = () => {
    setEditingConfig(undefined)
    setShowNewConfig(true)
    setActiveTab('config')
    setCurrentPage('config')
  }

  // 编辑配置
  const handleEditConfig = (config: BalanceMonitorConfig) => {
    setEditingConfig(config)
    setShowNewConfig(true)
    setActiveTab('config')
    setCurrentPage('config')
  }

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    const success = await configManager.deleteConfig(configId)
    if (success) {
      showNotification('配置已删除')
    }
  }

  // 设置活动配置
  const handleSetActiveConfig = async (configId: string) => {
    const success = await configManager.setActiveConfig(configId)
    if (success) {
      showNotification('活动配置已设置')
      // 刷新监控状态以显示在仪表盘
      await balanceMonitor.loadStatuses()
    }
  }

  // 导出配置
  const handleExportConfig = async (configId: string) => {
    const json = await configManager.exportConfig(configId)
    if (json) {
      showNotification('配置已导出到下载文件夹')
    }
  }

  // 导入配置
  const handleImportConfig = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const text = await file.text()
      const config = await configManager.importConfig(text)
      if (config) {
        showNotification('配置导入成功')
      }
    }
    input.click()
  }

  // API测试 (适配新的 APIConfigForm 格式)
  const handleTestAPI = async (request: any) => {
    // 将新的格式转换为旧的 APIRequest 格式
    const apiRequest: APIRequest = {
      url: request.url,
      method: request.method,
      headers: [],
      body: request.body,
      timeout: request.timeout
    }

    // 添加认证头
    if (request.auth) {
      const { type, apiKey, headerKey = 'Authorization' } = request.auth
      let authValue = ''

      if (type === 'Bearer') {
        authValue = `Bearer ${apiKey}`
      } else if (type === 'Basic') {
        authValue = `Basic ${btoa(apiKey)}`
      }

      apiRequest.headers.push({
        key: headerKey,
        value: authValue
      })
    }

    const result = await balanceMonitor.testApiConnection(apiRequest)
    if (result.success) {
      setSampleData(result.data)
    }
    return result
  }

  // 解析器测试
  const handleTestParser = async (data: any, parserConfig: any) => {
    return await balanceMonitor.testParser(data, parserConfig)
  }

  // 保存完整配置（分步骤）
  const handleSaveFullConfig = async (stepData: any) => {
    let newConfig: any = {}

    if (editingConfig) {
      newConfig = { ...editingConfig }
    } else {
      newConfig = {
        name: stepData.name || generateDefaultName(),
        api: {},
        parser: {},
        monitoring: { enabled: false, interval: 30 },
        thresholds: { warning: 50, danger: 10, currency: '¥' }
      }
    }

    // 根据当前标签页合并数据
    if (activeTab === 'config' && stepData.api) {
      newConfig.api = stepData.api
    } else if (activeTab === 'parser' && stepData.parser) {
      newConfig.parser = stepData.parser
    } else if (activeTab === 'monitoring') {
      if (stepData.monitoring) newConfig.monitoring = stepData.monitoring
      if (stepData.thresholds) newConfig.thresholds = stepData.thresholds
    }

    const saved = await configManager.saveConfig(newConfig)
    if (saved) {
      // 确保 editingConfig 更新为最新的配置对象，防止表单重置
      setEditingConfig(saved)
    }
  }

  // 监控控制
  const handleStartMonitoring = async () => {
    const result = await balanceMonitor.startMonitoring()
    if (result.success) {
      showNotification('监控已启动')
    } else {
      showNotification(result.message, 'error')
    }
  }

  const handleStopMonitoring = async () => {
    const result = await balanceMonitor.stopMonitoring()
    if (result.success) {
      showNotification('监控已停止')
    }
  }

  const handleManualQuery = async () => {
    const result = await balanceMonitor.manualQuery()
    if (result.success) {
      showNotification('查询完成')
    } else {
      showNotification(result.message, 'error')
    }
  }

  // 清空日志
  const handleClearLogs = async () => {
    if (!api) return
    await api.clearLogs()
    setLogs([])
    showNotification('日志已清空')
  }

  // 监听事件
  useElectronEvents()

  // 页面切换时刷新数据
  useEffect(() => {
    if (currentPage === 'logs') {
      loadLogs()
    }
  }, [currentPage, loadLogs])

  // 应用就绪后加载数据
  useEffect(() => {
    if (appReady && api) {
      configManager.loadConfigs()
      loadLogs()
    }
  }, [appReady, api, configManager, loadLogs])

  // 显示错误或警告 toast
  useEffect(() => {
    if (configManager.error) {
      toast.error(configManager.error)
    }
  }, [configManager.error])

  useEffect(() => {
    if (balanceMonitor.error) {
      toast.error(balanceMonitor.error)
    }
  }, [balanceMonitor.error])

  // 渲染页面
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <StatusPanel
            statuses={balanceMonitor.statuses}
            isMonitoring={balanceMonitor.isMonitoring}
            lastBalance={balanceMonitor.lastBalance}
            lastCurrency={balanceMonitor.lastCurrency}
            onManualQuery={handleManualQuery}
            onStart={handleStartMonitoring}
            onStop={handleStopMonitoring}
            loading={balanceMonitor.loading}
          />
        )

      case 'config':
        if (showNewConfig) {
          // 配置编辑界面
          const initialData = editingConfig ? configManager.toFormState(editingConfig) : undefined

          // 准备 APIConfigForm 的初始数据（扁平结构）
          const apiFormInitialData = editingConfig
            ? {
              name: editingConfig.name,
              url: editingConfig.api?.url || '',
              method: editingConfig.api?.method || 'GET',
              auth: editingConfig.api?.auth || {
                type: 'Bearer' as const,
                apiKey: '',
                headerKey: 'Authorization' as const
              },
              timeout: editingConfig.api?.timeout || 10000,
              body: editingConfig.api?.body || ''
            }
            : undefined

          // 处理标签页切换（保存当前标签页的数据）
          const handleTabSwitch = async (newTab: 'config' | 'parser' | 'monitoring' | 'test') => {
            // 如果切换到不同的标签页，先强制保存当前标签页的数据
            if (newTab !== activeTab && editingConfig) {
              // 根据当前标签页重新保存数据，确保数据不丢失
              if (activeTab === 'config') {
                // API配置的数据会通过 onChange 自动保存
              } else if (activeTab === 'parser') {
                // 解析器数据需要重新保存
                await handleSaveFullConfig({ parser: editingConfig.parser })
              } else if (activeTab === 'monitoring') {
                // 监控设置数据需要重新保存
                await handleSaveFullConfig({
                  monitoring: editingConfig.monitoring,
                  thresholds: editingConfig.thresholds
                })
              }
            }
            setActiveTab(newTab)
          }

          return (
            <div className="flex-1 flex flex-col min-h-0">
              {/* 顶部工具栏 - 现代化 Header */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowNewConfig(false)
                        setEditingConfig(undefined)
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                      title="返回列表"
                    >
                      <span className="text-xl">←</span>
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {editingConfig?.id ? '编辑配置' : '新建配置'}
                      </h2>
                      <p className="text-xs text-muted-foreground">配置您的服务监控参数</p>
                    </div>
                  </div>
                </div>

                {/* 配置名称集成的输入框 */}
                <div className="bg-card/50 p-4 rounded-xl border border-border/50 shadow-sm">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 ml-1">
                    配置名称
                  </label>
                  <input
                    type="text"
                    defaultValue={editingConfig?.name}
                    id="config-name-input"
                    placeholder="例如: DeepSeek 官方 API"
                    className="w-full bg-transparent text-lg font-bold text-foreground focus:outline-none border-b border-transparent focus:border-primary/50 px-1 py-1 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                {/* 现代化标签页 (Segmented Control 风格) */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl self-start">
                  {[
                    { key: 'config', label: 'API配置', icon: '🔗' },
                    { key: 'parser', label: '解析器', icon: '🔍' },
                    { key: 'monitoring', label: '监控设置', icon: '🔔' },
                    { key: 'test', label: '测试', icon: '🧪' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabSwitch(tab.key as any)}
                      className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl ${activeTab === tab.key
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 select-none'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95'
                        }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签页内容 */}
              <div className="pt-4 flex-1 overflow-y-auto pb-4">
                {activeTab === 'config' && (
                  <APIConfigForm
                    initialData={apiFormInitialData}
                    onChange={async (configData) => {
                      await handleSaveFullConfig(configData)
                    }}
                    onTest={handleTestAPI}
                    loading={configManager.loading}
                    configId={editingConfig?.id}
                  />
                )}

                {activeTab === 'parser' && (
                  <ParserConfig
                    initialData={editingConfig?.parser}
                    onChange={async (parserData) => {
                      // 处理新的解析器数据结构
                      if (editingConfig) {
                        await handleSaveFullConfig({
                          parser: {
                            ...editingConfig.parser,
                            ...parserData
                          }
                        })
                      }
                    }}
                    onTest={handleTestParser}
                    loading={configManager.loading}
                    sampleData={sampleData}
                    configId={editingConfig?.id}
                  />
                )}

                {activeTab === 'monitoring' && (
                  <MonitoringSettings
                    initialData={{
                      monitoring: initialData?.monitoring,
                      thresholds: initialData?.thresholds
                    }}
                    onChange={async (monitoring, thresholds) => {
                      await handleSaveFullConfig({ monitoring, thresholds })
                    }}
                    loading={configManager.loading}
                    configId={editingConfig?.id}
                  />
                )}

                {activeTab === 'test' && (
                  <TestConnection onTestAPI={handleTestAPI} onTestParser={handleTestParser} />
                )}
              </div>
            </div>
          )
        } else {
          // 配置列表界面
          return (
            <ConfigManager
              configs={configManager.configs}
              activeConfigId={configManager.activeConfigId}
              onNewConfig={handleNewConfig}
              onEditConfig={handleEditConfig}
              onDeleteConfig={handleDeleteConfig}
              onSetActiveConfig={handleSetActiveConfig}
              onExportConfig={handleExportConfig}
              onImportConfig={handleImportConfig}
              loading={configManager.loading}
            />
          )
        }

      case 'logs':
        return <LogViewer logs={logs} onClearLogs={handleClearLogs} onRefreshLogs={loadLogs} />

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* 头部 - 现代化毛玻璃效果 */}
      <header className="flex-none bg-card/80 backdrop-blur-md border-b border-border shadow-sm z-10">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex-none group cursor-default">
                <img
                  src={logo}
                  alt="Balance Monitor Logo"
                  className="w-full h-full drop-shadow-xl transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110"
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground leading-none">
                  BALANCE<span className="text-primary">.</span>MONITOR
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1.5">
                  Institutional Grade Tracking
                </p>
              </div>
            </div>

            {/* 导航按钮 - 现代化分段控制 */}
            <nav className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl">
              {[
                { key: 'dashboard', label: '仪表板', icon: '📊' },
                { key: 'config', label: '服务配置', icon: '⚙️' },
                { key: 'logs', label: '实时日志', icon: '📝' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key as PageType)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${currentPage === item.key
                      ? 'bg-card text-primary shadow-lg shadow-black/5 ring-1 ring-border/10 scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 - 增加了内边距以提供呼吸感 */}
      <main className="flex-1 max-w-full p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-12 flex flex-col">{renderPage()}</div>
      </main>

      {/* 底部状态栏 - 强化了视觉隔离和垂直间距 */}
      <footer className="flex-none bg-card/60 backdrop-blur-md border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-full px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-muted text-lg">📁</span>
              <div className="flex flex-col">
                <span className="text-[8px] opacity-40 mb-1">Active Profile</span>
                {configManager.activeConfig ? (
                  <span className="text-foreground">
                    <span className="text-primary">{configManager.activeConfig.name}</span>
                  </span>
                ) : (
                  <span className="text-destructive animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1"></span>
                    未设置活动配置
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-full border border-border/50">
              {balanceMonitor.isMonitoring ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-green-600">LIVE MONITORING</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                  <span className="text-muted-foreground">STANDBY</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground/40 font-normal">v1.0.0 Alpha</div>
          </div>
        </div>
      </footer>

      {/* Sonner Toaster */}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App
