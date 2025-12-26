import React, { useState, useEffect } from 'react'
import { useConfigManager, useBalanceMonitor, useElectronAPI, useElectronEvents } from './hooks'
import { BalanceMonitorConfig, PageType } from './types'

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
  const [editingConfig, setEditingConfig] = useState<BalanceMonitorConfig | null>(null)
  const [showNewConfig, setShowNewConfig] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'config' | 'parser' | 'monitoring' | 'test'>('config')
  const [sampleData, setSampleData] = useState<any>(null)

  // 通知状态
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)

  // 加载日志
  const loadLogs = async () => {
    if (!api) return
    const logEntries = await api.getLogs(200)
    setLogs(logEntries)
  }

  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // 新建配置
  const handleNewConfig = () => {
    setEditingConfig(null)
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

  // API测试
  const handleTestAPI = async (request: any) => {
    const result = await balanceMonitor.testApiConnection(request)
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
      showNotification('配置已保存')
      if (!editingConfig) {
        setEditingConfig(saved)
      }
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
  }, [currentPage])

  // 应用就绪后加载数据
  useEffect(() => {
    if (appReady && api) {
      configManager.loadConfigs()
      loadLogs()
    }
  }, [appReady, api])

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

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{editingConfig ? '编辑配置' : '新建配置'}</h2>
                <button
                  onClick={() => {
                    setShowNewConfig(false)
                    setEditingConfig(null)
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  返回列表
                </button>
              </div>

              {/* 配置名称 */}
              <div>
                <label className="block text-sm font-medium mb-1">配置名称</label>
                <input
                  type="text"
                  defaultValue={editingConfig?.name}
                  id="config-name-input"
                  placeholder="我的余额监控"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 标签页 */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                  {[
                    { key: 'config', label: 'API配置' },
                    { key: 'parser', label: '解析器' },
                    { key: 'monitoring', label: '监控设置' },
                    { key: 'test', label: '测试' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="pt-4">
                {activeTab === 'config' && (
                  <APIConfigForm
                    initialData={initialData?.api}
                    onSubmit={async (apiData) => {
                      await handleSaveFullConfig({ api: apiData })
                    }}
                    onTest={handleTestAPI}
                    loading={configManager.loading}
                  />
                )}

                {activeTab === 'parser' && (
                  <ParserConfig
                    initialData={initialData?.parser}
                    onSubmit={async (parserData) => {
                      await handleSaveFullConfig({ parser: parserData })
                    }}
                    onTest={handleTestParser}
                    loading={configManager.loading}
                    sampleData={sampleData}
                  />
                )}

                {activeTab === 'monitoring' && (
                  <MonitoringSettings
                    initialData={{
                      monitoring: initialData?.monitoring,
                      thresholds: initialData?.thresholds
                    }}
                    onSubmit={async (monitoring, thresholds) => {
                      await handleSaveFullConfig({ monitoring, thresholds })
                    }}
                    loading={configManager.loading}
                  />
                )}

                {activeTab === 'test' && (
                  <TestConnection onTestAPI={handleTestAPI} onTestParser={handleTestParser} />
                )}
              </div>

              {/* 保存完整配置按钮 */}
              {activeTab !== 'test' && (
                <div className="pt-4 border-t">
                  <button
                    onClick={async () => {
                      const nameInput = document.getElementById(
                        'config-name-input'
                      ) as HTMLInputElement
                      const name = nameInput?.value || editingConfig?.name || `配置-${Date.now()}`
                      await handleSaveFullConfig({ name })
                      if (!editingConfig) {
                        setShowNewConfig(false)
                        setCurrentPage('dashboard')
                      }
                    }}
                    disabled={configManager.loading}
                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 font-medium"
                  >
                    {configManager.loading ? '保存中...' : '保存完整配置'}
                  </button>
                </div>
              )}
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
    <div className="min-h-screen bg-gray-50">
      {/* 通知 */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm ${notification.type === 'success'
            ? 'bg-green-500 text-white'
            : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-yellow-500 text-white'
            }`}
        >
          {notification.message}
        </div>
      )}

      {/* 错误提示 */}
      {(configManager.error || balanceMonitor.error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 m-4 rounded-md text-sm">
          {configManager.error || balanceMonitor.error}
        </div>
      )}

      {/* 头部 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                ¥
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">余额监控</h1>
                <p className="text-xs text-gray-500">DeepSeek及其他API余额监控</p>
              </div>
            </div>

            {/* 导航按钮 */}
            <nav className="flex gap-2">
              {[
                { key: 'dashboard', label: '仪表板', icon: '📊' },
                { key: 'config', label: '配置', icon: '⚙️' },
                { key: 'logs', label: '日志', icon: '📝' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key as PageType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === item.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-full p-4">
        <div className="max-w-6xl mx-auto">{renderPage()}</div>
      </main>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-full px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
          <div>
            {configManager.activeConfig ? (
              <span>活动配置: {configManager.activeConfig.name}</span>
            ) : (
              <span className="text-orange-600">未设置活动配置</span>
            )}
          </div>
          <div>
            {balanceMonitor.isMonitoring ? (
              <span className="text-green-600">● 监控运行中</span>
            ) : (
              <span className="text-gray-400">○ 监控已停止</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
