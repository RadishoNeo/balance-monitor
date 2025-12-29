import React, { useState } from 'react'
import { APIRequest, ParserConfig, type ParserType } from '../types'
import { toast } from 'sonner'

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
  const [parserConfig, setParserConfig] = useState<ParserConfig>(() => ({
    parserType: 'deepseek' as ParserType
  }))
  const [loading, setLoading] = useState(false)

  const handleTestAPI = async () => {
    if (!apiRequest.url) {
      toast.error('请输入API地址')
      return
    }

    setLoading(true)
    try {
      const result = await onTestAPI(apiRequest)
      if (result.success) {
        setStep(2)
        toast.success('API连接成功')
      } else {
        // 测试失败，只显示 toast
        toast.error(result.error || 'API测试失败')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'API测试失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTestParser = async () => {
    if (!apiRequest.url) {
      toast.error('请先配置并测试API')
      return
    }

    if (!parserConfig.parserType) {
      toast.error('请选择一个解析器策略')
      return
    }

    setLoading(true)
    try {
      const result = await onTestAPI(apiRequest)
      if (!result.success || !result.data) {
        toast.error('API测试失败，无法验证解析器')
        setLoading(false)
        return
      }

      const parseResult = await onTestParser(result.data, parserConfig)
      if (parseResult.success && parseResult.result) {
        toast.success('解析成功')
      } else {
        toast.error(parseResult.error || '解析失败2')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解析测试失败')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
  }

  return (
    <div className="space-y-4">
      {/* 步骤指示器 - 现代化 Segmented 风格 */}
      <div className="flex justify-between items-center bg-muted/30 p-2 rounded-2xl">
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              step >= 1
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                : 'bg-secondary text-secondary-foreground opacity-50'
            }`}
          >
            <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-[10px]">
              1
            </span>
            API测试
          </div>
          <div
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              step >= 2
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                : 'bg-secondary text-secondary-foreground opacity-50'
            }`}
          >
            <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-[10px]">
              2
            </span>
            解析器配置
          </div>
        </div>
        {step > 1 && (
          <button
            onClick={reset}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-4 py-2 hover:bg-primary/5 rounded-lg"
          >
            ↺ 重置流程
          </button>
        )}
      </div>

      {/* 步骤1: API配置 */}
      {(step === 1 || step === 2) && (
        <div className="space-y-3">
          <div className="text-lg font-medium text-foreground">步骤1: 配置API</div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">API地址</label>
            <input
              type="url"
              value={apiRequest.url}
              onChange={(e) => setApiRequest((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/balance"
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">请求方法</label>
            <select
              value={apiRequest.method}
              onChange={(e) =>
                setApiRequest((prev) => ({ ...prev, method: e.target.value as any }))
              }
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Authorization Header (可选)
            </label>
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
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>

          <button
            onClick={handleTestAPI}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {loading ? '测试中...' : '测试API连接'}
          </button>
        </div>
      )}

      {/* 步骤2: 解析器配置 */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="text-lg font-medium text-foreground">步骤2: 配置解析器</div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">解析器策略</label>
            <select
              value={parserConfig.parserType}
              onChange={(e) =>
                setParserConfig((prev) => ({ ...prev, parserType: e.target.value as ParserType }))
              }
              className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">请选择</option>
              <option value="deepseek">DeepSeek</option>
              <option value="moonshot">Moonshot (月之暗面)</option>
              <option value="aihubmix">AIHubMix</option>
              <option value="openrouter">OpenRouter</option>
              <option value="volcengine">VolcEngine (火山引擎)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              选择对应服务提供商的解析策略
            </p>
          </div>


          <button
            onClick={handleTestParser}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {loading ? '测试中...' : '测试解析器'}
          </button>
        </div>
      )}
    </div>
  )
}
