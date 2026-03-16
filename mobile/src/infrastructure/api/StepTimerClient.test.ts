import { StepTimerClient } from './StepTimerClient'
import { StepTimerDto } from './dtos/StepTimerDto'
import { ActiveStepTimerDto } from './dtos/ActiveStepTimerDto'

global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

function makeTimerDto(overrides: Partial<StepTimerDto> = {}): StepTimerDto {
  return {
    id: 'timer-1',
    stepId: 'step-1',
    guideId: 'guide-1',
    userId: 'user-1',
    status: 'running',
    startedAt: '2024-01-01T00:00:00Z',
    accumulatedSeconds: 0,
    durationSeconds: 60,
    remainingSeconds: 60,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    serverTime: null,
    ...overrides,
  }
}

function makeActiveTimerDto(overrides: Partial<ActiveStepTimerDto> = {}): ActiveStepTimerDto {
  return {
    ...makeTimerDto(),
    guideTitle: 'My Guide',
    stepTitle: 'Step One',
    ...overrides,
  }
}

describe('StepTimerClient', () => {
  let client: StepTimerClient
  const serverUrl = 'http://localhost:8000'
  const authToken = 'test-auth-token'

  beforeEach(() => {
    client = new StepTimerClient(serverUrl)
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('throws when server URL is empty', () => {
      expect(() => new StepTimerClient('')).toThrow('Server URL cannot be empty')
    })

    it('throws when server URL is whitespace only', () => {
      expect(() => new StepTimerClient('   ')).toThrow('Server URL cannot be empty')
    })

    it('removes trailing slash from server URL', () => {
      expect(() => new StepTimerClient('http://localhost:8000/')).not.toThrow()
    })

    it('does not duplicate /api/v1 when URL already ends with it', async () => {
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const clientWithPath = new StepTimerClient('http://localhost:8000/api/v1')
      await clientWithPath.startTimer('step-1', 'guide-1', 60, authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/start',
        expect.any(Object),
      )
    })

    it('appends /api/v1 when URL does not include it', async () => {
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      await client.startTimer('step-1', 'guide-1', 60, authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/start',
        expect.any(Object),
      )
    })
  })

  describe('startTimer', () => {
    it('returns stamped DTO on success', async () => {
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const result = await client.startTimer('step-1', 'guide-1', 60, authToken)

      expect(result.id).toBe('timer-1')
      expect(typeof result.receivedAt).toBe('number')
    })

    it('sends correct request body and headers', async () => {
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      await client.startTimer('step-1', 'guide-1', 60, authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/start',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ stepId: 'step-1', guideId: 'guide-1', durationSeconds: 60 }),
        },
      )
    })

    it('throws with detail message when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Timer already running' }),
      } as Response)

      await expect(client.startTimer('step-1', 'guide-1', 60, authToken)).rejects.toThrow(
        'Timer already running',
      )
    })

    it('throws fallback message when error response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(client.startTimer('step-1', 'guide-1', 60, authToken)).rejects.toThrow(
        'Failed to start timer',
      )
    })

    it('falls back to fallback message when error response JSON parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('parse error') },
      } as unknown as Response)

      await expect(client.startTimer('step-1', 'guide-1', 60, authToken)).rejects.toThrow(
        'Failed to start timer',
      )
    })
  })

  describe('pauseTimer', () => {
    it('returns stamped DTO on success', async () => {
      const dto = makeTimerDto({ status: 'paused' })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const result = await client.pauseTimer('timer-1', authToken)

      expect(result.id).toBe('timer-1')
      expect(result.status).toBe('paused')
      expect(typeof result.receivedAt).toBe('number')
    })

    it('sends POST to correct URL', async () => {
      const dto = makeTimerDto({ status: 'paused' })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      await client.pauseTimer('timer-abc', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/timer-abc/pause',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('throws with detail message when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Timer not found' }),
      } as Response)

      await expect(client.pauseTimer('timer-1', authToken)).rejects.toThrow('Timer not found')
    })

    it('throws fallback message when error response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(client.pauseTimer('timer-1', authToken)).rejects.toThrow('Failed to pause timer')
    })

    it('falls back to fallback message when error response JSON parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('parse error') },
      } as unknown as Response)

      await expect(client.pauseTimer('timer-1', authToken)).rejects.toThrow('Failed to pause timer')
    })
  })

  describe('resetTimer', () => {
    it('returns stamped DTO on success', async () => {
      const dto = makeTimerDto({ status: 'idle', accumulatedSeconds: 0 })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const result = await client.resetTimer('timer-1', authToken)

      expect(result.id).toBe('timer-1')
      expect(result.status).toBe('idle')
      expect(typeof result.receivedAt).toBe('number')
    })

    it('sends POST to correct URL', async () => {
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      await client.resetTimer('timer-xyz', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/timer-xyz/reset',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('throws with detail message when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Timer not found' }),
      } as Response)

      await expect(client.resetTimer('timer-1', authToken)).rejects.toThrow('Timer not found')
    })

    it('throws fallback message when error response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(client.resetTimer('timer-1', authToken)).rejects.toThrow('Failed to reset timer')
    })

    it('falls back to fallback message when error response JSON parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('parse error') },
      } as unknown as Response)

      await expect(client.resetTimer('timer-1', authToken)).rejects.toThrow('Failed to reset timer')
    })
  })

  describe('getActiveTimers', () => {
    it('returns array of stamped DTOs on success', async () => {
      const dtos = [makeActiveTimerDto(), makeActiveTimerDto({ id: 'timer-2', stepId: 'step-2' })]
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dtos,
      } as Response)

      const results = await client.getActiveTimers(authToken)

      expect(results).toHaveLength(2)
      expect(results[0]!['id']).toBe('timer-1')
      expect(typeof results[0]!['receivedAt']).toBe('number')
      expect(results[1]!['id']).toBe('timer-2')
      expect(typeof results[1]!['receivedAt']).toBe('number')
    })

    it('returns empty array when no active timers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const results = await client.getActiveTimers(authToken)

      expect(results).toHaveLength(0)
    })

    it('sends GET to correct URL with auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      await client.getActiveTimers(authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/step-timers/active',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      )
    })

    it('throws with detail message when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Unauthorized' }),
      } as Response)

      await expect(client.getActiveTimers(authToken)).rejects.toThrow('Unauthorized')
    })

    it('throws fallback message when error response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(client.getActiveTimers(authToken)).rejects.toThrow('Failed to load active timers')
    })

    it('falls back to fallback message when error response JSON parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('parse error') },
      } as unknown as Response)

      await expect(client.getActiveTimers(authToken)).rejects.toThrow('Failed to load active timers')
    })
  })

  describe('getTimersByGuide', () => {
    it('returns array of stamped DTOs on success', async () => {
      const dtos = [makeTimerDto(), makeTimerDto({ id: 'timer-2', stepId: 'step-2' })]
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dtos,
      } as Response)

      const results = await client.getTimersByGuide('guide-1', authToken)

      expect(results).toHaveLength(2)
      expect(results[0]!['id']).toBe('timer-1')
      expect(typeof results[0]!['receivedAt']).toBe('number')
    })

    it('encodes guideId in query string', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      await client.getTimersByGuide('guide/with spaces', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/step-timers?guide_id=${encodeURIComponent('guide/with spaces')}`,
        expect.any(Object),
      )
    })

    it('sends GET with correct auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      await client.getTimersByGuide('guide-1', authToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('guide_id=guide-1'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
      )
    })

    it('throws with detail message when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Guide not found' }),
      } as Response)

      await expect(client.getTimersByGuide('guide-1', authToken)).rejects.toThrow('Guide not found')
    })

    it('throws fallback message when error response has no detail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      await expect(client.getTimersByGuide('guide-1', authToken)).rejects.toThrow(
        'Failed to load timers',
      )
    })

    it('falls back to fallback message when error response JSON parse fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('parse error') },
      } as unknown as Response)

      await expect(client.getTimersByGuide('guide-1', authToken)).rejects.toThrow(
        'Failed to load timers',
      )
    })
  })

  describe('stampReceived (via returned DTOs)', () => {
    it('sets receivedAt close to Date.now()', async () => {
      const before = Date.now()
      const dto = makeTimerDto()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const result = await client.startTimer('step-1', 'guide-1', 60, authToken)
      const after = Date.now()

      expect(result.receivedAt).toBeGreaterThanOrEqual(before)
      expect(result.receivedAt).toBeLessThanOrEqual(after)
    })

    it('preserves all original DTO fields when stamping', async () => {
      const dto = makeTimerDto({ id: 'timer-99', accumulatedSeconds: 42, durationSeconds: 120 })
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => dto,
      } as Response)

      const result = await client.startTimer('step-1', 'guide-1', 120, authToken)

      expect(result.id).toBe('timer-99')
      expect(result.accumulatedSeconds).toBe(42)
      expect(result.durationSeconds).toBe(120)
    })
  })
})
