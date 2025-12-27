import { BalanceMonitorConfig } from '@renderer/types'
import { BalanceTemplateConfig } from '../config/balace'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { balanceList } from '../config/balace'
import { useAutoSave } from '@renderer/hooks'
import { useFormStore, selectUpdateAPIForm } from '@renderer/store'

interface APIConfigFormProps {
  initialData?: Partial<BalanceMonitorConfig>
  onChange: (data: Partial<BalanceMonitorConfig>) => Promise<void>
  onTest?: (data: Partial<BalanceMonitorConfig>) => Promise<any>
  loading?: boolean
  configId?: string
}

export const APIConfigForm: React.FC<APIConfigFormProps> = ({
  initialData,
  onChange,
  onTest,
  loading = false,
  configId
}) => {
  const [formData, setFormData] = useState<Partial<BalanceMonitorConfig>>({
    name: initialData?.name || '',
    url: initialData?.url || '',
    method: initialData?.method || 'GET',
    auth: initialData?.auth || {
      type: 'Bearer',
      apiKey: '',
      headerKey: 'Authorization'
    },
    timeout: initialData?.timeout || 10000,
    body: initialData?.body || ''
  })

  const { triggerSave, isSaving } = useAutoSave({
    delay: 1000,
    onSave: onChange,
    onSuccess: () => {
      console.log('API配置已自动保存')
    },
    onError: (error) => {
      console.error('自动保存失败:', error)
      toast.error('自动保存失败: ' + error.message)
    }
  })

  // 加载配置模板
  const templates = balanceList || []

  // 当选择模板时自动填充配置
  const handleTemplateChange = (templateName: string) => {
    const template = templates.find((t: BalanceTemplateConfig) => t.name === templateName)
    if (template) {
      const newData = {
        ...formData,
        name: template.name,
        url: template.url,
        method: template.method,
        auth: {
          type: template.auth.type,
          apiKey: '', // API密钥不复制
          headerKey: template.auth.headerKey || 'Authorization'
        },
        timeout: template.timeout || 10000,
        body: template.body || ''
      }
      setFormData(newData)

      // 立即保存，包含完整的模板配置（parser、monitoring、thresholds）
      const fullConfig = {
        ...newData,
        parser: template.parser,
        monitoring: template.monitoring,
        thresholds: template.thresholds,
        isPreset: template.isPreset
      }
      triggerSave(fullConfig)
      toast.success(`已加载 ${template.name} 配置模板，请填写 API Key`)
    }
  }

  // 在表单字段变化时触发自动保存
  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    triggerSave(newData)
  }

  const handleAuthChange = (field: 'type' | 'apiKey' | 'headerKey', value: any) => {
    const newAuth = {
      ...(formData.auth || { type: 'Bearer', apiKey: '', headerKey: 'Authorization' }),
      [field]: value
    }
    const newData = { ...formData, auth: newAuth }
    setFormData(newData)
    triggerSave(newData)
  }

  const handleTest = async () => {
    if (!onTest) return

    // 验证
    if (!formData.url) {
      toast.error('API地址不能为空')
      return
    }

    try {
      const result = await onTest(formData)
      if (result.success) {
        toast.success('API测试成功')
      } else {
        toast.error(result.error || '测试失败')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '测试失败')
    }
  }

  // 只在 configId 变化时重置表单（切换到不同的配置）
  // 不依赖 initialData，避免每次保存后 initialData 引用变化导致表单重置
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        url: initialData.url || '',
        method: initialData.method || 'GET',
        auth: initialData.auth || {
          type: 'Bearer',
          apiKey: '',
          headerKey: 'Authorization'
        },
        timeout: initialData.timeout || 10000,
        body: initialData.body || ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId]) // 只在 configId 变化时重新加载数据

  const updateAPIForm = useFormStore(selectUpdateAPIForm)

  // 同步到 Zustand store，供解析器测试使用
  useEffect(() => {
    updateAPIForm({
      name: formData.name,
      api: {
        url: formData.url as string,
        method: (formData.method as any) || 'GET',
        auth: formData.auth,
        timeout: formData.timeout,
        body: formData.body,
        headers: [] // 基础配置不包含额外 headers
      }
    })
  }, [formData, updateAPIForm])

  return (
    <div className="space-y-4 group">
      {/* 保存状态指示器 */}
      <div className="text-xs text-muted-foreground text-right h-4">
        {isSaving && <span className="text-primary italic">保存中...</span>}
      </div>

      {/* 配置模板选择 */}
      {templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">配置模板（可选）</label>
          <select
            value={formData.name || ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">不使用模板</option>
            {templates.map((template: BalanceTemplateConfig) => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">选择预配置的服务模板以自动填充设置</p>
        </div>
      )}

      {/* API地址 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">API地址</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => handleFieldChange('url', e.target.value)}
          placeholder="https://api.example.com/balance"
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        />
      </div>

      {/* 请求方法 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">请求方法</label>
        <select
          value={formData.method}
          onChange={(e) => handleFieldChange('method', e.target.value)}
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>

      {/* 认证类型 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">认证类型</label>
        <select
          value={formData.auth?.type || 'Bearer'}
          onChange={(e) => handleAuthChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Bearer">Bearer Token</option>
          <option value="Basic">Basic Auth</option>
        </select>
      </div>

      {/* Header Key */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">认证Header键</label>
        <select
          value={formData.auth?.headerKey || 'Authorization'}
          onChange={(e) => handleAuthChange('headerKey', e.target.value)}
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Authorization">Authorization</option>
          <option value="X-Api-Key">X-Api-Key</option>
        </select>
      </div>

      {/* API密钥 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">API密钥</label>
        <input
          type="password"
          value={formData.auth?.apiKey || ''}
          onChange={(e) => handleAuthChange('apiKey', e.target.value)}
          placeholder="输入你的API密钥"
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.auth?.type === 'Bearer'
            ? '格式: Bearer Token，例如: sk-xxxxxxxxxxxx'
            : '格式: 用户名:密码 的Base64编码'}
        </p>
      </div>

      {/* 请求体（POST时显示） */}
      {formData.method === 'POST' && (
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">请求体 (JSON)</label>
          <textarea
            value={formData.body}
            onChange={(e) => handleFieldChange('body', e.target.value)}
            placeholder='{"key": "value"}'
            rows={3}
            className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
        </div>
      )}

      {/* 超时时间 */}
      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">超时时间 (毫秒)</label>
        <input
          type="number"
          value={formData.timeout}
          onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value))}
          min="1000"
          step="1000"
          className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 按钮组（移除保存按钮，只保留测试按钮） */}
      <div className="flex gap-2 pt-2">
        {onTest && (
          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 disabled:opacity-50"
          >
            测试连接
          </button>
        )}
      </div>
    </div>
  )
}
