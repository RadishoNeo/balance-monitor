/**
 * Zustand Store 统一导出
 *
 * 本模块提供应用程序的状态管理功能，使用 Zustand + persist middleware 实现。
 *
 * Store 结构：
 * - useFormStore: 管理表单临时状态（API配置、解析器配置、监控设置）
 * - useConfigStore: 管理配置数据（configs 列表、activeConfigId）
 * - useUIStore: 管理 UI 状态（当前页面、编辑状态、标签页）
 *
 * 特性：
 * - 自动持久化到 localStorage
 * - 支持 TypeScript 类型推断
 * - 高性能选择器，避免不必要的重渲染
 * - 清晰的关注点分离
 */

export { useFormStore } from './formStore'
export { useConfigStore } from './configStore'
export { useUIStore } from './uiStore'

// 重新导出选择器函数，方便使用
export {
  // Form Store 选择器
  selectAPIFormState,
  selectParserFormState,
  selectMonitoringFormState,
  selectSampleData,
  selectIsSaving,
  selectUpdateAPIForm,
  selectUpdateParserForm,
  selectUpdateMonitoringForm,
  selectSetSampleData,
  selectSetIsSaving,
  selectResetAllForms
} from './formStore'

export {
  // Config Store 选择器
  selectConfigs,
  selectActiveConfigId,
  selectActiveConfig,
  selectLoading,
  selectError,
  selectSetConfigs,
  selectSetActiveConfigId,
  selectSetLoading,
  selectSetError,
  selectClearError
} from './configStore'

export {
  // UI Store 选择器
  selectCurrentPage,
  selectEditingConfigId,
  selectShowNewConfig,
  selectActiveTab,
  selectSetCurrentPage,
  selectSetEditingConfigId,
  selectSetShowNewConfig,
  selectSetActiveTab,
  selectStartEditingConfig,
  selectStopEditing,
  selectResetUI
} from './uiStore'

// 类型导出
// 类型通过 store 本身导出，不需要单独导入
