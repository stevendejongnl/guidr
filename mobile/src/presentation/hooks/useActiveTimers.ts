import { useState, useEffect, useRef, useCallback } from 'react'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { ActiveStepTimerDto } from '../../infrastructure/api/dtos/ActiveStepTimerDto'
import { calculateDisplay, StepTimerDisplay } from './useStepTimers'

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

  const refresh = useCallback(async () => {
    await fetchTimers()
  }, [fetchTimers])

  return { activeTimers, loading, refresh }
}
