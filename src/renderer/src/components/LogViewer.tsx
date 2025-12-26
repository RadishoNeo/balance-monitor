import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onClearLogs, onRefreshLogs }) => {
  const [filter, setFilter] = useState<'all' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG'>('all');
  const [search, setSearch] = useState('');

  // 获取日志颜色
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'SUCCESS': return 'text-green-600 bg-green-50';
      case 'DEBUG': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) &&
      !log.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // 自动滚动到底部
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="all">全部</option>
          <option value="INFO">INFO</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        <input
          type="text"
          placeholder="搜索日志..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1 border rounded text-sm min-w-0"
        />

        <button
          onClick={onRefreshLogs}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          刷新
        </button>

        <button
          onClick={onClearLogs}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          清空
        </button>
      </div>

      {/* 日志列表 */}
      <div
        ref={scrollRef}
        className="flex-1 border rounded-md overflow-y-auto bg-white text-xs font-mono"
        style={{ maxHeight: '400px' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {logs.length === 0 ? '暂无日志' : '没有匹配的日志'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredLogs.map((log, index) => (
              <div key={index} className="p-2 hover:bg-gray-50">
                <div className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded ${getLogLevelColor(log.level)} whitespace-nowrap`}>
                    {log.level}
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    [{log.module}]
                  </span>
                  <span className="text-gray-800 break-all">
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="text-xs text-gray-500 flex justify-between">
        <span>总计: {logs.length} 条</span>
        <span>显示: {filteredLogs.length} 条</span>
      </div>
    </div>
  );
};
