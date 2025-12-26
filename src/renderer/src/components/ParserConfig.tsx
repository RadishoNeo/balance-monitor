import React, { useState } from 'react'
import { ParserConfig as ParserConfigType } from '../types'

interface ParserConfigProps {
  initialData?: Partial<ParserConfigType>
  onSubmit: (data: ParserConfigType) => Promise<void>
  onTest?: (data: ParserConfigType, sampleData: any) => Promise<any>
  loading?: boolean
  sampleData?: any
}

export const ParserConfig: React.FC<ParserConfigProps> = ({
  initialData,
  onSubmit,
  onTest,
  loading = false,
  sampleData
}) => {
  const [formData, setFormData] = useState<ParserConfigType>({
    balancePath: initialData?.balancePath || '',
    currencyPath: initialData?.currencyPath || '',
    availablePath: initialData?.availablePath || '',
    customParser: initialData?.customParser || ''
  })

  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(!!initialData?.customParser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证
    if (!showCustom && !formData.balancePath) {
      setError('余额解析路径不能为空')
      return
    }

    if (showCustom && !formData.customParser?.trim()) {
      setError('自定义解析器不能为空')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    }
  }

  const handleTest = async () => {
    if (!onTest || !sampleData) {
      setError('请先提供测试数据')
      return
    }

    setError(null)
    setTestResult(null)

    try {
      const result = await onTest(formData, sampleData)
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败')
    }
  }

  const generateExampleCode = () => {
    if (!sampleData) return '请先测试API获取数据'

    const example = `// 示例数据结构:
${JSON.stringify(sampleData, null, 2)}

// 解析路径示例:
// 1. 简单路径: balance
// 2. 嵌套路径: user.account.balance
// 3. 数组路径: balance_infos[0].total_balance

// 自定义解析器示例:
const result = {
  balance: data.balance_infos[0].total_balance,
  currency: data.balance_infos[0].currency || "CNY",
  isAvailable: data.is_available
};
return result;`

    return example
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 解析模式选择 */}
      <div>
        <label className="block text-sm font-medium mb-2">解析模式</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!showCustom}
              onChange={() => setShowCustom(false)}
              className="cursor-pointer"
            />
            <span className="text-sm">JSON路径</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={showCustom}
              onChange={() => setShowCustom(true)}
              className="cursor-pointer"
            />
            <span className="text-sm">自定义解析器</span>
          </label>
        </div>
      </div>

      {/* JSON路径模式 */}
      {!showCustom && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">余额路径 (必填)</label>
            <input
              type="text"
              value={formData.balancePath}
              onChange={(e) => setFormData((prev) => ({ ...prev, balancePath: e.target.value }))}
              placeholder="balance_infos[0].total_balance"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              支持: balance, user.balance, items[0].value
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">货币路径 (可选)</label>
            <input
              type="text"
              value={formData.currencyPath}
              onChange={(e) => setFormData((prev) => ({ ...prev, currencyPath: e.target.value }))}
              placeholder="balance_infos[0].currency"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">可用状态路径 (可选)</label>
            <input
              type="text"
              value={formData.availablePath}
              onChange={(e) => setFormData((prev) => ({ ...prev, availablePath: e.target.value }))}
              placeholder="is_available"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </>
      )}

      {/* 自定义解析器模式 */}
      {showCustom && (
        <div>
          <label className="block text-sm font-medium mb-1">自定义解析器</label>
          <textarea
            value={formData.customParser}
            onChange={(e) => setFormData((prev) => ({ ...prev, customParser: e.target.value }))}
            placeholder="const result = { balance: data.balance, currency: 'CNY', isAvailable: true }; return result;"
            rows={8}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            必须返回对象: {`{ balance: number, currency?: string, isAvailable?: boolean }`}
          </p>
        </div>
      )}

      {/* 测试数据提示 */}
      {sampleData && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-sm font-medium mb-1">可用测试数据:</div>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </div>
      )}

      {/* 示例代码 */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="text-sm font-medium mb-1">解析器参考:</div>
        <pre className="text-xs bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap">
          {generateExampleCode()}
        </pre>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* 测试结果 */}
      {testResult && (
        <div
          className={`border rounded-md p-3 text-sm ${
            testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="font-medium mb-1">{testResult.success ? '✓ 解析成功' : '✗ 解析失败'}</div>
          {testResult.success && testResult.result && (
            <>
              <div className="text-xs grid grid-cols-2 gap-2 mt-2">
                <div>
                  余额: <span className="font-mono">{testResult.result.balance}</span>
                </div>
                <div>
                  货币: <span className="font-mono">{testResult.result.currency}</span>
                </div>
                <div>
                  可用:{' '}
                  <span className="font-mono">{testResult.result.isAvailable ? '是' : '否'}</span>
                </div>
              </div>
            </>
          )}
          {testResult.error && <div className="text-xs text-red-600 mt-1">{testResult.error}</div>}
        </div>
      )}

      {/* 按钮组 */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存解析器'}
        </button>
        {onTest && (
          <button
            type="button"
            onClick={handleTest}
            disabled={loading || !sampleData}
            className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            测试解析
          </button>
        )}
      </div>
    </form>
  )
}
