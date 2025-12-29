import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BalanceMonitorConfig, MonitoringConfig, ThresholdConfig } from '../types/index'

interface FormStore {
  // API 配置表单状态
  apiFormState: Partial<BalanceMonitorConfig>

  // 解析器配置表单状态
  parserFormState: Partial<BalanceMonitorConfig>

  // 监控设置表单状态
  monitoringFormState: {
    monitoring: MonitoringConfig
    thresholds: ThresholdConfig
  }

  // 测试数据
  sampleData: any | null

  // 加载状态
  isSaving: boolean

  // 表单操作方法
  updateAPIForm: (updates: Partial<BalanceMonitorConfig>) => void
  updateParserForm: (updates: Partial<BalanceMonitorConfig>) => void
  updateMonitoringForm: (monitoring: MonitoringConfig, thresholds: ThresholdConfig) => void

  // 测试数据管理
  setSampleData: (data: any) => void
  clearSampleData: () => void

  // 保存状态
  setIsSaving: (saving: boolean) => void

  // 重置表单
  resetAPIForm: () => void
  resetParserForm: () => void
  resetMonitoringForm: () => void
  resetAllForms: () => void
}

const defaultAPIFormState: Partial<BalanceMonitorConfig> = {
  name: '',
  api: {
    url: '',
    method: 'GET',
    headers: [],
    timeout: 10000,
    body: ''
  }
}

const defaultParserFormState: Partial<BalanceMonitorConfig> = {
  parser: {
    parserType: ''
  }
}

const defaultMonitoringFormState = {
  monitoring: {
    enabled: false,
    interval: 30
  },
  thresholds: {
    warning: 50,
    danger: 10,
    currency: '¥'
  }
}

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      // 初始状态
      apiFormState: defaultAPIFormState,
      parserFormState: defaultParserFormState,
      monitoringFormState: defaultMonitoringFormState,
      sampleData: null,
      isSaving: false,

      // 更新 API 表单
      updateAPIForm: (updates) =>
        set((state) => ({
          ...state,
          apiFormState: {
            ...state.apiFormState,
            ...updates
          }
        })),

      // 更新解析器表单
      updateParserForm: (updates) =>
        set((state) => ({
          ...state,
          parserFormState: {
            ...state.parserFormState,
            ...updates
          }
        })),

      // 更新监控设置表单
      updateMonitoringForm: (monitoring, thresholds) =>
        set((state) => ({
          ...state,
          monitoringFormState: {
            monitoring,
            thresholds
          }
        })),

      // 设置测试数据
      setSampleData: (data) =>
        set((state) => ({
          ...state,
          sampleData: data
        })),

      // 清除测试数据
      clearSampleData: () =>
        set((state) => ({
          ...state,
          sampleData: null
        })),

      // 设置保存状态
      setIsSaving: (saving) =>
        set((state) => ({
          ...state,
          isSaving: saving
        })),

      // 重置 API 表单
      resetAPIForm: () =>
        set((state) => ({
          ...state,
          apiFormState: defaultAPIFormState
        })),

      // 重置解析器表单
      resetParserForm: () =>
        set((state) => ({
          ...state,
          parserFormState: defaultParserFormState
        })),

      // 重置监控设置表单
      resetMonitoringForm: () =>
        set((state) => ({
          ...state,
          monitoringFormState: defaultMonitoringFormState
        })),

      // 重置所有表单
      resetAllForms: () =>
        set({
          apiFormState: defaultAPIFormState,
          parserFormState: defaultParserFormState,
          monitoringFormState: defaultMonitoringFormState,
          sampleData: null,
          isSaving: false
        })
    }),
    {
      name: 'balance-monitor-forms',
      partialize: (state) => ({
        // 只持久化表单数据，不保存测试数据和保存状态
        apiFormState: state.apiFormState,
        parserFormState: state.parserFormState,
        monitoringFormState: state.monitoringFormState
      })
    }
  )
)

// 选择器函数 - 提高性能
export const selectAPIFormState = (state: FormStore) => state.apiFormState
export const selectParserFormState = (state: FormStore) => state.parserFormState
export const selectMonitoringFormState = (state: FormStore) => state.monitoringFormState
export const selectSampleData = (state: FormStore) => state.sampleData
export const selectIsSaving = (state: FormStore) => state.isSaving

// 操作方法选择器
export const selectUpdateAPIForm = (state: FormStore) => state.updateAPIForm
export const selectUpdateParserForm = (state: FormStore) => state.updateParserForm
export const selectUpdateMonitoringForm = (state: FormStore) => state.updateMonitoringForm
export const selectSetSampleData = (state: FormStore) => state.setSampleData
export const selectClearSampleData = (state: FormStore) => state.clearSampleData
export const selectSetIsSaving = (state: FormStore) => state.setIsSaving
export const selectResetAllForms = (state: FormStore) => state.resetAllForms
