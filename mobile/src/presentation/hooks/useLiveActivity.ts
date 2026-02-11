import { useRef, useCallback, useEffect } from 'react'
import { LiveActivityService, LiveActivityData } from '../../infrastructure/native/LiveActivityService'

interface UseLiveActivityReturn {
  addTimer: (data: LiveActivityData) => Promise<void>
  updateTimer: (stepId: string, remainingSeconds: number, isPaused: boolean, isComplete: boolean) => Promise<void>
  removeTimer: (stepId: string) => Promise<void>
  endAllTimers: () => Promise<void>
}

export function useLiveActivity(
  liveActivityService?: LiveActivityService,
): UseLiveActivityReturn {
  const serviceRef = useRef(liveActivityService ?? new LiveActivityService())
  const activeTimerIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const service = serviceRef.current
    return () => {
      if (activeTimerIdsRef.current.size > 0) {
        service.endLiveActivity()
        activeTimerIdsRef.current.clear()
      }
    }
  }, [])

  const addTimer = useCallback(async (data: LiveActivityData) => {
    if (data.totalDurationSeconds <= 0) return
    const result = await serviceRef.current.startLiveActivity(data)
    if (result !== null) {
      activeTimerIdsRef.current.add(data.stepId)
    }
  }, [])

  const updateTimer = useCallback(
    async (stepId: string, remainingSeconds: number, isPaused: boolean, isComplete: boolean) => {
      if (!activeTimerIdsRef.current.has(stepId)) return
      await serviceRef.current.updateLiveActivity(stepId, remainingSeconds, isPaused, isComplete)
    },
    [],
  )

  const removeTimer = useCallback(async (stepId: string) => {
    if (!activeTimerIdsRef.current.has(stepId)) return
    await serviceRef.current.removeLiveActivityTimer(stepId)
    activeTimerIdsRef.current.delete(stepId)
  }, [])

  const endAllTimers = useCallback(async () => {
    if (activeTimerIdsRef.current.size === 0) return
    await serviceRef.current.endLiveActivity()
    activeTimerIdsRef.current.clear()
  }, [])

  return { addTimer, updateTimer, removeTimer, endAllTimers }
}
