import React, { useState } from 'react'
import { BalanceMonitorConfig } from '../types'

interface ConfigManagerProps {
  configs: BalanceMonitorConfig[]
  activeConfigId: string | null
  onNewConfig: () => void
  onEditConfig: (config: BalanceMonitorConfig) => void
  onDeleteConfig: (configId: string) => Promise<void>
  onSetActiveConfig: (configId: string) => Promise<void>
  onExportConfig: (configId: string) => Promise<void>
  onImportConfig: () => Promise<void>
  onToggleMonitoring: (configId: string, enabled: boolean) => Promise<void>
  loading?: boolean
}

export const ConfigManager: React.FC<ConfigManagerProps> = ({
  configs,
  onNewConfig,
  onEditConfig,
  onDeleteConfig,
  onExportConfig,
  onImportConfig,
  onToggleMonitoring,
  loading = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？此操作不可恢复。')) {
      return
    }

    setDeletingId(configId)
    try {
      await onDeleteConfig(configId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (configId: string, currentStatus: boolean) => {
    await onToggleMonitoring(configId, !currentStatus)
  }

  const handleExport = async (configId: string): Promise<void> => {
    const json = await onExportConfig(configId)
    if (json !== null && json !== undefined) {
      // 创建下载
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `balance-config-${configId}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 - 现代化布局 */}
      <div className="flex flex-wrap justify-between items-center bg-card/30 backdrop-blur-sm p-4 rounded-3xl border border-border/50 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onNewConfig}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm font-black uppercase tracking-widest disabled:opacity-50"
          >
            <span>✨</span>
            新建监控配置
          </button>
          <button
            onClick={onImportConfig}
            disabled={loading}
            className="flex items-center gap-2 bg-card border border-border/50 text-foreground px-6 py-3 rounded-2xl hover:bg-muted shadow-lg shadow-black/5 active:scale-95 transition-all text-sm font-black uppercase tracking-widest disabled:opacity-50"
          >
            <span>📥</span>
            导入
          </button>
        </div>
        <div className="px-4 py-2 bg-muted/50 rounded-xl border border-border/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Portfolio Total: <span className="text-primary">{configs.length}</span> Services
        </div>
      </div>

      {/* 配置列表 - 现代化卡片布局 */}
      {configs.length === 0 ? (
        <div className="text-center py-20 px-6 bg-muted/20 rounded-[2.5rem] border border-border/50 border-dashed">
          <div className="text-6xl mb-6">🏜️</div>
          <h3 className="text-xl font-black text-foreground mb-2">未发现任何配置</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto opacity-60">
            您的监控清单目前是空的。点击上方的“新建监控配置”来开始追踪您的 API 余额。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="relative group rounded-4xl p-6 transition-all duration-300 border bg-card/40 border-border/50 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${config.monitoring.enabled ? 'bg-primary/10' : 'bg-muted'}`}
                    >
                      {config.monitoring.enabled ? '🟢' : '⚪'}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors leading-none mb-1">
                        {config.name}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        ID: {config.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* 现代化切换开关 */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                      Monitor
                    </span>
                    <button
                      onClick={() => handleToggle(config.id, config.monitoring.enabled)}
                      disabled={loading}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${config.monitoring.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-y-1 ${config.monitoring.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase mb-1">
                      API Endpoint
                    </p>
                    <p className="text-xs font-mono font-bold truncate text-foreground/80">
                      <span className="text-primary">{config.api.method}</span> {config.api.url}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-muted/20 rounded-lg">
                      <p className="text-[8px] font-black text-muted-foreground/40 uppercase">
                        Interval
                      </p>
                      <p className="text-xs font-bold">{config.monitoring.interval}s</p>
                    </div>
                    <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <p className="text-[8px] font-black text-amber-500/50 uppercase">Warn</p>
                      <p className="text-xs font-bold text-amber-600">
                        {config.thresholds.currency}
                        {config.thresholds.warning}
                      </p>
                    </div>
                    <div className="p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                      <p className="text-[8px] font-black text-destructive/50 uppercase">Danger</p>
                      <p className="text-xs font-bold text-destructive">
                        {config.thresholds.currency}
                        {config.thresholds.danger}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-border/30">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditConfig(config)}
                      disabled={loading}
                      className="p-2 hover:bg-muted text-foreground rounded-xl transition-all"
                      title="编辑"
                    >
                      ⚙️
                    </button>
                    <button
                      onClick={() => handleExport(config.id)}
                      disabled={loading}
                      className="p-2 hover:bg-muted text-foreground rounded-xl transition-all"
                      title="导出"
                    >
                      📤
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(config.id)}
                    disabled={loading || deletingId === config.id}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-all disabled:opacity-30"
                    title="删除"
                  >
                    {deletingId === config.id ? '⌛' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 - 优化视觉体验 */}
      <div className="bg-card/20 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span>
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            Pro Tips & Guidance
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary text-sm">01</div>
            <div>
              <p className="text-[11px] font-bold text-foreground/80 mb-0.5">即刻同步</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                在“监控设置”中开启启用开关后，系统将自动开始追踪该服务的余额。
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary text-sm">02</div>
            <div>
              <p className="text-[11px] font-bold text-foreground/80 mb-0.5">多路追踪</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                您可以同时配置并开启多个 API 的监控，仪表盘将实时汇聚所有余额。
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary text-sm">03</div>
            <div>
              <p className="text-[11px] font-bold text-foreground/80 mb-0.5">安全保障</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                导出的配置经过安全加密处理，敏感信息在非本机环境下无法被读取。
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary text-sm">04</div>
            <div>
              <p className="text-[11px] font-bold text-foreground/80 mb-0.5">异常感知</p>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                当服务出现异常或余额低于阈值时，系统会通过托盘图标变红给予告警。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
