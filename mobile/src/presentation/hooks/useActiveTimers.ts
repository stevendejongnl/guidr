import { useState, useEffect, useRef, useCallback } from 'react'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { ActiveStepTimerDto } from '../../infrastructure/api/dtos/ActiveStepTimerDto'
import { calculateDisplay, StepTimerDisplay } from './useStepTimers'

const AUTO_RESET_DELAY_MS = 2 * 60 * 1000 // 2 minutes

export interface ActiveTimerItem {
  timerId: string
  guideId: string
  stepId: string
  guideTitle: string
  stepTitle: string
  display: StepTimerDisplay
}

export interface UseActiveTimersReturn {
  activeTimers: ActiveTimerItem[]
  loading: boolean
  refresh: () => Promise<void>
}

export function useActiveTimers(
  authToken: string | null,
  client: StepTimerClient | null,
): UseActiveTimersReturn {
  const [dtos, setDtos] = useState<ActiveStepTimerDto[]>([])
  const [activeTimers, setActiveTimers] = useState<ActiveTimerItem[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef<Set<string>>(new Set())
  const resetTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const mapDtosToItems = useCallback((items: ActiveStepTimerDto[]): ActiveTimerItem[] => {
    return items.map((dto) => ({
      timerId: dto.id,
      guideId: dto.guideId,
      stepId: dto.stepId,
      guideTitle: dto.guideTitle,
      stepTitle: dto.stepTitle,
      display: calculateDisplay(dto),
    }))
  }, [])

  const recalculate = useCallback(() => {
    setActiveTimers(mapDtosToItems(dtos))
  }, [dtos, mapDtosToItems])

  const fetchTimers = useCallback(async () => {
    if (!authToken || !client) {
      setLoading(false)
      return
    }

    try {
      const result = await client.getActiveTimers(authToken)
      setDtos(result)
    } catch {
      // Timers are non-critical — silently fail
    } finally {
      setLoading(false)
    }
  }, [authToken, client])

  // Load on mount
  useEffect(() => {
    fetchTimers()
  }, [fetchTimers])

  // Recalculate whenever DTOs change
  useEffect(() => {
    recalculate()
  }, [recalculate])

  // Tick interval for running timers
  useEffect(() => {
    const hasRunning = dtos.some((dto) => dto.status === 'running')

    if (hasRunning) {
      intervalRef.current = setInterval(() => {
        recalculate()
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [dtos, recalculate])

  // Auto-reset completed timers after delay
  useEffect(() => {
    for (const timer of activeTimers) {
      if (timer.display.isComplete && !completedRef.current.has(timer.timerId)) {
        completedRef.current.add(timer.timerId)

        const timeoutId = setTimeout(async () => {
          if (!authToken || !client) return
          try {
            await client.resetTimer(timer.timerId, authToken)
          } catch {
            // Silently fail — timer stays visible
          }
          completedRef.current.delete(timer.timerId)
          resetTimeoutsRef.current.delete(timer.timerId)
          await fetchTimers()
        }, AUTO_RESET_DELAY_MS)

        resetTimeoutsRef.current.set(timer.timerId, timeoutId)
      }
    }

    // Clean up tracking for timers no longer in the list
    const currentIds = new Set(activeTimers.map((t) => t.timerId))
    for (const id of completedRef.current) {
      if (!currentIds.has(id)) {
        completedRef.current.delete(id)
        const timeout = resetTimeoutsRef.current.get(id)
        if (timeout) {
          clearTimeout(timeout)
          resetTimeoutsRef.current.delete(id)
        }
      }
    }
  }, [activeTimers, authToken, client, fetchTimers])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = resetTimeoutsRef.current
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout)
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchTimers()
  }, [fetchTimers])

  return { activeTimers, loading, refresh }
}
