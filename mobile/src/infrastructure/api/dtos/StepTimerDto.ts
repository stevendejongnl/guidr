export interface StepTimerDto {
  id: string
  stepId: string
  guideId: string
  userId: string
  status: 'idle' | 'running' | 'paused'
  startedAt: string | null // ISO datetime
  accumulatedSeconds: number
  durationSeconds: number
  createdAt: string
  updatedAt: string
  serverTime?: string | null // ISO datetime from API
  receivedAt?: number // Date.now() when response received
}
