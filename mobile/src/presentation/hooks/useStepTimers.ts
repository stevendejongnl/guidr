import { useState, useEffect, useRef, useCallback } from 'react'
import { SyncEventEmitter } from '../../common/SyncEventEmitter'
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
    if (dto.serverTime && dto.receivedAt) {
      // Clock-drift-resistant: server-to-server + client-to-client
      const serverElapsed = Math.floor(
        (Date.parse(dto.serverTime) - Date.parse(dto.startedAt)) / 1000,
      )
      const localElapsed = Math.floor(
        (Date.now() - dto.receivedAt) / 1000,
      )
      elapsed += Math.max(0, serverElapsed + localElapsed)
    } else {
      // Backwards compat: old API without serverTime
      const startedMs = Date.parse(dto.startedAt)
      if (!isNaN(startedMs)) {
        elapsed += Math.floor((Date.now() - startedMs) / 1000)
      }
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

  // Subscribe to cross-device sync events
  useEffect(() => {
    const handleStarted = (payload: Record<string, unknown>) => {
      if (payload['guideId'] !== guideId) return
      const dto: StepTimerDto = {
        id: payload['timerId'] as string,
        stepId: payload['stepId'] as string,
        guideId: payload['guideId'] as string,
        userId: '',
        status: 'running',
        startedAt: payload['startedAt'] as string,
        accumulatedSeconds: payload['accumulatedSeconds'] as number,
        durationSeconds: payload['durationSeconds'] as number,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serverTime: (payload['serverTime'] as string) ?? null,
        receivedAt: Date.now(),
      }
      updateDto(dto)
    }

    const handlePaused = (payload: Record<string, unknown>) => {
      if (payload['guideId'] !== guideId) return
      const stepId = payload['stepId'] as string
      setTimerDtos((prev) => {
        const existing = prev[stepId]
        if (!existing) return prev
        return {
          ...prev,
          [stepId]: {
            ...existing,
            status: 'paused' as const,
            startedAt: null,
            accumulatedSeconds: payload['accumulatedSeconds'] as number,
          },
        }
      })
    }

    const handleReset = (payload: Record<string, unknown>) => {
      if (payload['guideId'] !== guideId) return
      const stepId = payload['stepId'] as string
      setTimerDtos((prev) => {
        const existing = prev[stepId]
        if (!existing) return prev
        return {
          ...prev,
          [stepId]: {
            ...existing,
            status: 'idle' as const,
            startedAt: null,
            accumulatedSeconds: 0,
          },
        }
      })
    }

    const unsub1 = SyncEventEmitter.on('timer.started', handleStarted)
    const unsub2 = SyncEventEmitter.on('timer.paused', handlePaused)
    const unsub3 = SyncEventEmitter.on('timer.reset', handleReset)

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [guideId])

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
