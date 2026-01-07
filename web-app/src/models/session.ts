export enum SessionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Session {
  id: string
  guide_id: string
  status: SessionStatus
  current_step_index: number
  started_at: string | null
  completed_at: string | null
}

export interface StartSessionRequest {
  guide_id: string
}
