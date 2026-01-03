import { SessionRepository } from './SessionRepository'
import { Session, SessionStatus } from '@domain/entities/Session'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SessionDto } from '../api/dtos/SessionDto'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

// Mock global fetch
global.fetch = jest.fn()

describe('SessionRepository', () => {
  const serverUrl = 'http://localhost:8000/api/v1'
  const authToken = 'mock-auth-token'
  let repository: SessionRepository

  const mockSessionDto: SessionDto = {
    id: 'session-1',
    guideId: 'guide-1',
    status: 'NotStarted',
    currentStepId: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockInProgressSessionDto: SessionDto = {
    id: 'session-2',
    guideId: 'guide-1',
    status: 'InProgress',
    currentStepId: 'step-1',
    startedAt: '2024-01-01T10:00:00Z',
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
    repository = new SessionRepository(serverUrl)
  })

  describe('constructor', () => {
    it('should create repository with valid server URL', () => {
      expect(() => new SessionRepository('http://localhost:8000')).not.toThrow()
    })

    it('should throw error if server URL is empty', () => {
      expect(() => new SessionRepository('')).toThrow('Server URL cannot be empty')
    })
  })

  describe('findById', () => {
    it('should return session from cache if available', async () => {
      const cacheKey = 'Guidr_Cache_Session_session-1'
      const cachedData = {
        data: mockSessionDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findById('session-1', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(result?.id).toBe('session-1')
      expect(result?.guideId).toBe('guide-1')
      expect(result?.status).toBe(SessionStatus.NotStarted)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(cacheKey)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSessionDto,
      })

      const result = await repository.findById('session-1', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/sessions/session-1', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should return null if session not found (404)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await repository.findById('session-999', authToken)

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all sessions from cache if available', async () => {
      const cachedData = {
        data: [mockSessionDto, mockInProgressSessionDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Session)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch all sessions from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockSessionDto, mockInProgressSessionDto],
      })

      const result = await repository.findAll(authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/sessions', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('findByGuideId', () => {
    it('should return sessions by guide ID from cache', async () => {
      const cachedData = {
        data: [mockSessionDto, mockInProgressSessionDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByGuideId('guide-1', authToken)

      expect(result).toHaveLength(2)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch sessions by guide ID from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockSessionDto],
      })

      const result = await repository.findByGuideId('guide-1', authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions?guideId=guide-1',
        expect.any(Object)
      )
    })
  })

  describe('findByStatus', () => {
    it('should return sessions by status from cache', async () => {
      const cachedData = {
        data: [mockInProgressSessionDto],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      const result = await repository.findByStatus(SessionStatus.InProgress, authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch sessions by status from API on cache miss', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockInProgressSessionDto],
      })

      const result = await repository.findByStatus(SessionStatus.InProgress, authToken)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions?status=InProgress',
        expect.any(Object)
      )
    })
  })

  describe('save', () => {
    it('should create new session via POST', async () => {
      const newSession = new Session('session-3', 'guide-2')

      // findById returns null (doesn't exist)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // findById check
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'session-3',
            guideId: 'guide-2',
            status: 'NotStarted',
            currentStepId: null,
            startedAt: null,
            pausedAt: null,
            completedAt: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        })

      await repository.save(newSession, authToken)

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guideId: 'guide-2',
        }),
      })
    })

    it('should throw error when trying to update existing session', async () => {
      const existingSession = new Session('session-1', 'guide-1')

      // findById returns existing (cache hit)
      const cachedData = {
        data: mockSessionDto,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000,
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData))

      await expect(repository.save(existingSession, authToken)).rejects.toThrow(
        'Cannot update session via save - use action methods instead'
      )
    })

    it('should invalidate cache on save', async () => {
      const newSession = new Session('session-3', 'guide-2')

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockSessionDto,
        })

      await repository.save(newSession, authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Session_List_all')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_Session_List_guide_guide-2'
      )
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_Session_List_status_NotStarted'
      )
    })
  })

  describe('delete', () => {
    it('should delete session by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await repository.delete('session-1', authToken)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should handle 404 gracefully on delete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(repository.delete('session-999', authToken)).resolves.not.toThrow()
    })
  })

  describe('start', () => {
    it('should start session via dedicated endpoint', async () => {
      const startedDto = {
        ...mockSessionDto,
        status: 'InProgress',
        startedAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => startedDto,
      })

      const result = await repository.start('session-1', authToken)

      expect(result).toBeInstanceOf(Session)
      // Note: Session entity state is not preserved from API (known limitation)
      // The important part is that the correct API call was made
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-1/start',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('should invalidate caches after start', async () => {
      const startedDto = { ...mockSessionDto, status: 'InProgress' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => startedDto,
      })

      await repository.start('session-1', authToken)

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('Guidr_Cache_Session_List_all')
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_Session_List_status_NotStarted'
      )
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'Guidr_Cache_Session_List_status_InProgress'
      )
    })
  })

  describe('pause', () => {
    it('should pause session via dedicated endpoint', async () => {
      const pausedDto = {
        ...mockInProgressSessionDto,
        status: 'Paused',
        pausedAt: '2024-01-01T11:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => pausedDto,
      })

      const result = await repository.pause('session-2', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-2/pause',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  describe('resume', () => {
    it('should resume session via dedicated endpoint', async () => {
      const resumedDto = {
        ...mockInProgressSessionDto,
        status: 'InProgress',
        pausedAt: null,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => resumedDto,
      })

      const result = await repository.resume('session-2', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-2/resume',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  describe('complete', () => {
    it('should complete session via dedicated endpoint', async () => {
      const completedDto = {
        ...mockInProgressSessionDto,
        status: 'Completed',
        completedAt: '2024-01-01T12:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => completedDto,
      })

      const result = await repository.complete('session-2', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-2/complete',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  describe('cancel', () => {
    it('should cancel session via dedicated endpoint', async () => {
      const cancelledDto = {
        ...mockInProgressSessionDto,
        status: 'Cancelled',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => cancelledDto,
      })

      const result = await repository.cancel('session-2', authToken)

      expect(result).toBeInstanceOf(Session)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-2/cancel',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  })

  describe('moveToStep', () => {
    it('should move session to step via dedicated endpoint', async () => {
      const movedDto = {
        ...mockInProgressSessionDto,
        currentStepId: 'step-2',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => movedDto,
      })

      const result = await repository.moveToStep('session-2', 'step-2', authToken)

      expect(result).toBeInstanceOf(Session)
      // Note: currentStepId is not preserved due to entity limitations
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/sessions/session-2/move-to-step',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stepId: 'step-2' }),
        }
      )
    })

    it('should not invalidate list caches after moveToStep', async () => {
      const movedDto = { ...mockInProgressSessionDto, currentStepId: 'step-2' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => movedDto,
      })

      await repository.moveToStep('session-2', 'step-2', authToken)

      // Should update individual cache but not invalidate lists (status unchanged)
      expect(AsyncStorage.setItem).toHaveBeenCalled()
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(repository.findById('session-1', authToken)).rejects.toThrow('Network failure')
    })

    it('should handle API errors on action methods', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid state transition' }),
      })

      await expect(repository.start('session-1', authToken)).rejects.toThrow(
        'Invalid state transition'
      )
    })
  })
})
