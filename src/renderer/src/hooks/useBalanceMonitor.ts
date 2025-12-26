import { useState, useEffect, useCallback } from 'react'
import { MonitorStatus, APIRequest, ParserConfig, TestResult } from '../types'
import { useElectronAPI } from './useElectronAPI'

export const useBalanceMonitor = () => {
  const { api } = useElectronAPI()
  const [statuses, setStatuses] = useState<MonitorStatus[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastBalance, setLastBalance] = useState<number | null>(null)
  const [lastCurrency, setLastCurrency] = useState<string>('¥')

  // 加载监控状态
  const loadStatuses = useCallback(async () => {
    if (!api) return

    try {
      const result = await api.getAllStatuses()
      setStatuses(result)
      setIsMonitoring(result.some((s) => s.status === 'running'))
    } catch (err) {
      console.error('加载状态失败:', err)
    }
  }, [api])

  // 启动监控
  const startMonitoring = useCallback(async () => {
    if (!api) return { success: false, message: 'API不可用' }

    setLoading(true)
    setError(null)
    try {
      const result = await api.startMonitoring()
      if (result.success) {
        setIsMonitoring(true)
        await loadStatuses()
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '启动监控失败'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [api, loadStatuses])

  // 停止监控
  const stopMonitoring = useCallback(async () => {
    if (!api) return { success: false, message: 'API不可用' }

    setLoading(true)
    setError(null)
    try {
      const result = await api.stopMonitoring()
      if (result.success) {
        setIsMonitoring(false)
        await loadStatuses()
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '停止监控失败'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [api, loadStatuses])

  // 手动查询
  const manualQuery = useCallback(async () => {
    if (!api) return { success: false, message: 'API不可用' }

    setLoading(true)
    setError(null)
    try {
      const result = await api.manualQuery()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '查询失败'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [api])

  // 测试API连接
  const testApiConnection = useCallback(
    async (request: APIRequest): Promise<TestResult> => {
      if (!api) return { success: false, message: 'API不可用' }

      setLoading(true)
      setError(null)
      try {
        const result = await api.testApiConnection(request)
        if (result.success) {
          return {
            success: true,
            message: '连接成功',
            data: result.data,
            responseTime: result.responseTime
          }
        } else {
          return {
            success: false,
            message: result.error || '连接失败'
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '测试失败'
        setError(message)
        return { success: false, message }
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  // 测试解析器
  const testParser = useCallback(
    async (data: any, parserConfig: ParserConfig): Promise<TestResult> => {
      if (!api) return { success: false, message: 'API不可用' }

      setLoading(true)
      setError(null)
      try {
        const result = await api.testParser(data, parserConfig)
        if (result.success && result.result) {
          return {
            success: true,
            message: '解析成功',
            data: result.result.raw,
            parsed: result.result
          }
        } else {
          return {
            success: false,
            message: result.error || '解析失败'
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '测试失败'
        setError(message)
        return { success: false, message }
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  // 启动单个配置监控
  const startConfigMonitor = useCallback(
    async (configId: string) => {
      if (!api) return { success: false, message: 'API不可用' }

      setLoading(true)
      setError(null)
      try {
        const result = await api.startConfigMonitor(configId)
        await loadStatuses()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : '启动失败'
        setError(message)
        return { success: false, message }
      } finally {
        setLoading(false)
      }
    },
    [api, loadStatuses]
  )

  // 停止单个配置监控
  const stopConfigMonitor = useCallback(
    async (configId: string) => {
      if (!api) return false

      setLoading(true)
      setError(null)
      try {
        const result = await api.stopConfigMonitor(configId)
        await loadStatuses()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : '停止失败'
        setError(message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [api, loadStatuses]
  )

  // 获取状态统计
  const getStatusStats = useCallback(() => {
    const total = statuses.length
    const running = statuses.filter((s) => s.status === 'running').length
    const error = statuses.filter((s) => s.status === 'error').length
    const lastRun = statuses.reduce(
      (latest, s) => {
        if (!s.lastRun) return latest
        if (!latest) return s.lastRun
        return new Date(s.lastRun) > new Date(latest) ? s.lastRun : latest
      },
      null as string | null
    )

    return { total, running, error, lastRun }
  }, [statuses])

  // 获取当前余额状态
  const getCurrentBalanceStatus = useCallback(() => {
    if (lastBalance === null) return null

    const activeConfig = statuses.find((s) => s.status === 'running')
    if (!activeConfig) return null

    // 这里需要从配置中获取阈值，暂时返回基础信息
    return {
      balance: lastBalance,
      currency: lastCurrency,
      timestamp: new Date().toISOString()
    }
  }, [lastBalance, lastCurrency, statuses])

  // 监听余额更新事件
  useEffect(() => {
    if (!api) return

    const unsubscribe = api.onBalanceUpdate((data: any) => {
      if (data.success && data.balance !== undefined) {
        setLastBalance(data.balance)
        setLastCurrency(data.currency || '¥')
      }
      // 重新加载状态
      loadStatuses()
    })

    return unsubscribe
  }, [api, loadStatuses])

  // 监听状态变化事件
  useEffect(() => {
    if (!api) return

    const unsubscribe = api.onStatusChange((data: any) => {
      setStatuses((prev) => {
        const index = prev.findIndex((s) => s.configId === data.configId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = data
          return updated
        }
        return [...prev, data]
      })
      setIsMonitoring(() => {
        const hasRunning = [...statuses, data].some((s) => s.status === 'running')
        return hasRunning
      })
    })

    return unsubscribe
  }, [api, statuses])

  // 定期刷新状态
  useEffect(() => {
    const interval = setInterval(() => {
      loadStatuses()
    }, 5000) // 每5秒刷新一次

    return () => clearInterval(interval)
  }, [loadStatuses])

  return {
    statuses,
    isMonitoring,
    loading,
    error,
    lastBalance,
    lastCurrency,
    loadStatuses,
    startMonitoring,
    stopMonitoring,
    manualQuery,
    testApiConnection,
    testParser,
    startConfigMonitor,
    stopConfigMonitor,
    getStatusStats,
    getCurrentBalanceStatus,
    clearError: () => setError(null)
  }
}
