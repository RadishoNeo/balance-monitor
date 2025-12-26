import React, { useState } from 'react'
import { BalanceMonitorConfig } from '../types'

interface ConfigManagerProps {
  configs: BalanceMonitorConfig[]
  activeConfigId: string | null
  onNewConfig: () => void
  onEditConfig: (config: BalanceMonitorConfig) => void
  onDeleteConfig: (configId: string) => Promise<void>
  onSetActiveConfig: (configId: string) => Promise<void>
  onExportConfig: (configId: string) => Promise<void>
  onImportConfig: () => Promise<void>
  loading?: boolean
}

export const ConfigManager: React.FC<ConfigManagerProps> = ({
  configs,
  activeConfigId,
  onNewConfig,
  onEditConfig,
  onDeleteConfig,
  onSetActiveConfig,
  onExportConfig,
  onImportConfig,
  loading = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？此操作不可恢复。')) {
      return
    }

    setDeletingId(configId)
    try {
      await onDeleteConfig(configId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetActive = async (configId: string) => {
    if (activeConfigId === configId) return
    await onSetActiveConfig(configId)
  }

  const handleExport = async (configId: string): Promise<void> => {
    const json = await onExportConfig(configId)
    if (json !== null && json !== undefined) {
      // 创建下载
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `balance-config-${configId}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onNewConfig}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
          >
            + 新建配置
          </button>
          <button
            onClick={onImportConfig}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
          >
            导入配置
          </button>
        </div>
        <div className="text-sm text-gray-500">共 {configs.length} 个配置</div>
      </div>

      {/* 配置列表 */}
      {configs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-dashed">
          <div className="text-lg mb-2">暂无配置</div>
          <div className="text-sm">{'点击"新建配置"开始创建您的第一个余额监控'}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`border rounded-md p-3 transition-all ${activeConfigId === config.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{config.name}</span>
                    {activeConfigId === config.id && (
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        活动
                      </span>
                    )}
                    {config.monitoring.enabled && (
                      <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                        启用
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>
                      API: {config.api.method} {config.api.url}
                    </div>
                    <div>解析: {config.parser.balancePath}</div>
                    <div className="flex gap-3">
                      <span>间隔: {config.monitoring.interval}s</span>
                      <span>
                        警告: {config.thresholds.currency}
                        {config.thresholds.warning}
                      </span>
                      <span>
                        危险: {config.thresholds.currency}
                        {config.thresholds.danger}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 flex-col items-end">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditConfig(config)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleExport(config.id)}
                      disabled={loading}
                      className="text-green-600 hover:text-green-800 text-xs px-2 py-1"
                    >
                      导出
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSetActive(config.id)}
                      disabled={loading || activeConfigId === config.id}
                      className="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 disabled:opacity-50"
                    >
                      设为活动
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      disabled={loading || deletingId === config.id}
                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 disabled:opacity-50"
                    >
                      {deletingId === config.id ? '删除中...' : '删除'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <div className="font-medium mb-1">使用说明:</div>
        <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
          <li>{'创建配置后，点击"设为活动"才能被监控'}</li>
          <li>可以导出配置分享给他人（敏感信息会被加密）</li>
          <li>支持多个配置同时监控</li>
          <li>活动配置的余额会显示在任务栏图标</li>
        </ul>
      </div>
    </div>
  )
}
