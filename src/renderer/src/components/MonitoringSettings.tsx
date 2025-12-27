import React, { useEffect } from 'react'
import { MonitoringConfig, ThresholdConfig } from '../types'
import { toast } from 'sonner'
import { useAutoSave } from '@renderer/hooks'
import {
  useFormStore,
  selectMonitoringFormState,
  selectUpdateMonitoringForm
} from '@renderer/store'

interface MonitoringSettingsProps {
  initialData?: {
    monitoring?: Partial<MonitoringConfig>
    thresholds?: Partial<ThresholdConfig>
  }
  onChange: (monitoring: MonitoringConfig, thresholds: ThresholdConfig) => Promise<void>
  loading?: boolean
  configId?: string
}

export const MonitoringSettings: React.FC<MonitoringSettingsProps> = ({
  initialData,
  onChange,
  loading,
  configId
}) => {
  const monitoringFormState = useFormStore(selectMonitoringFormState)

  const [monitoring, setMonitoring] = React.useState<MonitoringConfig>({
    enabled: initialData?.monitoring?.enabled ?? monitoringFormState.monitoring.enabled ?? false,
    interval: initialData?.monitoring?.interval ?? monitoringFormState.monitoring.interval ?? 30
  })

  const [thresholds, setThresholds] = React.useState<ThresholdConfig>({
    warning: initialData?.thresholds?.warning ?? monitoringFormState.thresholds.warning ?? 50,
    danger: initialData?.thresholds?.danger ?? monitoringFormState.thresholds.danger ?? 10,
    currency: initialData?.thresholds?.currency ?? monitoringFormState.thresholds.currency ?? '¥'
  })

  const updateMonitoringForm = useFormStore(selectUpdateMonitoringForm)

  // 同步到 Zustand store
  useEffect(() => {
    updateMonitoringForm(monitoring, thresholds)
  }, [monitoring, thresholds, updateMonitoringForm])

  const { triggerSave, isSaving } = useAutoSave({
    delay: 1000,
    onSave: () => onChange(monitoring, thresholds),
    onSuccess: () => {
      console.log('监控设置已自动保存')
    },
    onError: (error) => {
      console.error('自动保存失败:', error)
      toast.error('自动保存失败: ' + error.message)
    }
  })

  // 避免未使用变量警告
  void loading
  void configId

  const handleFieldChange = (section: 'monitoring' | 'thresholds', field: string, value: any) => {
    if (section === 'monitoring') {
      const newMonitoring = {
        ...monitoring,
        [field]: field === 'interval' ? parseInt(value) : value
      }
      setMonitoring(newMonitoring)
    } else if (section === 'thresholds') {
      const newThresholds = { ...thresholds, [field]: value }
      setThresholds(newThresholds)
    }
    triggerSave()
  }

  return (
    <div className="space-y-6 group">
      {/* 保存状态指示器 */}
      <div className="text-xs text-muted-foreground text-right h-4">
        {isSaving && <span className="text-primary italic">保存中...</span>}
      </div>
      {/* 轮询设置 */}
      <div className="border border-border bg-card rounded-md p-4">
        <h3 className="font-medium mb-3 text-lg text-foreground">轮询设置</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">轮询间隔 (秒)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={monitoring.interval}
                onChange={(e) => handleFieldChange('monitoring', 'interval', e.target.value)}
                min="5"
                step="5"
                className="flex-1 px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">秒</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">建议: 30-60秒，避免频繁请求</p>
          </div>
        </div>
      </div>

      {/* 阈值设置 */}
      <div className="border border-border bg-card rounded-md p-4">
        <h3 className="font-medium mb-3 text-lg text-foreground">余额阈值</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">货币单位</label>
            <input
              type="text"
              value={thresholds.currency}
              onChange={(e) => handleFieldChange('thresholds', 'currency', e.target.value)}
              placeholder="¥"
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">黄色警告阈值</label>
              <input
                type="number"
                value={thresholds.warning}
                onChange={(e) =>
                  handleFieldChange('thresholds', 'warning', parseFloat(e.target.value))
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">余额 ≤ 此值显示黄色</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">红色危险阈值</label>
              <input
                type="number"
                value={thresholds.danger}
                onChange={(e) =>
                  handleFieldChange('thresholds', 'danger', parseFloat(e.target.value))
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">余额 ≤ 此值显示红色</p>
            </div>
          </div>

          {/* 阈值示例 */}
          <div className="bg-muted rounded-md p-3 text-sm">
            <div className="font-medium mb-1 text-foreground">阈值效果示例:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-muted-foreground">正常</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-muted-foreground">警告</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-muted-foreground">危险</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
