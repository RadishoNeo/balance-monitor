import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义暴露给渲染进程的API
const electronAPIExtended = {
  ...electronAPI,

  // 配置管理
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  deleteConfig: (configId: string) => ipcRenderer.invoke('delete-config', configId),
  setActiveConfig: (configId: string) => ipcRenderer.invoke('set-active-config', configId),
  exportConfig: (configId: string) => ipcRenderer.invoke('export-config', configId),
  importConfig: (jsonString: string) => ipcRenderer.invoke('import-config', jsonString),
  validateConfig: (config: any) => ipcRenderer.invoke('validate-config', config),

  // API测试
  testApiConnection: (request: any) => ipcRenderer.invoke('test-api-connection', request),
  testParser: (data: any, parserConfig: any) =>
    ipcRenderer.invoke('test-parser', data, parserConfig),

  // 监控控制
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  manualQuery: () => ipcRenderer.invoke('manual-query'),
  startConfigMonitor: (configId: string) => ipcRenderer.invoke('start-config-monitor', configId),
  stopConfigMonitor: (configId: string) => ipcRenderer.invoke('stop-config-monitor', configId),
  getMonitorStatus: () => ipcRenderer.invoke('get-monitor-status'),
  getAllStatuses: () => ipcRenderer.invoke('get-all-statuses'),

  // 日志管理
  getLogs: (limit?: number) => ipcRenderer.invoke('get-logs', limit),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 事件监听
  onBalanceUpdate: (callback: (data: any) => void) => {
    const wrapped = (_: any, data: any) => callback(data)
    ipcRenderer.on('balance-update', wrapped)
    return () => ipcRenderer.off('balance-update', wrapped)
  },

  onStatusChange: (callback: (data: any) => void) => {
    const wrapped = (_: any, data: any) => callback(data)
    ipcRenderer.on('status-change', wrapped)
    return () => ipcRenderer.off('status-change', wrapped)
  },

  onAppReady: (callback: () => void) => {
    const wrapped = () => callback()
    ipcRenderer.on('app-ready', wrapped)
    return () => ipcRenderer.off('app-ready', wrapped)
  },

  onNavigateToConfig: (callback: () => void) => {
    const wrapped = () => callback()
    ipcRenderer.on('navigate-to-config', wrapped)
    return () => ipcRenderer.off('navigate-to-config', wrapped)
  }
}

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPIExtended)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPIExtended
  // @ts-ignore (define in dts)
  window.api = api
}
