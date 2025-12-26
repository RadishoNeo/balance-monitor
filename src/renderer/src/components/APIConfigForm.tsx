import React, { useState } from 'react'
import { APIRequest } from '../types'

interface APIConfigFormProps {
  initialData?: Partial<APIRequest>
  onSubmit: (data: APIRequest) => Promise<void>
  onTest?: (data: APIRequest) => Promise<any>
  loading?: boolean
}

export const APIConfigForm: React.FC<APIConfigFormProps> = ({
  initialData,
  onSubmit,
  onTest,
  loading = false
}) => {
  const [formData, setFormData] = useState<APIRequest>({
    url: initialData?.url || '',
    method: initialData?.method || 'GET',
    headers: initialData?.headers || [],
    body: initialData?.body || '',
    timeout: initialData?.timeout || 10000
  })

  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const addHeader = () => {
    setFormData((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }))
  }

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setFormData((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    }))
  }

  const removeHeader = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 验证
    if (!formData.url) {
      setError('API地址不能为空')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    }
  }

  const handleTest = async () => {
    if (!onTest) return
    setError(null)
    setTestResult(null)

    try {
      const result = await onTest(formData)
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API地址 */}
      <div>
        <label className="block text-sm font-medium mb-1">API地址</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
          placeholder="https://api.example.com/balance"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* 请求方法 */}
      <div>
        <label className="block text-sm font-medium mb-1">请求方法</label>
        <select
          value={formData.method}
          onChange={(e) => setFormData((prev) => ({ ...prev, method: e.target.value as any }))}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>

      {/* 请求头 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">请求头</label>
          <button
            type="button"
            onClick={addHeader}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            + 添加
          </button>
        </div>
        {formData.headers.map((header, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={header.key}
              onChange={(e) => updateHeader(index, 'key', e.target.value)}
              placeholder="Key (e.g., Authorization)"
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <input
              type="text"
              value={header.value}
              onChange={(e) => updateHeader(index, 'value', e.target.value)}
              placeholder="Value (e.g., Bearer token)"
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <button
              type="button"
              onClick={() => removeHeader(index)}
              className="text-red-500 hover:text-red-700 px-2"
            >
              ✕
            </button>
          </div>
        ))}
        {formData.headers.length === 0 && (
          <p className="text-xs text-gray-500">暂无请求头，点击"添加"新增</p>
        )}
      </div>

      {/* 请求体（POST时显示） */}
      {formData.method === 'POST' && (
        <div>
          <label className="block text-sm font-medium mb-1">请求体 (JSON)</label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
            placeholder='{"key": "value"}'
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      )}

      {/* 超时时间 */}
      <div>
        <label className="block text-sm font-medium mb-1">超时时间 (毫秒)</label>
        <input
          type="number"
          value={formData.timeout}
          onChange={(e) => setFormData((prev) => ({ ...prev, timeout: parseInt(e.target.value) }))}
          min="1000"
          step="1000"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          <div className="font-medium mb-1">{testResult.success ? '✓ 测试成功' : '✗ 测试失败'}</div>
          <div className="text-xs">
            {testResult.responseTime && `响应时间: ${testResult.responseTime}ms`}
            {testResult.message && ` - ${testResult.message}`}
          </div>
          {testResult.data && (
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* 按钮组 */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>
        {onTest && (
          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            测试连接
          </button>
        )}
      </div>
    </form>
  )
}
