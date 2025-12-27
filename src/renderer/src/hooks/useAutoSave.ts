import { useState, useEffect, useRef, useCallback } from 'react'

interface AutoSaveOptions {
  delay?: number
  onSave: (data: any) => Promise<void>
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function useAutoSave({ delay = 1000, onSave, onError, onSuccess }: AutoSaveOptions) {
  const [dataToSave, setDataToSave] = useState<any>(undefined)
  const [hasPendingSave, setHasPendingSave] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSave = useCallback((data?: any) => {
    setDataToSave(data)
    setHasPendingSave(true)
  }, [])

  useEffect(() => {
    if (!hasPendingSave || isSaving) return

    // 清除之前的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 设置新的定时器
    debounceRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        setHasPendingSave(false)
        await onSave(dataToSave)
        onSuccess?.()
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsSaving(false)
        setDataToSave(undefined)
      }
    }, delay)

    // 清理函数
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [dataToSave, delay, isSaving, onError, onSave, onSuccess, hasPendingSave])

  return {
    triggerSave,
    isSaving
  }
}
