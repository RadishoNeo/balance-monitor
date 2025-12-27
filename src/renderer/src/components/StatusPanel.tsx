import React from 'react'
import { MonitorStatus } from '../types'

interface StatusPanelProps {
  statuses: MonitorStatus[]
  isMonitoring: boolean
  lastBalance: number | null
  lastCurrency: string
  onManualQuery: () => void
  onStart: () => void
  onStop: () => void
  loading?: boolean
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  statuses,
  isMonitoring,
  lastBalance,
  lastCurrency,
  onManualQuery,
  onStart,
  onStop,
  loading = false
}) => {
  // 获取状态统计
  const stats = {
    total: statuses.length,
    running: statuses.filter((s) => s.status === 'running').length,
    error: statuses.filter((s) => s.status === 'error').length,
    stopped: statuses.filter((s) => s.status === 'stopped').length
  }

  // 获取最后更新时间
  const getLastUpdateTime = () => {
    const runningStatuses = statuses.filter((s) => s.status === 'running' && s.lastRun)
    if (runningStatuses.length === 0) return null

    const latest = runningStatuses.reduce(
      (latest, s) => {
        const time = new Date(s.lastRun!).getTime()
        const latestTime = latest ? new Date(latest).getTime() : 0
        return time > latestTime ? s.lastRun! : latest
      },
      null as string | null
    )

    return latest ? new Date(latest).toLocaleTimeString() : null
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'stopped':
        return 'bg-gray-500'
      default:
        return 'bg-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* 余额大卡片 - 采用了更加大气的设计 */}
      <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-3xl p-8 shadow-2xl shadow-primary/20">
        {/* 背景装饰图案 */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">
                Total Available Balance
              </p>
              <h3 className="text-sm font-bold opacity-90 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                实时账户余额
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/10">
              💰
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-2xl font-bold opacity-60">{lastCurrency}</span>
            <span className="text-6xl font-black tracking-tighter">
              {lastBalance !== null ? lastBalance.toFixed(2) : '--'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                监控状态
              </span>
              <span className="text-sm font-bold">
                {isMonitoring ? 'ACTIVE MONITORING' : 'PAUSED'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                最后同步时间
              </span>
              <span className="text-sm font-bold font-mono">
                {getLastUpdateTime() || 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计信息 - 现代化网格布局 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '总配置', value: stats.total, icon: '📂', color: 'text-primary' },
          { label: '运行中', value: stats.running, icon: '⚡', color: 'text-green-500' },
          { label: '已停止', value: stats.stopped, icon: '⏸️', color: 'text-amber-500' },
          { label: '错误', value: stats.error, icon: '⚠️', color: 'text-destructive' }
        ].map((item, i) => (
          <div
            key={i}
            className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-4 transition-all hover:bg-card hover:shadow-xl hover:shadow-black/5 group"
          >
            <div className="text-xl mb-2 group-hover:scale-125 transition-transform duration-300">
              {item.icon}
            </div>
            <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 - 更加精致的层级感 */}
      <div className="flex gap-3">
        {!isMonitoring ? (
          <button
            onClick={onStart}
            disabled={loading || stats.total === 0}
            className="flex-1 bg-green-500 text-white py-4 rounded-2xl hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all text-sm font-black tracking-widest uppercase disabled:opacity-50"
          >
            {loading ? 'INITIALIZING...' : '▶ START MONITORING'}
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={loading}
            className="flex-1 bg-destructive text-destructive-foreground py-4 rounded-2xl hover:bg-destructive/90 shadow-lg shadow-destructive/20 active:scale-95 transition-all text-sm font-black tracking-widest uppercase disabled:opacity-50"
          >
            {loading ? 'CLOSING...' : '■ STOP MONITORING'}
          </button>
        )}

        <button
          onClick={onManualQuery}
          disabled={loading || !isMonitoring}
          className="px-8 bg-card border border-border/50 text-foreground py-4 rounded-2xl hover:bg-muted shadow-lg shadow-black/5 active:scale-95 transition-all text-sm font-black tracking-widest uppercase disabled:opacity-30"
        >
          🔄 REFRESH
        </button>
      </div>

      {/* 详细状态列表 - 优化视觉层次 */}
      {statuses.length > 0 && (
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
          <div className="bg-muted/50 px-6 py-4 border-b border-border/50 flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Detailed Service Status
            </h4>
            <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">
              LIVE FEED
            </span>
          </div>
          <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto custom-scrollbar">
            {statuses.map((status) => (
              <div
                key={status.configId}
                className="px-6 py-4 hover:bg-card/80 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} shadow-sm ring-4 ring-offset-0 ${status.status === 'running' ? 'ring-green-500/10 animate-pulse' : 'ring-gray-500/5'}`}
                    ></div>
                    <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {status.configId.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md uppercase tracking-wider">
                    {status.status === 'running' ? (
                      <span>
                        Next Sync:{' '}
                        {status.nextRun
                          ? new Date(status.nextRun).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '--'}
                      </span>
                    ) : (
                      <span>Paused / Stopped</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-6">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-green-500">
                      ✓ {status.successCount}
                    </span>
                    <span className="text-[10px] font-bold text-destructive">
                      ✗ {status.errorCount}
                    </span>
                  </div>
                  <div className="h-1 flex-1 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (status.successCount / (status.successCount + status.errorCount || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/40">
                    {status.lastRun
                      ? new Date(status.lastRun).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      : 'NEVER'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {stats.total === 0 && (
        <div className="bg-accent border border-border text-accent-foreground rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">未找到监控数据</h4>
              <p className="text-sm opacity-80">
                {lastBalance !== null
                  ? '数据已加载，但配置信息未找到。'
                  : '请先创建配置并设置为活动配置，然后启动监控或手动查询。'}
              </p>
            </div>
            <button
              onClick={onManualQuery}
              disabled={loading}
              className="ml-4 px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:opacity-90 disabled:opacity-50"
            >
              立即查询
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
