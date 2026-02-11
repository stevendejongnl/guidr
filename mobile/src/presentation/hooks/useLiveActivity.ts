import { useRef, useCallback, useEffect } from 'react'
import { LiveActivityService, LiveActivityData } from '../../infrastructure/native/LiveActivityService'

interface UseLiveActivityReturn {
  startLiveActivity: (data: LiveActivityData) => Promise<void>
  updateLiveActivity: (remainingSeconds: number, isPaused: boolean, isComplete: boolean) => Promise<void>
  endLiveActivity: () => Promise<void>
}

export function useLiveActivity(
  liveActivityService?: LiveActivityService,
): UseLiveActivityReturn {
  const serviceRef = useRef(liveActivityService ?? new LiveActivityService())
  const activeRef = useRef(false)

  useEffect(() => {
    const service = serviceRef.current
    return () => {
      if (activeRef.current) {
        service.endLiveActivity()
        activeRef.current = false
      }
    }
  }, [])

  const startLiveActivity = useCallback(async (data: LiveActivityData) => {
    if (data.totalDurationSeconds <= 0) return
    const result = await serviceRef.current.startLiveActivity(data)
    activeRef.current = result !== null
  }, [])

  const updateLiveActivity = useCallback(
    async (remainingSeconds: number, isPaused: boolean, isComplete: boolean) => {
      if (!activeRef.current) return
      await serviceRef.current.updateLiveActivity(remainingSeconds, isPaused, isComplete)
    },
    [],
  )

  const endLiveActivity = useCallback(async () => {
    if (!activeRef.current) return
    await serviceRef.current.endLiveActivity()
    activeRef.current = false
  }, [])

  return { startLiveActivity, updateLiveActivity, endLiveActivity }
}
