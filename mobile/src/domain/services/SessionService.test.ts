import { SessionService } from './SessionService'
import { ISessionRepository } from '../repositories/ISessionRepository'
import { IGuideRepository } from '../repositories/IGuideRepository'
import { IStepRepository } from '../repositories/IStepRepository'
import { Session, SessionStatus } from '../entities/Session'
import { Guide } from '../entities/Guide'
import { Step } from '../entities/Step'

describe('SessionService', () => {
  const authToken = 'mock-auth-token'
  let sessionService: SessionService
  let mockSessionRepository: jest.Mocked<ISessionRepository>
  let mockGuideRepository: jest.Mocked<IGuideRepository>
  let mockStepRepository: jest.Mocked<IStepRepository>

  beforeEach(() => {
    mockSessionRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByGuideId: jest.fn(),
      findByStatus: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      start: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      complete: jest.fn(),
      cancel: jest.fn(),
      moveToStep: jest.fn(),
    }
    mockGuideRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findMyGuides: jest.fn(),
      findPublicGuides: jest.fn(),
      findHighlightedGuides: jest.fn(),
      copyToLanguage: jest.fn(),
      translateToLanguage: jest.fn(),
    }
    mockStepRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByGuideId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    sessionService = new SessionService(
      mockSessionRepository,
      mockGuideRepository,
      mockStepRepository
    )
  })

  describe('createSession', () => {
    it('should create a new session with generated ID', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      mockGuideRepository.findById.mockResolvedValue(guide)

      const session = await sessionService.createSession('guide-1', authToken)

      expect(session.id).toBeDefined()
      expect(session.guideId).toBe('guide-1')
      expect(session.status).toBe(SessionStatus.NotStarted)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if guide not found', async () => {
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(sessionService.createSession('guide-999', authToken)).rejects.toThrow(
        'Guide with id guide-999 not found'
      )
    })
  })

  describe('getSessionById', () => {
    it('should return session if found', async () => {
      const session = new Session('session-1', 'guide-1')
      mockSessionRepository.findById.mockResolvedValue(session)

      const result = await sessionService.getSessionById('session-1', authToken)

      expect(result).toBe(session)
      expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-1', authToken)
    })

    it('should return null if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      const result = await sessionService.getSessionById('session-999', authToken)

      expect(result).toBeNull()
    })
  })

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      const sessions = [new Session('session-1', 'guide-1'), new Session('session-2', 'guide-2')]
      mockSessionRepository.findAll.mockResolvedValue(sessions)

      const result = await sessionService.getAllSessions(authToken)

      expect(result).toEqual(sessions)
      expect(mockSessionRepository.findAll).toHaveBeenCalled()
    })
  })

  describe('getSessionsByGuideId', () => {
    it('should return sessions for guide', async () => {
      const sessions = [new Session('session-1', 'guide-1'), new Session('session-2', 'guide-1')]
      mockSessionRepository.findByGuideId.mockResolvedValue(sessions)

      const result = await sessionService.getSessionsByGuideId('guide-1', authToken)

      expect(result).toEqual(sessions)
      expect(mockSessionRepository.findByGuideId).toHaveBeenCalledWith('guide-1', authToken)
    })
  })

  describe('getSessionsByStatus', () => {
    it('should return sessions with specific status', async () => {
      const sessions = [new Session('session-1', 'guide-1')]
      mockSessionRepository.findByStatus.mockResolvedValue(sessions)

      const result = await sessionService.getSessionsByStatus(SessionStatus.InProgress, authToken)

      expect(result).toEqual(sessions)
      expect(mockSessionRepository.findByStatus).toHaveBeenCalledWith(SessionStatus.InProgress, authToken)
    })
  })

  describe('startSession', () => {
    it('should start a session and save', async () => {
      const session = new Session('session-1', 'guide-1')
      mockSessionRepository.findById.mockResolvedValue(session)

      await sessionService.startSession('session-1', authToken)

      expect(session.status).toBe(SessionStatus.InProgress)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.startSession('session-999', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })
  })

  describe('pauseSession', () => {
    it('should pause a session and save', async () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      mockSessionRepository.findById.mockResolvedValue(session)

      await sessionService.pauseSession('session-1', authToken)

      expect(session.status).toBe(SessionStatus.Paused)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.pauseSession('session-999', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })
  })

  describe('resumeSession', () => {
    it('should resume a session and save', async () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()
      mockSessionRepository.findById.mockResolvedValue(session)

      await sessionService.resumeSession('session-1', authToken)

      expect(session.status).toBe(SessionStatus.InProgress)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.resumeSession('session-999', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })
  })

  describe('completeSession', () => {
    it('should complete a session and save', async () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      mockSessionRepository.findById.mockResolvedValue(session)

      await sessionService.completeSession('session-1', authToken)

      expect(session.status).toBe(SessionStatus.Completed)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.completeSession('session-999', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })
  })

  describe('cancelSession', () => {
    it('should cancel a session and save', async () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      mockSessionRepository.findById.mockResolvedValue(session)

      await sessionService.cancelSession('session-1', authToken)

      expect(session.status).toBe(SessionStatus.Cancelled)
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.cancelSession('session-999', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })
  })

  describe('moveToStep', () => {
    it('should move session to step and save', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      const session = new Session('session-1', 'guide-1')
      session.start()
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)

      mockSessionRepository.findById.mockResolvedValue(session)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(step)

      await sessionService.moveToStep('session-1', 'step-1', authToken)

      expect(session.currentStepId).toBe('step-1')
      expect(mockSessionRepository.save).toHaveBeenCalledWith(session, authToken)
    })

    it('should throw error if session not found', async () => {
      mockSessionRepository.findById.mockResolvedValue(null)

      await expect(sessionService.moveToStep('session-999', 'step-1', authToken)).rejects.toThrow(
        'Session with id session-999 not found'
      )
    })

    it('should throw error if guide not found', async () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      mockSessionRepository.findById.mockResolvedValue(session)
      mockGuideRepository.findById.mockResolvedValue(null)

      await expect(sessionService.moveToStep('session-1', 'step-1', authToken)).rejects.toThrow(
        'Guide with id guide-1 not found'
      )
    })

    it('should throw error if step not found', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      guide.addStep('step-1')
      const session = new Session('session-1', 'guide-1')
      session.start()

      mockSessionRepository.findById.mockResolvedValue(session)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(null)

      await expect(sessionService.moveToStep('session-1', 'step-1', authToken)).rejects.toThrow(
        'Step with id step-1 not found'
      )
    })

    it('should throw error if step does not belong to guide', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const session = new Session('session-1', 'guide-1')
      session.start()
      const step = new Step('step-1', 'guide-2', 1, 'Mix', 180)

      mockSessionRepository.findById.mockResolvedValue(session)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(step)

      await expect(sessionService.moveToStep('session-1', 'step-1', authToken)).rejects.toThrow(
        'Step step-1 does not belong to guide guide-1'
      )
    })

    it('should throw error if step is not in guide steps list', async () => {
      const guide = new Guide('guide-1', 'cooking', 'Cookies')
      const session = new Session('session-1', 'guide-1')
      session.start()
      const step = new Step('step-1', 'guide-1', 1, 'Mix', 180)

      mockSessionRepository.findById.mockResolvedValue(session)
      mockGuideRepository.findById.mockResolvedValue(guide)
      mockStepRepository.findById.mockResolvedValue(step)

      await expect(sessionService.moveToStep('session-1', 'step-1', authToken)).rejects.toThrow(
        'Step step-1 is not part of guide guide-1'
      )
    })
  })

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      await sessionService.deleteSession('session-1', authToken)

      expect(mockSessionRepository.delete).toHaveBeenCalledWith('session-1', authToken)
    })
  })
})
