import React, { useState } from 'react'
import { APIRequest, ParserConfig, ParsedBalance } from '../types'

interface TestConnectionProps {
  onTestAPI: (request: APIRequest) => Promise<any>
  onTestParser: (data: any, parserConfig: ParserConfig) => Promise<any>
}

export const TestConnection: React.FC<TestConnectionProps> = ({ onTestAPI, onTestParser }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [apiRequest, setApiRequest] = useState<APIRequest>({
    url: '',
    method: 'GET',
    headers: [],
    timeout: 10000
  })
  const [parserConfig, setParserConfig] = useState<ParserConfig>({
    balancePath: '',
    currencyPath: '',
    availablePath: '',
    customParser: ''
  })
  const [apiResult, setApiResult] = useState<any>(null)
  const [parserResult, setParserResult] = useState<ParsedBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTestAPI = async () => {
    if (!apiRequest.url) {
      setError('请输入API地址')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await onTestAPI(apiRequest)
      setApiResult(result)
      if (result.success) {
        setStep(2)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API测试失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTestParser = async () => {
    if (!apiResult?.data) {
      setError('请先测试API')
      return
    }

    if (!parserConfig.balancePath && !parserConfig.customParser) {
      setError('请输入解析路径或自定义解析器')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await onTestParser(apiResult.data, parserConfig)
      if (result.success && result.result) {
        setParserResult(result.result)
        setStep(3)
      } else {
        setError(result.error || '解析失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析测试失败')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setApiResult(null)
    setParserResult(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* 步骤指示器 */}
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
        <div className="flex gap-2">
          <div
            className={`px-3 py-1 rounded text-sm ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            1. API测试
          </div>
          <div
            className={`px-3 py-1 rounded text-sm ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            2. 解析器配置
          </div>
          <div
            className={`px-3 py-1 rounded text-sm ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            3. 完成
          </div>
        </div>
        {step > 1 && (
          <button onClick={reset} className="text-xs text-gray-600 hover:text-gray-800">
            重置
          </button>
        )}
      </div>

      {/* 步骤1: API配置 */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="text-lg font-medium">步骤1: 配置API</div>

          <div>
            <label className="block text-sm font-medium mb-1">API地址</label>
            <input
              type="url"
              value={apiRequest.url}
              onChange={(e) => setApiRequest((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/balance"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">请求方法</label>
            <select
              value={apiRequest.method}
              onChange={(e) =>
                setApiRequest((prev) => ({ ...prev, method: e.target.value as any }))
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Authorization Header (可选)</label>
            <input
              type="text"
              placeholder="Bearer YOUR_TOKEN"
              onChange={(e) => {
                const value = e.target.value
                setApiRequest((prev) => ({
                  ...prev,
                  headers: value ? [{ key: 'Authorization', value }] : []
                }))
              }}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleTestAPI}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试API连接'}
          </button>

          {apiResult && (
            <div
              className={`border rounded-md p-3 text-sm ${
                apiResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="font-medium mb-1">
                {apiResult.success ? '✓ API连接成功' : '✗ API连接失败'}
              </div>
              <div className="text-xs">
                {apiResult.responseTime && `响应时间: ${apiResult.responseTime}ms`}
                {apiResult.statusCode && ` | 状态码: ${apiResult.statusCode}`}
              </div>
              {apiResult.data && (
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto max-h-32">
                  {JSON.stringify(apiResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* 步骤2: 解析器配置 */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="text-lg font-medium">步骤2: 配置解析器</div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <div className="font-medium mb-1">API返回的数据:</div>
            <pre className="bg-white p-2 rounded overflow-x-auto text-xs">
              {JSON.stringify(apiResult.data, null, 2)}
            </pre>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">余额解析路径</label>
            <input
              type="text"
              value={parserConfig.balancePath}
              onChange={(e) =>
                setParserConfig((prev) => ({ ...prev, balancePath: e.target.value }))
              }
              placeholder="balance_infos[0].total_balance"
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              示例: balance, user.balance, items[0].value
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">货币路径 (可选)</label>
              <input
                type="text"
                value={parserConfig.currencyPath}
                onChange={(e) =>
                  setParserConfig((prev) => ({ ...prev, currencyPath: e.target.value }))
                }
                placeholder="balance_infos[0].currency"
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">可用状态路径 (可选)</label>
              <input
                type="text"
                value={parserConfig.availablePath}
                onChange={(e) =>
                  setParserConfig((prev) => ({ ...prev, availablePath: e.target.value }))
                }
                placeholder="is_available"
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">自定义解析器 (可选)</label>
            <textarea
              value={parserConfig.customParser}
              onChange={(e) =>
                setParserConfig((prev) => ({ ...prev, customParser: e.target.value }))
              }
              placeholder="const result = { balance: data.balance, currency: 'CNY', isAvailable: true }; return result;"
              rows={4}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleTestParser}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试解析器'}
          </button>

          {parserResult && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <div className="font-medium mb-1">✓ 解析成功</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  余额: <span className="font-mono font-bold">{parserResult.balance}</span>
                </div>
                <div>
                  货币: <span className="font-mono">{parserResult.currency}</span>
                </div>
                <div>
                  可用: <span className="font-mono">{parserResult.isAvailable ? '是' : '否'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 步骤3: 完成 */}
      {step === 3 && (
        <div className="space-y-3 text-center py-6">
          <div className="text-4xl">🎉</div>
          <div className="text-lg font-medium text-green-600">测试完成！</div>
          <div className="text-sm text-gray-600">
            您的API和解析器配置已验证通过，可以保存为监控配置。
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-left text-sm">
            <div className="font-medium mb-1">最终结果:</div>
            <div className="space-y-1">
              <div>
                余额:{' '}
                <span className="font-mono font-bold text-green-700">{parserResult?.balance}</span>
              </div>
              <div>
                货币: <span className="font-mono">{parserResult?.currency}</span>
              </div>
              <div>
                可用: <span className="font-mono">{parserResult?.isAvailable ? '是' : '否'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={reset}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            再次测试
          </button>
        </div>
      )}
    </div>
  )
}
