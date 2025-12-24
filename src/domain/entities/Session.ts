export enum SessionStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Paused = 'Paused',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export class Session {
  readonly id: string
  readonly guideId: string
  private _status: SessionStatus
  private _startedAt: Date | undefined
  private _completedAt: Date | undefined
  private _currentStepId: string | undefined
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(id: string, guideId: string) {
    if (!id || id.trim() === '') {
      throw new Error('Session id cannot be empty')
    }
    if (!guideId || guideId.trim() === '') {
      throw new Error('Guide id cannot be empty')
    }

    this.id = id
    this.guideId = guideId
    this._status = SessionStatus.NotStarted
    this._startedAt = undefined
    this._completedAt = undefined
    this._currentStepId = undefined
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get status(): SessionStatus {
    return this._status
  }

  get startedAt(): Date | undefined {
    return this._startedAt
  }

  get completedAt(): Date | undefined {
    return this._completedAt
  }

  get currentStepId(): string | undefined {
    return this._currentStepId
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  start(): void {
    if (this._status !== SessionStatus.NotStarted) {
      throw new Error('Session has already been started')
    }
    this._status = SessionStatus.InProgress
    this._startedAt = new Date()
    this._updatedAt = new Date()
  }

  pause(): void {
    if (this._status !== SessionStatus.InProgress) {
      throw new Error('Cannot pause session that is not in progress')
    }
    this._status = SessionStatus.Paused
    this._updatedAt = new Date()
  }

  resume(): void {
    if (this._status !== SessionStatus.Paused) {
      throw new Error('Cannot resume session that is not paused')
    }
    this._status = SessionStatus.InProgress
    this._updatedAt = new Date()
  }

  complete(): void {
    if (
      this._status !== SessionStatus.InProgress &&
      this._status !== SessionStatus.Paused
    ) {
      throw new Error('Cannot complete session that has not been started')
    }
    this._status = SessionStatus.Completed
    this._completedAt = new Date()
    this._updatedAt = new Date()
  }

  cancel(): void {
    if (
      this._status !== SessionStatus.InProgress &&
      this._status !== SessionStatus.Paused
    ) {
      throw new Error('Cannot cancel session that has not been started')
    }
    this._status = SessionStatus.Cancelled
    this._completedAt = new Date()
    this._updatedAt = new Date()
  }

  moveToStep(stepId: string): void {
    if (
      this._status !== SessionStatus.InProgress &&
      this._status !== SessionStatus.Paused
    ) {
      throw new Error('Cannot move to step when session is not active')
    }
    this._currentStepId = stepId
    this._updatedAt = new Date()
  }

  isActive(): boolean {
    return (
      this._status === SessionStatus.InProgress ||
      this._status === SessionStatus.Paused
    )
  }
}
