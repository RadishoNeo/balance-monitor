import { useState, useEffect, useRef, useCallback } from 'react'

interface AutoSaveOptions {
  delay?: number
  onSave: (data: any) => Promise<void>
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function useAutoSave({ delay = 1000, onSave, onError, onSuccess }: AutoSaveOptions) {
  const [dataToSave, setDataToSave] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSave = useCallback((data?: any) => {
    setDataToSave(data !== undefined ? data : null)
  }, [])

  useEffect(() => {
    if (!dataToSave || isSaving) return

    // 清除之前的定时器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 设置新的定时器
    debounceRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await onSave(dataToSave)
        onSuccess?.()
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsSaving(false)
        setDataToSave(null)
      }
    }, delay)

    // 清理函数
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [dataToSave, delay, isSaving, onError, onSave, onSuccess])

  return {
    triggerSave,
    isSaving
  }
}
