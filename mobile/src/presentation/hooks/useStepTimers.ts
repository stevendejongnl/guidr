import { useState, useEffect, useRef, useCallback } from 'react'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { StepTimerDto } from '../../infrastructure/api/dtos/StepTimerDto'

export interface StepTimerDisplay {
  timerId: string | null
  mode: 'countdown' | 'stopwatch'
  displaySeconds: number
  isRunning: boolean
  isPaused: boolean
  isComplete: boolean
}

export interface UseStepTimersReturn {
  timers: Record<string, StepTimerDisplay>
  startTimer: (stepId: string, durationMinutes: number) => Promise<void>
  pauseTimer: (stepId: string) => Promise<void>
  resetTimer: (stepId: string) => Promise<void>
  loading: boolean
}

export function calculateDisplay(dto: StepTimerDto): StepTimerDisplay {
  const mode = dto.durationSeconds > 0 ? 'countdown' : 'stopwatch'
  let elapsed = dto.accumulatedSeconds

  if (dto.status === 'running' && dto.startedAt) {
    const startedMs = Date.parse(dto.startedAt)
    if (!isNaN(startedMs)) {
      elapsed += Math.floor((Date.now() - startedMs) / 1000)
    }
  }

  let displaySeconds: number
  if (mode === 'countdown') {
    displaySeconds = Math.max(0, dto.durationSeconds - elapsed)
  } else {
    displaySeconds = elapsed
  }

  return {
    timerId: dto.id,
    mode,
    displaySeconds,
    isRunning: dto.status === 'running',
    isPaused: dto.status === 'paused',
    isComplete: mode === 'countdown' && elapsed >= dto.durationSeconds,
  }
}

export function useStepTimers(
  guideId: string,
  authToken: string | null,
  client: StepTimerClient | null,
): UseStepTimersReturn {
  const [timerDtos, setTimerDtos] = useState<Record<string, StepTimerDto>>({})
  const [timers, setTimers] = useState<Record<string, StepTimerDisplay>>({})
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Recalculate display values from DTOs
  const recalculate = useCallback(() => {
    const updated: Record<string, StepTimerDisplay> = {}
    for (const [stepId, dto] of Object.entries(timerDtos)) {
      updated[stepId] = calculateDisplay(dto)
    }
    setTimers(updated)
  }, [timerDtos])

  // Load timers on mount
  useEffect(() => {
    if (!authToken || !client) {
      setLoading(false)
      return
    }

    let cancelled = false
    const currentClient = client
    const load = async () => {
      try {
        const dtos = await currentClient.getTimersByGuide(guideId, authToken)
        if (cancelled) return
        const byStepId: Record<string, StepTimerDto> = {}
        for (const dto of dtos) {
          byStepId[dto.stepId] = dto
        }
        setTimerDtos(byStepId)
      } catch {
        // Silently fail — timers are non-critical
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [guideId, authToken, client])

  // Recalculate whenever DTOs change
  useEffect(() => {
    recalculate()
  }, [recalculate])

  // Manage tick interval for running timers
  useEffect(() => {
    const hasRunning = Object.values(timerDtos).some(
      (dto) => dto.status === 'running',
    )

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
  }, [timerDtos, recalculate])

  const updateDto = (dto: StepTimerDto) => {
    setTimerDtos((prev) => ({ ...prev, [dto.stepId]: dto }))
  }

  const startTimer = useCallback(
    async (stepId: string, durationMinutes: number) => {
      if (!authToken || !client) return
      const durationSeconds = durationMinutes * 60
      const dto = await client.startTimer(stepId, guideId, durationSeconds, authToken)
      updateDto(dto)
    },
    [authToken, guideId, client],
  )

  const pauseTimer = useCallback(
    async (stepId: string) => {
      if (!authToken || !client) return
      const existing = timerDtos[stepId]
      if (!existing?.id) return
      const dto = await client.pauseTimer(existing.id, authToken)
      updateDto(dto)
    },
    [authToken, timerDtos, client],
  )

  const resetTimer = useCallback(
    async (stepId: string) => {
      if (!authToken || !client) return
      const existing = timerDtos[stepId]
      if (!existing?.id) return
      const dto = await client.resetTimer(existing.id, authToken)
      updateDto(dto)
    },
    [authToken, timerDtos, client],
  )

  return { timers, startTimer, pauseTimer, resetTimer, loading }
}
