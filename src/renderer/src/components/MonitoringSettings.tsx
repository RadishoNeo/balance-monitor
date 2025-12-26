import React, { useState } from 'react'
import { MonitoringConfig, ThresholdConfig } from '../types'

interface MonitoringSettingsProps {
  initialData?: {
    monitoring?: Partial<MonitoringConfig>
    thresholds?: Partial<ThresholdConfig>
  }
  onSubmit: (monitoring: MonitoringConfig, thresholds: ThresholdConfig) => Promise<void>
  loading?: boolean
}

export const MonitoringSettings: React.FC<MonitoringSettingsProps> = ({
  initialData,
  onSubmit,
  loading = false
}) => {
  const [monitoring, setMonitoring] = useState<MonitoringConfig>({
    enabled: initialData?.monitoring?.enabled ?? false,
    interval: initialData?.monitoring?.interval ?? 30
  })

  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    warning: initialData?.thresholds?.warning ?? 50,
    danger: initialData?.thresholds?.danger ?? 10,
    currency: initialData?.thresholds?.currency ?? '¥'
  })

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证
    if (monitoring.interval < 5) {
      setError('轮询间隔不能小于5秒')
      return
    }

    if (thresholds.warning <= thresholds.danger) {
      setError('黄色警告阈值必须大于红色危险阈值')
      return
    }

    if (thresholds.danger < 0) {
      setError('危险阈值不能为负数')
      return
    }

    try {
      await onSubmit(monitoring, thresholds)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 轮询设置 */}
      <div className="border border-gray-200 rounded-md p-4">
        <h3 className="font-medium mb-3 text-lg">轮询设置</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">启用监控</label>
            <input
              type="checkbox"
              checked={monitoring.enabled}
              onChange={(e) => setMonitoring((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">轮询间隔 (秒)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={monitoring.interval}
                onChange={(e) =>
                  setMonitoring((prev) => ({ ...prev, interval: parseInt(e.target.value) }))
                }
                min="5"
                step="5"
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">秒</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">建议: 30-60秒，避免频繁请求</p>
          </div>
        </div>
      </div>

      {/* 阈值设置 */}
      <div className="border border-gray-200 rounded-md p-4">
        <h3 className="font-medium mb-3 text-lg">余额阈值</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">货币单位</label>
            <input
              type="text"
              value={thresholds.currency}
              onChange={(e) => setThresholds((prev) => ({ ...prev, currency: e.target.value }))}
              placeholder="¥"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">黄色警告阈值</label>
              <input
                type="number"
                value={thresholds.warning}
                onChange={(e) =>
                  setThresholds((prev) => ({ ...prev, warning: parseFloat(e.target.value) }))
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">余额 ≤ 此值显示黄色</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">红色危险阈值</label>
              <input
                type="number"
                value={thresholds.danger}
                onChange={(e) =>
                  setThresholds((prev) => ({ ...prev, danger: parseFloat(e.target.value) }))
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">余额 ≤ 此值显示红色</p>
            </div>
          </div>

          {/* 阈值示例 */}
          <div className="bg-gray-50 rounded-md p-3 text-sm">
            <div className="font-medium mb-1">阈值效果示例:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                {/* <span>余额 > {thresholds.warning} {thresholds.currency} = 绿色 (正常)</span> */}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>
                  {/* {thresholds.danger}  < 余额 ≤ {thresholds.warning} {thresholds.currency} = 黄色 (警告) */}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>
                  余额 ≤ {thresholds.danger} {thresholds.currency} = 红色 (危险)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* 保存按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? '保存中...' : '保存设置'}
      </button>
    </form>
  )
}
