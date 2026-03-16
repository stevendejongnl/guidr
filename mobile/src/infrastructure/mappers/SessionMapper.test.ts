import { SessionMapper } from './SessionMapper'
import { Session, SessionStatus } from '@domain/entities/Session'
import type { SessionDto } from '../api/dtos/SessionDto'

function makeSessionDto(overrides: Partial<SessionDto> = {}): SessionDto {
  return {
    id: 'session-1',
    guideId: 'guide-1',
    status: 'NotStarted',
    startedAt: null,
    completedAt: null,
    currentStepId: null,
    stepElapsedSeconds: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('SessionMapper', () => {
  describe('toDomain', () => {
    it('creates a Session with correct id and guideId', () => {
      const dto = makeSessionDto({ id: 'session-abc', guideId: 'guide-xyz' })

      const session = SessionMapper.toDomain(dto)

      expect(session.id).toBe('session-abc')
      expect(session.guideId).toBe('guide-xyz')
    })

    it('creates Session in NotStarted state (constructor default)', () => {
      const dto = makeSessionDto({ status: 'InProgress' })

      const session = SessionMapper.toDomain(dto)

      // Entity constructor always sets NotStarted; API status is not preserved by design
      expect(session.status).toBe(SessionStatus.NotStarted)
    })

    it('sets stepElapsedSeconds when greater than zero', () => {
      const dto = makeSessionDto({ stepElapsedSeconds: 42 })

      const session = SessionMapper.toDomain(dto)

      expect(session.stepElapsedSeconds).toBe(42)
    })

    it('leaves stepElapsedSeconds at zero when DTO value is zero', () => {
      const dto = makeSessionDto({ stepElapsedSeconds: 0 })

      const session = SessionMapper.toDomain(dto)

      expect(session.stepElapsedSeconds).toBe(0)
    })

    it('returns a Session instance', () => {
      const dto = makeSessionDto()

      const session = SessionMapper.toDomain(dto)

      expect(session).toBeInstanceOf(Session)
    })
  })

  describe('toDto', () => {
    it('maps id, guideId, and status', () => {
      const session = new Session('session-1', 'guide-1')

      const dto = SessionMapper.toDto(session)

      expect(dto.id).toBe('session-1')
      expect(dto.guideId).toBe('guide-1')
      expect(dto.status).toBe(SessionStatus.NotStarted)
    })

    it('sets startedAt to null when session has not started', () => {
      const session = new Session('session-1', 'guide-1')

      const dto = SessionMapper.toDto(session)

      // line 46: startedAt: session.startedAt?.toISOString() ?? null
      expect(dto.startedAt).toBeNull()
    })

    it('sets completedAt to null when session is not completed', () => {
      const session = new Session('session-1', 'guide-1')

      const dto = SessionMapper.toDto(session)

      // line 47: completedAt: session.completedAt?.toISOString() ?? null
      expect(dto.completedAt).toBeNull()
    })

    it('sets startedAt as ISO string once session has started', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()

      const dto = SessionMapper.toDto(session)

      expect(dto.startedAt).not.toBeNull()
      expect(typeof dto.startedAt).toBe('string')
      // Validate ISO format
      expect(() => new Date(dto.startedAt as string)).not.toThrow()
    })

    it('sets completedAt as ISO string once session is completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      const dto = SessionMapper.toDto(session)

      expect(dto.completedAt).not.toBeNull()
      expect(typeof dto.completedAt).toBe('string')
    })

    it('sets currentStepId to null when no step is current', () => {
      const session = new Session('session-1', 'guide-1')

      const dto = SessionMapper.toDto(session)

      // line 48: currentStepId: session.currentStepId ?? null
      expect(dto.currentStepId).toBeNull()
    })

    it('sets currentStepId when a step is assigned', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.moveToStep('step-abc')

      const dto = SessionMapper.toDto(session)

      expect(dto.currentStepId).toBe('step-abc')
    })

    it('maps stepElapsedSeconds', () => {
      const session = new Session('session-1', 'guide-1')
      session.setStepElapsedSeconds(15)

      const dto = SessionMapper.toDto(session)

      expect(dto.stepElapsedSeconds).toBe(15)
    })

    it('maps createdAt and updatedAt as ISO strings', () => {
      const session = new Session('session-1', 'guide-1')

      const dto = SessionMapper.toDto(session)

      expect(typeof dto.createdAt).toBe('string')
      expect(typeof dto.updatedAt).toBe('string')
      expect(() => new Date(dto.createdAt)).not.toThrow()
      expect(() => new Date(dto.updatedAt)).not.toThrow()
    })
  })

  describe('toCreateRequest', () => {
    it('returns a SessionCreateRequest with the given guideId', () => {
      const request = SessionMapper.toCreateRequest('guide-1')

      expect(request.guideId).toBe('guide-1')
    })
  })

  describe('toSessionStatus', () => {
    it('maps "NotStarted" to SessionStatus.NotStarted', () => {
      expect(SessionMapper.toSessionStatus('NotStarted')).toBe(SessionStatus.NotStarted)
    })

    it('maps "InProgress" to SessionStatus.InProgress', () => {
      expect(SessionMapper.toSessionStatus('InProgress')).toBe(SessionStatus.InProgress)
    })

    it('maps "Paused" to SessionStatus.Paused', () => {
      expect(SessionMapper.toSessionStatus('Paused')).toBe(SessionStatus.Paused)
    })

    it('maps "Completed" to SessionStatus.Completed', () => {
      expect(SessionMapper.toSessionStatus('Completed')).toBe(SessionStatus.Completed)
    })

    it('maps "Cancelled" to SessionStatus.Cancelled', () => {
      // line 78 — the Cancelled case
      expect(SessionMapper.toSessionStatus('Cancelled')).toBe(SessionStatus.Cancelled)
    })

    it('throws for an unknown status string', () => {
      // lines 79-80 — the default case
      expect(() => SessionMapper.toSessionStatus('Unknown')).toThrow('Unknown session status: Unknown')
    })
  })
})
