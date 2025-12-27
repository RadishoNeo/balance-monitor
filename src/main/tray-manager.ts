import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

export interface TrayState {
  balance: number | null
  currency: string
  status: 'normal' | 'warning' | 'danger' | 'error' | 'loading' | 'stopped'
  configName: string
  lastUpdate: string
  responseTime: number
}

export class TrayManager {
  private tray: Tray | null = null
  private state: TrayState = {
    balance: null,
    currency: '¥',
    status: 'stopped',
    configName: '未配置',
    lastUpdate: '-',
    responseTime: 0
  }

  constructor() {
    this.createTray()
  }

  private createTray(): void {
    // 创建基础图标（灰色）
    const iconPath = this.getIconPath('gray')
    const image = nativeImage.createFromPath(iconPath)

    // Windows上调整图标大小
    if (process.platform === 'win32') {
      const resized = image.resize({ width: 16, height: 16 })
      this.tray = new Tray(resized)
    } else {
      this.tray = new Tray(image)
    }

    this.tray.setToolTip('余额监控 - 未运行')
    this.updateContextMenu()
  }

  private getIconPath(status: string): string {
    const iconsDir = join(__dirname, '../../resources/icons')

    // 如果资源目录不存在，使用默认图标
    if (!existsSync(iconsDir)) {
      return join(__dirname, '../../resources/icon.svg')
    }

    const iconMap: Record<string, string> = {
      green: join(iconsDir, 'green.png'),
      yellow: join(iconsDir, 'yellow.png'),
      red: join(iconsDir, 'red.png'),
      gray: join(iconsDir, 'gray.png'),
      blue: join(iconsDir, 'blue.png')
    }

    const iconPath = iconMap[status] || iconMap.gray

    // 如果特定状态图标不存在，返回灰色
    if (!existsSync(iconPath)) {
      return join(__dirname, '../../resources/icon.svg')
    }

    return iconPath
  }

  private updateContextMenu(): void {
    if (!this.tray) return

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `当前余额: ${this.state.balance !== null ? this.state.currency + this.state.balance.toFixed(2) : '未获取'}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '手动刷新',
        click: () => this.emit('manual-refresh')
      },
      {
        label: this.state.status === 'stopped' ? '开始监控' : '停止监控',
        click: () => this.emit('toggle-monitoring')
      },
      { type: 'separator' },
      {
        label: '显示主界面',
        click: () => this.emit('show-window')
      },
      {
        label: '配置管理',
        click: () => this.emit('show-config')
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          this.tray?.destroy()
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private emit(event: string): void {
    // 通过事件发射器通知主进程
    if (this.tray) {
      ; (this.tray as any).emit(event)
    }
  }

  public updateState(newState: Partial<TrayState>): void {
    this.state = { ...this.state, ...newState }
    this.updateVisuals()
  }

  private updateVisuals(): void {
    if (!this.tray) return

    // 更新图标
    const iconPath = this.getIconPath(this.getStatusIcon())
    const image = nativeImage.createFromPath(iconPath)

    if (process.platform === 'win32') {
      const resized = image.resize({ width: 16, height: 16 })
      this.tray.setImage(resized)
    } else {
      this.tray.setImage(image)
    }

    // 更新悬停提示
    const tooltip = this.generateTooltip()
    this.tray.setToolTip(tooltip)

    // 更新右键菜单
    this.updateContextMenu()
  }

  private getStatusIcon(): string {
    const statusMap: Record<string, string> = {
      normal: 'green',
      warning: 'yellow',
      danger: 'red',
      error: 'gray',
      loading: 'blue',
      stopped: 'gray'
    }
    return statusMap[this.state.status] || 'gray'
  }

  private generateTooltip(): string {
    const lines = [
      `余额监控 - ${this.state.configName}`,
      `当前余额: ${this.state.balance !== null ? this.state.currency + this.state.balance.toFixed(2) : '未获取'}`,
      `状态: ${this.getStatusText()}`,
      `最后更新: ${this.state.lastUpdate}`,
      `响应时间: ${this.state.responseTime > 0 ? this.state.responseTime + 'ms' : '-'}`
    ]
    return lines.join('\n')
  }

  private getStatusText(): string {
    const statusMap: Record<string, string> = {
      normal: '正常',
      warning: '警告',
      danger: '危险',
      error: '错误',
      loading: '查询中',
      stopped: '已停止'
    }
    return statusMap[this.state.status] || '未知'
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }

  public getTray(): Tray | null {
    return this.tray
  }
}
