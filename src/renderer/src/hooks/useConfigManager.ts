import { useState, useEffect, useCallback } from 'react'
import { BalanceMonitorConfig, ConfigFormState } from '../types'
import { useElectronAPI } from './useElectronAPI'

export const useConfigManager = () => {
  const { api } = useElectronAPI()
  const [configs, setConfigs] = useState<BalanceMonitorConfig[]>([])
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载配置
  const loadConfigs = useCallback(async () => {
    if (!api) return

    setLoading(true)
    setError(null)
    try {
      const result = await api.loadConfig()
      setConfigs(result.configs)
      setActiveConfigId(result.activeConfigId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [api])

  // 保存配置
  const saveConfig = useCallback(
    async (config: Partial<BalanceMonitorConfig>) => {
      if (!api) return null

      setLoading(true)
      setError(null)
      try {
        const saved = await api.saveConfig(config)
        await loadConfigs() // 重新加载列表
        return saved
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存配置失败')
        return null
      } finally {
        setLoading(false)
      }
    },
    [api, loadConfigs]
  )

  // 删除配置
  const deleteConfig = useCallback(
    async (configId: string) => {
      if (!api) return false

      setLoading(true)
      setError(null)
      try {
        const success = await api.deleteConfig(configId)
        if (success) {
          await loadConfigs()
          // 如果删除的是活动配置，清除活动状态
          if (activeConfigId === configId) {
            setActiveConfigId(null)
          }
        }
        return success
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除配置失败')
        return false
      } finally {
        setLoading(false)
      }
    },
    [api, loadConfigs, activeConfigId]
  )

  // 设置活动配置
  const setActiveConfig = useCallback(
    async (configId: string) => {
      if (!api) return false

      setLoading(true)
      setError(null)
      try {
        const success = await api.setActiveConfig(configId)
        if (success) {
          setActiveConfigId(configId)
        }
        return success
      } catch (err) {
        setError(err instanceof Error ? err.message : '设置活动配置失败')
        return false
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  // 导出配置
  const exportConfig = useCallback(
    async (configId: string) => {
      if (!api) return null

      try {
        const json = await api.exportConfig(configId)
        return json
      } catch (err) {
        setError(err instanceof Error ? err.message : '导出配置失败')
        return null
      }
    },
    [api]
  )

  // 导入配置
  const importConfig = useCallback(
    async (jsonString: string) => {
      if (!api) return null

      setLoading(true)
      setError(null)
      try {
        const config = await api.importConfig(jsonString)
        if (config) {
          await loadConfigs()
        }
        return config
      } catch (err) {
        setError(err instanceof Error ? err.message : '导入配置失败')
        return null
      } finally {
        setLoading(false)
      }
    },
    [api, loadConfigs]
  )

  // 验证配置
  const validateConfig = useCallback(
    async (config: any) => {
      if (!api) return { valid: false, errors: ['API不可用'] }

      try {
        return await api.validateConfig(config)
      } catch (err) {
        return { valid: false, errors: [err instanceof Error ? err.message : '验证失败'] }
      }
    },
    [api]
  )

  // 获取活动配置
  const getActiveConfig = useCallback(() => {
    return configs.find((c) => c.id === activeConfigId) || null
  }, [configs, activeConfigId])

  // 格式化为表单状态
  const toFormState = useCallback((config: BalanceMonitorConfig): ConfigFormState => {
    return {
      name: config.name,
      api: {
        url: config.api.url,
        method: config.api.method,
        headers: (config.api.headers || []).map((h) => ({ key: h.key, value: h.value })),
        body: config.api.body || '',
        timeout: config.api.timeout || 10000
      },
      parser: {
        balancePath: config.parser.balancePath || '',
        currencyPath: config.parser.currencyPath || '',
        availablePath: config.parser.availablePath || '',
        customParser: config.parser.customParser || ''
      },
      monitoring: {
        enabled: config.monitoring.enabled,
        interval: config.monitoring.interval
      },
      thresholds: {
        warning: config.thresholds.warning,
        danger: config.thresholds.danger,
        currency: config.thresholds.currency
      }
    }
  }, [])

  // 从表单状态转换
  const fromFormState = useCallback(
    (formState: ConfigFormState, existingId?: string): Partial<BalanceMonitorConfig> => {
      return {
        id: existingId,
        name: formState.name,
        api: {
          url: formState.api.url,
          method: formState.api.method,
          headers: formState.api.headers.filter((h) => h.key && h.value),
          body: formState.api.body || undefined,
          timeout: formState.api.timeout
        },
        parser: {
          balancePath: formState.parser.balancePath,
          currencyPath: formState.parser.currencyPath || undefined,
          availablePath: formState.parser.availablePath || undefined,
          customParser: formState.parser.customParser || undefined
        },
        monitoring: {
          enabled: formState.monitoring.enabled,
          interval: formState.monitoring.interval
        },
        thresholds: {
          warning: formState.thresholds.warning,
          danger: formState.thresholds.danger,
          currency: formState.thresholds.currency
        },
        enabled: true
      }
    },
    []
  )

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  return {
    configs,
    activeConfigId,
    activeConfig: getActiveConfig(),
    loading,
    error,
    loadConfigs,
    saveConfig,
    deleteConfig,
    setActiveConfig,
    exportConfig,
    importConfig,
    validateConfig,
    toFormState,
    fromFormState,
    clearError: () => setError(null)
  }
}
