import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BalanceMonitorConfig } from '../types/index'

interface ConfigStore {
  // 配置列表
  configs: BalanceMonitorConfig[]

  // 活动配置 ID
  activeConfigId: string | null

  // 加载状态
  loading: boolean

  // 错误信息
  error: string | null

  // 操作方法
  setConfigs: (configs: BalanceMonitorConfig[]) => void
  setActiveConfigId: (configId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // 计算属性 - 获取活动配置
  getActiveConfig: () => BalanceMonitorConfig | null
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      configs: [],
      activeConfigId: null,
      loading: false,
      error: null,

      // 设置配置列表
      setConfigs: (configs) =>
        set((state) => ({
          ...state,
          configs
        })),

      // 设置活动配置 ID
      setActiveConfigId: (configId) =>
        set((state) => ({
          ...state,
          activeConfigId: configId
        })),

      // 设置加载状态
      setLoading: (loading) =>
        set((state) => ({
          ...state,
          loading
        })),

      // 设置错误信息
      setError: (error) =>
        set((state) => ({
          ...state,
          error
        })),

      // 清除错误
      clearError: () =>
        set((state) => ({
          ...state,
          error: null
        })),

      // 获取活动配置
      getActiveConfig: () => {
        const state = get()
        return state.configs.find((c) => c.id === state.activeConfigId) || null
      }
    }),
    {
      name: 'balance-monitor-configs',
      partialize: (state) => ({
        // 只持久化配置数据和活动配置 ID
        configs: state.configs,
        activeConfigId: state.activeConfigId
      })
    }
  )
)

// 选择器函数
export const selectConfigs = (state: ConfigStore) => state.configs
export const selectActiveConfigId = (state: ConfigStore) => state.activeConfigId
export const selectActiveConfig = (state: ConfigStore) => state.getActiveConfig()
export const selectLoading = (state: ConfigStore) => state.loading
export const selectError = (state: ConfigStore) => state.error

// 操作方法选择器
export const selectSetConfigs = (state: ConfigStore) => state.setConfigs
export const selectSetActiveConfigId = (state: ConfigStore) => state.setActiveConfigId
export const selectSetLoading = (state: ConfigStore) => state.setLoading
export const selectSetError = (state: ConfigStore) => state.setError
export const selectClearError = (state: ConfigStore) => state.clearError
