import { ActiveStepTimerDto } from './dtos/ActiveStepTimerDto'
import { StepTimerDto } from './dtos/StepTimerDto'
import { extractErrorMessage } from '../../common/ApiErrorUtils'

export class StepTimerClient {
  private readonly apiBaseUrl: string

  constructor(serverUrl: string) {
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('Server URL cannot be empty')
    }
    const normalized = serverUrl.replace(/\/$/, '')
    if (normalized.endsWith('/api/v1')) {
      this.apiBaseUrl = normalized
    } else {
      this.apiBaseUrl = `${normalized}/api/v1`
    }
  }

  private stampReceived<T extends StepTimerDto>(dto: T): T {
    return { ...dto, receivedAt: Date.now() }
  }

  async startTimer(
    stepId: string,
    guideId: string,
    durationSeconds: number,
    authToken: string,
  ): Promise<StepTimerDto> {
    const response = await fetch(`${this.apiBaseUrl}/step-timers/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ stepId, guideId, durationSeconds }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to start timer'))
    }

    const dto: StepTimerDto = await response.json()
    return this.stampReceived(dto)
  }

  async pauseTimer(timerId: string, authToken: string): Promise<StepTimerDto> {
    const response = await fetch(
      `${this.apiBaseUrl}/step-timers/${timerId}/pause`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to pause timer'))
    }

    const dto: StepTimerDto = await response.json()
    return this.stampReceived(dto)
  }

  async resetTimer(timerId: string, authToken: string): Promise<StepTimerDto> {
    const response = await fetch(
      `${this.apiBaseUrl}/step-timers/${timerId}/reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to reset timer'))
    }

    const dto: StepTimerDto = await response.json()
    return this.stampReceived(dto)
  }

  async getActiveTimers(authToken: string): Promise<ActiveStepTimerDto[]> {
    const response = await fetch(`${this.apiBaseUrl}/step-timers/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to load active timers'))
    }

    const dtos: ActiveStepTimerDto[] = await response.json()
    return dtos.map((dto) => this.stampReceived(dto))
  }

  async getTimersByGuide(
    guideId: string,
    authToken: string,
  ): Promise<StepTimerDto[]> {
    const response = await fetch(
      `${this.apiBaseUrl}/step-timers?guide_id=${encodeURIComponent(guideId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData, 'Failed to load timers'))
    }

    const dtos: StepTimerDto[] = await response.json()
    return dtos.map((dto) => this.stampReceived(dto))
  }
}
