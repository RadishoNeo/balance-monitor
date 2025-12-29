import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'

// 导入自定义模块
import { TrayManager } from './tray-manager'
import { ConfigManager } from './config-manager'
import { MonitorScheduler } from './monitor-scheduler'
import { Logger } from './logger'
import { APIEngine } from './api-engine'
import { BalanceParser } from './balance-parser'

// 全局变量
let trayManager: TrayManager | null = null
let configManager: ConfigManager | null = null
let monitorScheduler: MonitorScheduler | null = null
let mainWindow: BrowserWindow | null = null
const logger = new Logger('Main')

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    icon: icon,
    show: false,
    autoHideMenuBar: true,
    center: true,
    //测试环境
    ...(process.env.NODE_ENV === 'development' ? {} : {}),
    //生产环境
    ...(process.env.NODE_ENV === 'production'
      ? {
          //无标题栏
          titleBarStyle: 'hidden'
        }
      : {}),
    //linux环境配置
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,

      //----------------------
      //推荐添加的webPreferences
      webviewTag: false, // 禁用webview标签，提高安全性
      plugins: false, // 禁用插件
      experimentalFeatures: false, // 禁用实验性功能

      // 性能优化
      spellcheck: false, // 禁用拼写检查（除非需要）
      enableWebSQL: false, // 禁用WebSQL

      // 安全增强
      safeDialogs: true,
      safeDialogsMessage: 'This is a security check',

      // 图像和字体
      images: true,
      textAreasAreResizable: true,
      webgl: true,
      //----------------------

      //测试环境允许打开devtool
      ...(process.env.NODE_ENV === 'development'
        ? {
            devTools: true
          }
        : {})
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      // 通知渲染进程已准备好
      mainWindow.webContents.send('app-ready')
    }
  })

  // 处理窗口关闭事件（最小化到托盘）
  mainWindow.on('close', (event) => {
    if (trayManager && process.platform !== 'darwin') {
      event.preventDefault()
      if (mainWindow) {
        mainWindow.hide()
      }
      logger.info('窗口已最小化到托盘')
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 初始化核心服务
function initializeServices(): void {
  logger.info('正在初始化服务...')

  // 1. 初始化配置管理器
  configManager = new ConfigManager({ autoSave: true, backup: true })

  // 2. 初始化托盘管理器
  trayManager = new TrayManager()

  // 3. 初始化监控调度器
  monitorScheduler = new MonitorScheduler(configManager, trayManager)

  // 4. 监听托盘事件
  const tray = trayManager.getTray()
  if (tray) {
    // @ts-ignore: 自定义托盘事件
    tray.on('manual-refresh', () => {
      logger.info('托盘: 手动刷新')
      if (monitorScheduler) {
        monitorScheduler.manualQuery()
      }
    })

    // @ts-ignore: 自定义托盘事件
    tray.on('toggle-monitoring', () => {
      logger.info('托盘: 切换监控状态')
      if (monitorScheduler) {
        const activeConfig = configManager?.getActiveConfig()
        if (activeConfig) {
          const status = monitorScheduler.getStatus(activeConfig.id)
          if (status && status.status === 'running') {
            monitorScheduler.stopAllMonitors()
          } else {
            monitorScheduler.startAllMonitors()
          }
        }
      }
    })

    // @ts-ignore: 自定义托盘事件
    tray.on('show-window', () => {
      logger.info('托盘: 显示主窗口')
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.show()
        mainWindow.focus()
      }
    })

    // @ts-ignore: 自定义托盘事件
    tray.on('show-config', () => {
      logger.info('托盘: 显示配置')
      if (mainWindow) {
        mainWindow.show()
        mainWindow.webContents.send('navigate-to-config')
      }
    })
  }

  logger.success('服务初始化完成')
}

// 设置IPC处理器
function setupIPCHandlers(): void {
  // 配置管理
  ipcMain.handle('save-config', async (_event, config) => {
    try {
      let savedConfig
      if (config.id) {
        savedConfig = configManager?.updateConfig(config.id, config)
      } else {
        savedConfig = configManager?.createConfig(config)
      }

      // 如果配置已启用/禁用，自动调整监控状态
      if (savedConfig && monitorScheduler) {
        if (savedConfig.monitoring?.enabled) {
          monitorScheduler.startMonitor(savedConfig.id)
        } else {
          monitorScheduler.stopMonitor(savedConfig.id)
        }
      }

      return savedConfig
    } catch (error) {
      logger.error(`保存配置失败: ${error}`)
      throw error
    }
  })

  ipcMain.handle('load-config', async () => {
    return {
      configs: configManager?.getAllConfigs() || [],
      activeConfigId: configManager?.getActiveConfig()?.id || null
    }
  })

  ipcMain.handle('delete-config', async (_event, configId: string) => {
    try {
      // 先停止该配置的监控（如果正在监控）
      if (monitorScheduler) {
        const isRunning = monitorScheduler.getStatus(configId)?.status === 'running'
        if (isRunning) {
          logger.info(`删除配置 ${configId}: 先停止监控`)
          monitorScheduler.stopMonitor(configId)
        }
      }

      // 删除配置
      const result = configManager?.deleteConfig(configId) || false

      if (result) {
        logger.success(`配置 ${configId} 已删除`)
      }

      return result
    } catch (error) {
      logger.error(`删除配置失败: ${error}`)
      throw error
    }
  })

  ipcMain.handle('set-active-config', async (_event, configId: string) => {
    return configManager?.setActiveConfig(configId) || false
  })

  ipcMain.handle('export-config', async (_event, configId: string) => {
    return configManager?.exportConfig(configId) || null
  })

  ipcMain.handle('import-config', async (_event, jsonString: string) => {
    return configManager?.importConfig(jsonString) || null
  })

  ipcMain.handle('validate-config', async (_event, config) => {
    return configManager?.validateConfig(config) || { valid: false, errors: ['管理器未初始化'] }
  })

  // API测试
  ipcMain.handle('test-api-connection', async (_event, request) => {
    const engine = new APIEngine()
    return await engine.testConnection(request)
  })

  // 解析器测试
  ipcMain.handle('test-parser', async (_event, data, parserConfig) => {
    const parser = new BalanceParser()
    return parser.testParse(data, parserConfig)
  })

  // 日志相关
  ipcMain.handle('get-logs', async (_event, limit = 100) => {
    return Logger.getLogEntries(limit)
  })

  ipcMain.handle('clear-logs', async () => {
    Logger.clearLogs()
    return true
  })

  // 监控控制（已在MonitorScheduler中设置，这里添加额外的）
  ipcMain.handle('get-all-statuses', async () => {
    return monitorScheduler?.getAllStatuses() || []
  })

  // 窗口控制
  ipcMain.handle('minimize-window', async () => {
    if (mainWindow) {
      mainWindow.minimize()
      return true
    }
    return false
  })

  ipcMain.handle('close-window', async () => {
    if (mainWindow) {
      mainWindow.close()
      return true
    }
    return false
  })

  // 获取应用信息
  ipcMain.handle('get-app-info', async () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      configDir: configManager ? configManager['configDir'] : null
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化服务
  initializeServices()

  // 设置IPC处理器
  setupIPCHandlers()

  // 创建主窗口
  createWindow()

  // 更新窗口引用到调度器并启动已启用的监控
  if (monitorScheduler && mainWindow) {
    monitorScheduler.setMainWindow(mainWindow)
    // 延迟一小段时间启动，确保 IPC 通道各就各位
    setTimeout(() => {
      monitorScheduler?.startAllMonitors()
    }, 1000)
  }

  // macOS特定处理
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  logger.success('应用启动完成')
})

// 应用退出前的清理
app.on('before-quit', () => {
  logger.info('正在退出应用...')

  if (monitorScheduler) {
    monitorScheduler.destroy()
  }

  if (trayManager) {
    trayManager.destroy()
  }

  logger.info('清理完成')
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error(`未捕获的异常: ${error.message}`)
  console.error(error)
})

process.on('unhandledRejection', (reason) => {
  logger.error(`未处理的Promise拒绝: ${reason}`)
  console.error(reason)
})
