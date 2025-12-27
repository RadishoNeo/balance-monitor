import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PageType } from '../types/index'

export type TabType = 'config' | 'parser' | 'monitoring' | 'test'

interface UIStore {
  // 当前页面
  currentPage: PageType

  // 正在编辑的配置（使用 ID 引用，避免存储大量数据）
  editingConfigId: string | null

  // 是否显示新建配置界面
  showNewConfig: boolean

  // 配置编辑标签页
  activeTab: TabType

  // 操作方法
  setCurrentPage: (page: PageType) => void
  setEditingConfigId: (configId: string | null) => void
  setShowNewConfig: (show: boolean) => void
  setActiveTab: (tab: TabType) => void

  // 快捷方法
  startEditingConfig: (configId: string) => void
  stopEditing: () => void
  resetUI: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // 初始状态
      currentPage: 'dashboard',
      editingConfigId: null,
      showNewConfig: false,
      activeTab: 'config',

      // 设置当前页面
      setCurrentPage: (page) =>
        set((state) => ({
          ...state,
          currentPage: page
        })),

      // 设置编辑的配置 ID
      setEditingConfigId: (configId) =>
        set((state) => ({
          ...state,
          editingConfigId: configId
        })),

      // 设置是否显示新建配置界面
      setShowNewConfig: (show) =>
        set((state) => ({
          ...state,
          showNewConfig: show
        })),

      // 设置活动标签页
      setActiveTab: (tab) =>
        set((state) => ({
          ...state,
          activeTab: tab
        })),

      // 开始编辑配置
      startEditingConfig: (configId) =>
        set((state) => ({
          ...state,
          editingConfigId: configId,
          showNewConfig: true,
          activeTab: 'config'
        })),

      // 停止编辑
      stopEditing: () =>
        set((state) => ({
          ...state,
          editingConfigId: null,
          showNewConfig: false,
          activeTab: 'config'
        })),

      // 重置 UI 状态
      resetUI: () =>
        set({
          currentPage: 'dashboard',
          editingConfigId: null,
          showNewConfig: false,
          activeTab: 'config'
        })
    }),
    {
      name: 'balance-monitor-ui',
      partialize: (state) => ({
        // 只持久化页面和标签页状态
        currentPage: state.currentPage,
        activeTab: state.activeTab
        // 不持久化 editingConfigId 和 showNewConfig（这些是临时状态）
      })
    }
  )
)

// 选择器函数
export const selectCurrentPage = (state: UIStore) => state.currentPage
export const selectEditingConfigId = (state: UIStore) => state.editingConfigId
export const selectShowNewConfig = (state: UIStore) => state.showNewConfig
export const selectActiveTab = (state: UIStore) => state.activeTab

// 操作方法选择器
export const selectSetCurrentPage = (state: UIStore) => state.setCurrentPage
export const selectSetEditingConfigId = (state: UIStore) => state.setEditingConfigId
export const selectSetShowNewConfig = (state: UIStore) => state.setShowNewConfig
export const selectSetActiveTab = (state: UIStore) => state.setActiveTab
export const selectStartEditingConfig = (state: UIStore) => state.startEditingConfig
export const selectStopEditing = (state: UIStore) => state.stopEditing
export const selectResetUI = (state: UIStore) => state.resetUI
