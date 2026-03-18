import { useRef, useCallback } from 'react'
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

  const addTimer = useCallback(async (data: LiveActivityData) => {
    if (data.totalDurationSeconds <= 0 || data.remainingSeconds <= 0) {
      console.warn('[LiveActivity] BLOCKED: duration or remaining <= 0', data)
      return
    }
    await serviceRef.current.startLiveActivity(data)
  }, [])

  const updateTimer = useCallback(
    async (stepId: string, remainingSeconds: number, isPaused: boolean, isComplete: boolean) => {
      await serviceRef.current.updateLiveActivity(stepId, remainingSeconds, isPaused, isComplete)
    },
    [],
  )

  const removeTimer = useCallback(async (stepId: string) => {
    await serviceRef.current.removeLiveActivityTimer(stepId)
  }, [])

  const endAllTimers = useCallback(async () => {
    await serviceRef.current.endLiveActivity()
  }, [])

  return { addTimer, updateTimer, removeTimer, endAllTimers }
}
