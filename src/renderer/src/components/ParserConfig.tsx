import React, { useEffect } from 'react'
import { ParserConfig as ParserConfigType } from '../types'
import { toast } from 'sonner'
import { useAutoSave } from '../hooks'
import { useFormStore, selectParserFormState, selectUpdateParserForm } from '@renderer/store'

interface ParserConfigProps {
  initialData?: Partial<ParserConfigType> | null
  onChange: (data: ParserConfigType) => Promise<void>
  onTest?: (data: any, parserConfig: ParserConfigType) => Promise<any>
  loading?: boolean
  sampleData?: any
  configId?: string
}

// 支持的解析器策略列表
const PARSER_STRATEGIES = [
  { value: 'deepseek', label: 'DeepSeek', icon: '🧠' },
  { value: 'moonshot', label: 'Moonshot (月之暗面)', icon: '🌙' },
  { value: 'aihubmix', label: 'AIHubMix', icon: '🔌' },
  { value: 'openrouter', label: 'OpenRouter', icon: '🌐' },
  { value: 'volcengine', label: 'VolcEngine (火山引擎)', icon: '🌋' }
]

export const ParserConfig: React.FC<ParserConfigProps> = ({
  initialData,
  onChange,
  onTest,
  loading = false,
  sampleData: externalSampleData,
  configId
}) => {
  const parserFormState = useFormStore(selectParserFormState)
  const updateParserForm = useFormStore(selectUpdateParserForm)
  const sampleData = externalSampleData || null

  // 避免未使用变量警告
  void configId

  // 检测是否为预设配置（如果已经设置了parserType）
  const isPreset = !!(initialData as any)?.parserType

  // 初始化表单数据
  const [formData, setFormData] = React.useState(() => ({
    parserType: (initialData as any)?.parserType || (parserFormState.parser as any)?.parserType || ''
  }))

  // 更新策略类型
  const updateParserType = (value: string) => {
    const newData = { parserType: value }
    setFormData(newData)
    triggerSave(newData)
    updateParserForm({ parser: newData })
  }

  const { triggerSave, isSaving } = useAutoSave({
    delay: 1000,
    onSave: onChange,
    onSuccess: () => {
      console.log('解析器配置已自动保存')
    },
    onError: (error) => {
      console.error('自动保存失败:', error)
      toast.error('自动保存失败: ' + error.message)
    }
  })

  // 添加 useEffect 监听 sampleData 变化
  useEffect(() => {
    if (!externalSampleData) return
    // 如果有测试数据，检查并保存到 store
    const setSampleData = useFormStore.getState().setSampleData
    setSampleData(externalSampleData)
  }, [externalSampleData])

  const handleTest = async () => {
    if (!onTest) return

    // 如果没有测试数据且不是加载中，弹出提示
    if (!sampleData && !loading) {
      toast.loading('正在获取 API 数据并测试解析器...', { id: 'test-parser-loading' })
    }

    try {
      const parserConfig = {
        parserType: formData.parserType
      }
      // 将 sampleData 作为第一个参数，parserConfig 作为第二个参数
      const result = await onTest(sampleData, parserConfig)
      toast.dismiss('test-parser-loading')

      if (result?.success && result?.parsed) {
        toast.success('解析器测试成功')
      } else {
        toast.error(result?.error || '解析失败')
      }
    } catch (err) {
      toast.dismiss('test-parser-loading')
      toast.error(err instanceof Error ? err.message : '测试失败')
    }
  }

  return (
    <div className="space-y-4 group">
      {/* 保存状态指示器 */}
      <div className="text-xs text-muted-foreground text-right h-4">
        {isSaving && <span className="text-primary italic">保存中...</span>}
      </div>

      {/* 预设配置提示 */}
      {isPreset && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h4 className="font-bold text-primary mb-1">使用预设模板配置</h4>
              <p className="text-sm text-foreground/80">
                解析器已根据服务提供商自动配置，无需手动设置。您可以直接进行测试或启动监控。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 解析器策略选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-foreground ml-1">选择解析器策略</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PARSER_STRATEGIES.map((strategy) => {
            const isSelected = formData.parserType === strategy.value
            return (
              <button
                key={strategy.value}
                type="button"
                onClick={() => updateParserType(strategy.value)}
                className={`flex items-center justify-between gap-3 p-3 text-left rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{strategy.icon}</span>
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {strategy.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {!formData.parserType && (
          <p className="text-sm text-muted-foreground">请选择一个解析器策略</p>
        )}
      </div>

      {/* 测试数据提示 */}
      {sampleData && (
        <div className="bg-accent border border-border rounded-md p-3">
          <div className="text-sm font-medium mb-1 text-accent-foreground">可用测试数据:</div>
          <pre className="text-xs bg-card border border-border text-foreground p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </div>
      )}

      {/* 按钮组（移除保存按钮，只保留测试按钮） */}
      {onTest && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={loading || !formData.parserType}
            className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all"
          >
            {loading ? '正在获取并解析...' : sampleData ? '测试解析器' : '请求并测试解析'}
          </button>
        </div>
      )}
    </div>
  )
}
