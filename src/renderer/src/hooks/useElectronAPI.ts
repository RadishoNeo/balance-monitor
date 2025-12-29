import { useEffect, useState } from 'react'
import { ExtendedElectronAPI } from '../types'

// 检查electron API是否可用
export const useElectronAPI = () => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [api, setApi] = useState<ExtendedElectronAPI | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      setApi(window.electron)
      setIsAvailable(true)
    }
  }, [])

  return { api, isAvailable }
}

// 应用信息Hook
export const useAppInfo = () => {
  const { api } = useElectronAPI()
  const [appInfo, setAppInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (api) {
      api.getAppInfo().then((info) => {
        setAppInfo(info)
        setLoading(false)
      })
    }
  }, [api])

  return { appInfo, loading }
}

// 事件监听Hook
export const useElectronEvents = () => {
  const { api } = useElectronAPI()
  const [balanceUpdate, setBalanceUpdate] = useState<any>(null)
  const [statusChange, setStatusChange] = useState<any>(null)
  const [appReady, setAppReady] = useState(false)
  const [navigateToConfig, setNavigateToConfig] = useState(false)

  useEffect(() => {
    if (!api) {
      return
    }

    // 监听余额更新
    const unsubscribeBalance = api.onBalanceUpdate((data) => {
      setBalanceUpdate(data)
    })

    // 监听状态变化
    const unsubscribeStatus = api.onStatusChange((data) => {
      setStatusChange(data)
    })

    // 监听应用就绪
    const unsubscribeReady = api.onAppReady(() => {
      setAppReady(true)
    })

    // 监听导航到配置
    const unsubscribeNavigate = api.onNavigateToConfig(() => {
      setNavigateToConfig(true)
      // 3秒后重置
      setTimeout(() => setNavigateToConfig(false), 3000)
    })

    return () => {
      unsubscribeBalance()
      unsubscribeStatus()
      unsubscribeReady()
      unsubscribeNavigate()
    }
  }, [api])

  return {
    balanceUpdate,
    statusChange,
    appReady,
    navigateToConfig
  }
}
