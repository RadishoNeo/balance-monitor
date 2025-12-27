import React, { useEffect, useCallback } from 'react'
import { ParserConfig as ParserConfigType, BalanceInfoMapping } from '../types'
import { toast } from 'sonner'
import { useAutoSave } from '@renderer/hooks'
import { useFormStore, selectParserFormState, selectUpdateParserForm } from '@renderer/store'

interface ParserConfigProps {
  initialData?:
  | (Partial<ParserConfigType> & {
    isAvailablePath?: string
    balanceMappings?: BalanceInfoMapping[]
    isPreset?: boolean
  })
  | null
  onChange: (data: any) => Promise<void>
  onTest?: (data: any, sampleData: any) => Promise<any>
  loading?: boolean
  sampleData?: any
  configId?: string
}

const findPossiblePaths = (obj: any, prefix: string): string[] => {
  let paths: string[] = []

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key in obj) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      paths.push(currentPath)
      paths = paths.concat(findPossiblePaths(obj[key], currentPath))
    }
  } else if (Array.isArray(obj) && obj.length > 0) {
    // 对于数组，只检查第一个元素
    paths = paths.concat(findPossiblePaths(obj[0], `${prefix}[0]`))
  }

  return paths
}

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

  // 检测是否为预设配置
  const isPreset = (initialData as any)?.isPreset || false

  // 初始化表单数据
  const [formData, setFormData] = React.useState(() => ({
    isAvailablePath: initialData?.isAvailablePath || parserFormState.parser?.isAvailablePath || '',
    balanceMappings: initialData?.balanceMappings ||
      parserFormState.parser?.balanceMappings || [
        {
          currency: '',
          total_balance: '',
          granted_balance: '',
          topped_up_balance: ''
        }
      ],
    customParser: initialData?.customParser || parserFormState.parser?.customParser || '',
    isCustomParser: !!(initialData?.customParser || parserFormState.parser?.customParser)
  }))

  const [showCustom, setShowCustom] = React.useState(
    !!(initialData?.customParser || parserFormState.parser?.customParser)
  )

  // 同步到 Zustand store
  useEffect(() => {
    updateParserForm({
      parser: {
        isAvailablePath: formData.isAvailablePath,
        balanceMappings: formData.balanceMappings,
        customParser: formData.customParser
      }
    })
  }, [formData, updateParserForm])

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

  // 加载配置模板

  const autoDetectPaths = useCallback(() => {
    if (!sampleData) return
    const paths = findPossiblePaths(sampleData, '')
    const detected: { isAvailable?: string; balancePaths: string[] } = {
      isAvailable: undefined,
      balancePaths: []
    }

    // 检测 is_available 或类似字段
    const availabilityKeywords = ['is_available', 'status', 'available', 'active', 'enabled']
    for (const path of paths) {
      const lowerPath = path.toLowerCase()
      if (availabilityKeywords.some((keyword) => lowerPath.includes(keyword))) {
        detected.isAvailable = path
        break
      }
    }

    // 检测 余额相关路径
    const balanceKeywords = ['balance', 'amount', 'credit', 'total', 'available_balance']
    for (const path of paths) {
      const lowerPath = path.toLowerCase()
      if (balanceKeywords.some((keyword) => lowerPath.includes(keyword))) {
        detected.balancePaths.push(path)
      }
    }

    if (detected.isAvailable || detected.balancePaths.length > 0) {
      toast.info(`检测到可能的路径: ${JSON.stringify(detected, null, 2)}`)
    }
  }, [sampleData])
  const addBalanceMapping = () => {
    const newData = {
      ...formData,
      balanceMappings: [
        ...formData.balanceMappings,
        {
          currency: '',
          total_balance: '',
          granted_balance: '',
          topped_up_balance: ''
        }
      ]
    }
    setFormData(newData)
    triggerSave(newData)
  }

  const removeBalanceMapping = (index: number) => {
    const newData = {
      ...formData,
      balanceMappings: formData.balanceMappings.filter((_: any, i: number) => i !== index)
    }
    setFormData(newData)
    triggerSave(newData)
  }

  const updateBalanceMapping = (index: number, field: keyof BalanceInfoMapping, value: string) => {
    const newData = {
      ...formData,
      balanceMappings: formData.balanceMappings.map((mapping: BalanceInfoMapping, i: number) =>
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }
    setFormData(newData)
    triggerSave(newData)
  }

  const updateField = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    triggerSave(newData)
  }

  const toggleCustom = (useCustom: boolean) => {
    setShowCustom(useCustom)
    const newData = { ...formData, isCustomParser: useCustom }
    setFormData(newData)
    triggerSave(newData)
  }

  const handleTest = async () => {
    if (!onTest) return

    // 如果没有测试数据且不是加载中，弹出提示
    if (!sampleData && !loading) {
      toast.loading('正在获取 API 数据并测试解析器...', { id: 'test-parser-loading' })
    }

    try {
      const testData = {
        ...(showCustom
          ? { customParser: formData.customParser }
          : {
            isAvailablePath: formData.isAvailablePath,
            balanceMappings: formData.balanceMappings
          })
      }
      // 将 sampleData 作为第一个参数，配置 (testData) 作为第二个参数，以匹配 App.tsx 的 handleTestParser
      const result = await onTest(sampleData, testData)
      toast.dismiss('test-parser-loading')
      //{"success":true,"message":"解析成功","data":{"is_available":true,"balance_infos":[{"currency":"CNY","total_balance":"44.35","granted_balance":"0.00","topped_up_balance":"44.35"}]},"parsed":{"balance":44.35,"grantedBalance":0,"toppedUpBalance":44.35,"currency":"CNY","isAvailable":true,"raw":{"is_available":true,"balance_infos":[{"currency":"CNY","total_balance":"44.35","granted_balance":"0.00","topped_up_balance":"44.35"}]}}}'
      if (result?.success && result?.data) {
        toast.success('解析器测试成功')
      } else {
        toast.error(result?.error || '解析失败')
      }
    } catch (err) {
      toast.dismiss('test-parser-loading')
      toast.error(err instanceof Error ? err.message : '测试失败')
    }
  }

  const generateExampleCode = () => {
    if (!sampleData) return '请先测试API获取数据'

    const example = `// 示例数据结构:
${JSON.stringify(sampleData, null, 2)}

// 字段映射示例:
{
  "isAvailablePath": "is_available", // 是否可用字段路径
  "balanceMappings": [{
    "currency": "currency",              // 货币类型字段
    "total_balance": "total_balance",    // 总余额字段
    "granted_balance": "granted_balance", // 已授予余额字段
    "topped_up_balance": "topped_up_balance" // 已充值余额字段
  }]
}

// 路径语法示例:
// - 简单路径: is_available
// - 嵌套路径: data.available_balance
// - 数组路径: balance_infos[0].total_balance`

    return example
  }
  // 当 sampleData 更新时，尝试自动推断解析路径
  useEffect(() => {
    if (sampleData && !formData.isAvailablePath && !formData.balanceMappings[0]?.total_balance) {
      autoDetectPaths()
    }
  }, [sampleData, formData.isAvailablePath, formData.balanceMappings, autoDetectPaths])

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

      {/* 解析模式选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-foreground ml-1">解析模式</label>
        <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => toggleCustom(false)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-200 rounded-lg ${!showCustom
              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <span className="text-base">📋</span>
            字段映射
          </button>
          <button
            type="button"
            onClick={() => toggleCustom(true)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-200 rounded-lg ${showCustom
              ? 'bg-primary text-primary-foreground shadow-sm scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
          >
            <span className="text-base">💻</span>
            自定义解析器
          </button>
        </div>
      </div>

      {/* 字段映射模式 */}
      {!showCustom && (
        <>
          {/* 可用状态路径 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              服务可用状态字段路径
            </label>
            <input
              type="text"
              value={formData.isAvailablePath}
              onChange={(e) => updateField('isAvailablePath', e.target.value)}
              placeholder="is_available"
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              例如: is_available, status, success
            </p>
          </div>

          {/* 余额信息映射 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-foreground">余额信息字段映射</label>
              <button
                type="button"
                onClick={addBalanceMapping}
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90"
              >
                + 添加
              </button>
            </div>

            {formData.balanceMappings.map((mapping: BalanceInfoMapping, index: number) => (
              <div key={index} className="border border-border bg-card rounded-md p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">余额信息 #{index + 1}</span>
                  {formData.balanceMappings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBalanceMapping(index)}
                      className="text-destructive hover:opacity-80 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">
                      货币类型字段
                    </label>
                    <input
                      type="text"
                      value={mapping.currency}
                      onChange={(e) => updateBalanceMapping(index, 'currency', e.target.value)}
                      placeholder="currency"
                      className="w-full px-2 py-1 border border-border bg-muted/30 text-foreground rounded text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">不填写则默认为 CNY</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">
                      总余额字段（必填）
                    </label>
                    <input
                      type="text"
                      value={mapping.total_balance}
                      onChange={(e) => updateBalanceMapping(index, 'total_balance', e.target.value)}
                      placeholder="total_balance"
                      className="w-full px-2 py-1 border border-border bg-muted/30 text-foreground rounded text-sm font-mono"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      例如: total_balance, available_balance
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">
                      已授予余额字段
                    </label>
                    <input
                      type="text"
                      value={mapping.granted_balance}
                      onChange={(e) =>
                        updateBalanceMapping(index, 'granted_balance', e.target.value)
                      }
                      placeholder="granted_balance"
                      className="w-full px-2 py-1 border border-border bg-muted/30 text-foreground rounded text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      例如: voucher_balance, bonus_balance
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">
                      已充值余额字段
                    </label>
                    <input
                      type="text"
                      value={mapping.topped_up_balance}
                      onChange={(e) =>
                        updateBalanceMapping(index, 'topped_up_balance', e.target.value)
                      }
                      placeholder="topped_up_balance"
                      className="w-full px-2 py-1 border border-border bg-muted/30 text-foreground rounded text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      例如: cash_balance, deposited_balance
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 自定义解析器模式 */}
      {showCustom && (
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">自定义解析器</label>
          <textarea
            value={formData.customParser}
            onChange={(e) => updateField('customParser', e.target.value)}
            placeholder={`// 解析函数示例:
const result = {
  balances: data.balance_infos.map(info => ({
    currency: info.currency || 'CNY',
    total: info.total_balance,
    granted: info.granted_balance || 0,
    toppedUp: info.topped_up_balance || 0
  })),
  isAvailable: data.is_available || false
};
return result;`}
            rows={10}
            className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            必须返回对象，包含: balances数组(含currency, total, granted, toppedUp) 和 isAvailable
          </p>
        </div>
      )}

      {/* 测试数据提示 */}
      {sampleData && (
        <div className="bg-accent border border-border rounded-md p-3">
          <div className="text-sm font-medium mb-1 text-accent-foreground">可用测试数据:</div>
          <pre className="text-xs bg-card border border-border text-foreground p-2 rounded overflow-x-auto">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </div>
      )}

      {/* 示例代码 */}
      <div className="bg-muted/50 border border-border rounded-md p-3">
        <div className="text-sm font-medium mb-1 text-foreground">解析器参考:</div>
        <pre className="text-xs bg-card border border-border text-foreground p-2 rounded overflow-x-auto whitespace-pre-wrap">
          {generateExampleCode()}
        </pre>
      </div>

      {/* 按钮组（移除保存按钮，只保留测试按钮） */}
      {onTest && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 disabled:opacity-50 font-bold transition-all"
          >
            {loading ? '正在获取并解析...' : sampleData ? '测试解析' : '请求并测试解析'}
          </button>
        </div>
      )}
    </div>
  )
}
