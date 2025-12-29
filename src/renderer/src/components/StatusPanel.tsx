import React from 'react'
import { MonitorStatus, BalanceMonitorConfig } from '../types'
import { balanceList } from '../config/balance'

interface StatusPanelProps {
  statuses: MonitorStatus[]
  configs: BalanceMonitorConfig[] // 新增：用于获取配置名称
  isMonitoring: boolean
  onManualQuery: () => void
  onStart: () => void
  onStop: () => void
  loading?: boolean
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  statuses,
  configs,
  isMonitoring,
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

  // 根据 ID 获取配置
  const getConfig = (configId: string) => {
    return configs.find((c) => c.id === configId)
  }

  // 获取状态显示信息 (包含阈值判断)
  const getStatusInfo = (status: MonitorStatus, config?: ReturnType<typeof getConfig>) => {
    const isError = status.status === 'error'
    const balance = status.balance ?? 0
    const thresholds = config?.thresholds

    // 默认状态（无阈值配置或未连接）
    if (!thresholds || isError) {
      if (isError) {
        return {
          color: 'bg-destructive',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/20',
          bgGradient: 'bg-destructive/5',
          glow: 'bg-destructive',
          statusText: 'Service Error',
          icon: '⚠️'
        }
      }
      // 正常运行但无具体阈值状态
      return {
        color: 'bg-green-500',
        textColor: 'text-primary',
        borderColor: 'border-border/40',
        bgGradient: 'bg-gradient-to-br from-card to-card/50',
        glow: 'bg-primary',
        statusText: 'Live Status',
        icon: '🏦'
      }
    }

    // 阈值判断
    if (balance <= (thresholds.danger ?? 0)) {
      return {
        color: 'bg-red-500',
        textColor: 'text-red-500',
        borderColor: 'border-red-500/30',
        bgGradient: 'bg-red-500/5',
        glow: 'bg-red-500',
        statusText: 'Critical Low',
        icon: '🚨'
      }
    } else if (balance <= (thresholds.warning ?? 0)) {
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        borderColor: 'border-yellow-500/30',
        bgGradient: 'bg-yellow-500/5',
        glow: 'bg-yellow-500',
        statusText: 'Low Balance',
        icon: '⚠️'
      }
    }

    return {
      color: 'bg-green-500',
      textColor: 'text-primary',
      borderColor: 'border-border/40',
      bgGradient: 'bg-gradient-to-br from-card to-card/50',
      glow: 'bg-primary',
      statusText: 'Healthy',
      icon: '🏦'
    }
  }

  // 格式化数字
  const formatNum = (num?: number) => {
    if (num === undefined || num === null) return null
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 - 现代化玻璃拟态 */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/40 shadow-xl shadow-black/5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 mb-2">
              Monitor Controls
            </span>
            <div className="flex items-center gap-3">
              {!isMonitoring ? (
                <button
                  onClick={onStart}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="text-lg">▶</span> 启动监控
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="px-6 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-2xl font-bold transition-all flex items-center gap-2"
                >
                  <span className="text-lg">■</span> 停止运行
                </button>
              )}
              <button
                onClick={onManualQuery}
                disabled={loading || !isMonitoring}
                className="px-6 py-2.5 bg-muted text-foreground hover:bg-muted-foreground/10 rounded-2xl font-bold transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
                {loading ? '正在查询...' : '即时刷新'}
              </button>
            </div>
          </div>

          <div className="h-12 w-[1px] bg-border/40 mx-2 hidden sm:block"></div>

          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-1">
                Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                ></span>
                <span className="font-black text-sm">{isMonitoring ? 'ACTIVE' : 'IDLE'}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-1">
                Endpoints
              </span>
              <span className="font-black text-sm">
                {stats.running} / {stats.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 活跃余额网格 - 现代化设计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statuses
          .filter((s) => s.status === 'running' || s.status === 'error')
          .map((status) => {
            const config = getConfig(status.configId)
            const styleInfo = getStatusInfo(status, config)

            return (
              <div
                key={status.configId}
                className={`group relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 border ${styleInfo.borderColor} ${styleInfo.bgGradient}`}
              >
                {/* 装饰性背景 */}
                <div
                  className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-[60px] opacity-20 transition-all group-hover:opacity-40 ${styleInfo.glow}`}
                ></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${styleInfo.color} ${status.status === 'error' ? 'animate-pulse' : ''}`}
                        ></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {styleInfo.statusText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {config?.logo && (
                          <div className="w-9 h-9 p-1.5 rounded-xl bg-background/40 border border-border/30 flex items-center justify-center backdrop-blur-sm shadow-sm transition-transform group-hover:scale-105 duration-500">
                            <img
                              src={balanceList.find((t) => t.name === config?.name)?.logo || config?.logo}
                              alt={config.name}
                              className="w-full h-full object-contain drop-shadow-sm"
                            />
                          </div>
                        )}
                        <h3 className="text-lg font-black tracking-tight truncate pr-4 text-foreground">
                          {config?.name || '未知服务'}
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl shadow-inner ${status.status === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                        }`}
                    >
                      {styleInfo.icon}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center py-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`text-3xl font-black tracking-tighter ${styleInfo.textColor}`}
                      >
                        {status.balance !== undefined
                          ? formatNum(status.balance)
                          : status.status === 'error'
                            ? '---'
                            : '同步中...'}
                      </span>
                      <span className="text-sm font-black text-muted-foreground opacity-60 uppercase">
                        {status.currency || config?.thresholds?.currency || '¥'}
                      </span>
                    </div>

                    {/* 深层详细余额 (DeepSeek 等支持详情的模板) */}
                    {(status.grantedBalance !== undefined ||
                      status.toppedUpBalance !== undefined) && (
                        <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/30 border border-border/20">
                          <div>
                            <p className="text-[8px] uppercase font-bold text-muted-foreground/60 mb-0.5">
                              充值余额
                            </p>
                            <p className="text-xs font-black text-foreground/80">
                              {formatNum(status.toppedUpBalance) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] uppercase font-bold text-muted-foreground/60 mb-0.5">
                              赠送余额
                            </p>
                            <p className="text-xs font-black text-foreground/80">
                              {formatNum(status.grantedBalance) || '0.00'}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black text-muted-foreground/40 mb-1">
                        Last Updated
                      </span>
                      <span className="text-[10px] font-bold opacity-80">
                        {status.lastRun ? new Date(status.lastRun).toLocaleTimeString() : '从未'}
                      </span>
                    </div>
                    {status.status === 'error' && (
                      <span className="px-2 py-1 bg-destructive/10 text-destructive text-[9px] font-black rounded-lg uppercase tracking-tight">
                        Check Config
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

        {/* 空状态处理 */}
        {statuses.filter((s) => s.status === 'running' || s.status === 'error').length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card/20 rounded-3xl border-2 border-dashed border-border/40 text-muted-foreground/40">
            <span className="text-6xl mb-6 opacity-20">📡</span>
            <p className="text-lg font-black uppercase tracking-widest">No Active Monitors</p>
            <p className="text-sm mt-2 font-bold uppercase tracking-tighter opacity-60">
              请启用服务的"监控"设置以在此处查看实时余额
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
