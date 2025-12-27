import React, { useState, useEffect, useRef } from 'react'
import { LogEntry } from '../types'

interface LogViewerProps {
  logs: LogEntry[]
  onClearLogs: () => void
  onRefreshLogs: () => void
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onClearLogs, onRefreshLogs }) => {
  const [filter, setFilter] = useState<'all' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG'>(
    'all'
  )
  const [search, setSearch] = useState('')

  // 获取日志颜色
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-500 bg-red-500/10 ring-1 ring-red-500/20 shadow-sm shadow-red-500/5'
      case 'WARN':
        return 'text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20 shadow-sm shadow-amber-500/5'
      case 'SUCCESS':
        return 'text-green-500 bg-green-500/10 ring-1 ring-green-500/20 shadow-sm shadow-green-500/5'
      case 'DEBUG':
        return 'text-primary bg-primary/10 ring-1 ring-primary/20 shadow-sm shadow-primary/5'
      case 'INFO':
        return 'text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/20 shadow-sm shadow-blue-500/5'
      default:
        return 'text-muted-foreground bg-muted ring-1 ring-border/20'
    }
  }

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false
    if (
      search &&
      !log.message.toLowerCase().includes(search.toLowerCase()) &&
      !log.module.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  // 自动滚动到底部
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filteredLogs])

  return (
    <div className="space-y-4 h-full flex flex-col font-sans">
      {/* 工具栏 - 现代化布局 */}
      <div className="bg-card/30 backdrop-blur-sm p-4 rounded-3xl border border-border/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          {/* 现代化分段控制过滤 */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl">
            {['all', 'SUCCESS', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((l) => (
              <button
                key={l}
                onClick={() => setFilter(l as any)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                  filter === l
                    ? 'bg-card text-primary shadow-lg shadow-black/5 ring-1 ring-border/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshLogs}
              className="p-2 aspect-square bg-card border border-border/50 text-foreground rounded-2xl hover:bg-muted shadow-lg shadow-black/5 active:scale-95 transition-all text-sm"
              title="刷新日志"
            >
              🔄
            </button>
            <button
              onClick={onClearLogs}
              className="p-2 aspect-square bg-card border border-border/50 text-destructive rounded-2xl hover:bg-destructive/10 shadow-lg shadow-black/5 active:scale-95 transition-all text-sm"
              title="清空日志"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-40 group-focus-within:opacity-100 transition-opacity">
            🔍
          </span>
          <input
            type="text"
            placeholder="FILTER LOG ENTRIES BY CONTENT OR MODULE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/20 rounded-2xl text-[10px] font-bold tracking-[0.1em] uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* 日志列表 - 现代化终端外观 */}
      <div
        ref={scrollRef}
        className="flex-1 bg-card/10 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-y-auto overflow-x-hidden custom-scrollbar shadow-2xl shadow-black/5"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="text-5xl mb-4 opacity-20">🍃</div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              {logs.length === 0 ? 'Quiet... No logs yet' : 'No matches found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="px-6 py-3.5 hover:bg-primary/5 transition-all group flex items-start gap-4"
              >
                <div className="flex-none flex flex-col items-center gap-1.5 w-14">
                  <span
                    className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest w-full text-center ${getLogLevelColor(log.level)}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-muted-foreground/40 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded uppercase tracking-wider">
                      {log.module.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-foreground/80 leading-relaxed font-mono break-all group-hover:text-foreground transition-colors">
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-6 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        <div className="flex gap-4">
          <span>
            PORTFOLIO TOTAL: <span className="text-foreground">{logs.length}</span>
          </span>
          <span className="opacity-40">|</span>
          <span>
            FILTERED: <span className="text-primary">{filteredLogs.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          STREAMING DATA
        </div>
      </div>
    </div>
  )
}
