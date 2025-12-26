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
        return 'bg-gray-400'
    }
  }

  // 获取余额显示颜色
  const getBalanceColor = () => {
    if (lastBalance === null) return 'text-gray-500'
    // 这里简化处理，实际应该根据配置的阈值判断
    if (lastBalance <= 10) return 'text-red-600 font-bold'
    if (lastBalance <= 50) return 'text-yellow-600 font-bold'
    return 'text-green-600 font-bold'
  }

  return (
    <div className="space-y-4">
      {/* 余额大卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
        <div className="text-sm opacity-90 mb-1">当前余额</div>
        <div className={`text-4xl mb-2 ${getBalanceColor()}`}>
          {lastBalance !== null ? `${lastCurrency}${lastBalance.toFixed(2)}` : '--'}
        </div>
        <div className="flex justify-between text-sm opacity-90">
          <span>状态: {isMonitoring ? '监控中' : '已停止'}</span>
          <span>更新: {getLastUpdateTime() || '无'}</span>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-md p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">总配置</div>
        </div>
        <div className="bg-white border rounded-md p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.running}</div>
          <div className="text-xs text-gray-500">运行中</div>
        </div>
        <div className="bg-white border rounded-md p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.stopped}</div>
          <div className="text-xs text-gray-500">已停止</div>
        </div>
        <div className="bg-white border rounded-md p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-xs text-gray-500">错误</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-2">
        {!isMonitoring ? (
          <button
            onClick={onStart}
            disabled={loading || stats.total === 0}
            className="bg-green-500 text-white py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? '启动中...' : '开始监控'}
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={loading}
            className="bg-red-500 text-white py-2 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? '停止中...' : '停止监控'}
          </button>
        )}

        <button
          onClick={onManualQuery}
          disabled={loading || !isMonitoring}
          className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          手动刷新
        </button>

        <div className="bg-gray-100 text-gray-600 py-2 rounded-md text-center text-sm flex items-center justify-center">
          {isMonitoring ? '运行中' : '已停止'}
        </div>
      </div>

      {/* 详细状态列表 */}
      {statuses.length > 0 && (
        <div className="bg-white border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium">配置状态</div>
          <div className="max-h-48 overflow-y-auto">
            {statuses.map((status) => (
              <div
                key={status.configId}
                className="px-3 py-2 border-b last:border-0 text-sm hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusColor(status.status)}`}
                    ></span>
                    <span className="font-medium">{status.configId.substring(0, 8)}...</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {status.status === 'running' && (
                      <>
                        下次:{' '}
                        {status.nextRun ? new Date(status.nextRun).toLocaleTimeString() : '--'}
                      </>
                    )}
                    {status.status === 'error' && <>错误: {status.errorCount}次</>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  成功: {status.successCount} | 失败: {status.errorCount}
                  {status.lastRun && ` | 最后: ${new Date(status.lastRun).toLocaleTimeString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {stats.total === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md p-4">
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
              className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            >
              立即查询
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
