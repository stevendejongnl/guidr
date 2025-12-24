import { Session, SessionStatus } from './Session'

describe('Session', () => {
  describe('creation', () => {
    it('should create a session with NotStarted status', () => {
      const session = new Session('session-1', 'guide-1')

      expect(session.id).toBe('session-1')
      expect(session.guideId).toBe('guide-1')
      expect(session.status).toBe(SessionStatus.NotStarted)
      expect(session.startedAt).toBeUndefined()
      expect(session.completedAt).toBeUndefined()
      expect(session.currentStepId).toBeUndefined()
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.updatedAt).toBeInstanceOf(Date)
    })

    it('should throw error if id is empty', () => {
      expect(() => new Session('', 'guide-1')).toThrow('Session id cannot be empty')
    })

    it('should throw error if guideId is empty', () => {
      expect(() => new Session('session-1', '')).toThrow('Guide id cannot be empty')
    })
  })

  describe('start', () => {
    it('should start a session from NotStarted status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()

      expect(session.status).toBe(SessionStatus.InProgress)
      expect(session.startedAt).toBeInstanceOf(Date)
    })

    it('should throw error if already started', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()

      expect(() => session.start()).toThrow('Session has already been started')
    })

    it('should throw error if completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(() => session.start()).toThrow('Session has already been started')
    })

    it('should throw error if cancelled', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(() => session.start()).toThrow('Session has already been started')
    })
  })

  describe('pause', () => {
    it('should pause a session from InProgress status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()

      expect(session.status).toBe(SessionStatus.Paused)
    })

    it('should throw error if not in progress', () => {
      const session = new Session('session-1', 'guide-1')

      expect(() => session.pause()).toThrow('Cannot pause session that is not in progress')
    })

    it('should throw error if already paused', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()

      expect(() => session.pause()).toThrow('Cannot pause session that is not in progress')
    })
  })

  describe('resume', () => {
    it('should resume a session from Paused status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()
      session.resume()

      expect(session.status).toBe(SessionStatus.InProgress)
    })

    it('should throw error if not paused', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()

      expect(() => session.resume()).toThrow('Cannot resume session that is not paused')
    })

    it('should throw error if not started', () => {
      const session = new Session('session-1', 'guide-1')

      expect(() => session.resume()).toThrow('Cannot resume session that is not paused')
    })
  })

  describe('complete', () => {
    it('should complete a session from InProgress status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(session.status).toBe(SessionStatus.Completed)
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    it('should complete a session from Paused status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()
      session.complete()

      expect(session.status).toBe(SessionStatus.Completed)
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    it('should throw error if not started', () => {
      const session = new Session('session-1', 'guide-1')

      expect(() => session.complete()).toThrow('Cannot complete session that has not been started')
    })

    it('should throw error if already completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(() => session.complete()).toThrow('Cannot complete session that has not been started')
    })

    it('should throw error if cancelled', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(() => session.complete()).toThrow('Cannot complete session that has not been started')
    })
  })

  describe('cancel', () => {
    it('should cancel a session from InProgress status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(session.status).toBe(SessionStatus.Cancelled)
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    it('should cancel a session from Paused status', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()
      session.cancel()

      expect(session.status).toBe(SessionStatus.Cancelled)
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    it('should throw error if not started', () => {
      const session = new Session('session-1', 'guide-1')

      expect(() => session.cancel()).toThrow('Cannot cancel session that has not been started')
    })

    it('should throw error if already completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(() => session.cancel()).toThrow('Cannot cancel session that has not been started')
    })

    it('should throw error if already cancelled', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(() => session.cancel()).toThrow('Cannot cancel session that has not been started')
    })
  })

  describe('moveToStep', () => {
    it('should set current step when in progress', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.moveToStep('step-1')

      expect(session.currentStepId).toBe('step-1')
    })

    it('should update current step to another step', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.moveToStep('step-1')
      session.moveToStep('step-2')

      expect(session.currentStepId).toBe('step-2')
    })

    it('should throw error if session is not in progress or paused', () => {
      const session = new Session('session-1', 'guide-1')

      expect(() => session.moveToStep('step-1')).toThrow(
        'Cannot move to step when session is not active'
      )
    })

    it('should allow moving to step when paused', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()
      session.moveToStep('step-1')

      expect(session.currentStepId).toBe('step-1')
    })

    it('should throw error if session is completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(() => session.moveToStep('step-1')).toThrow(
        'Cannot move to step when session is not active'
      )
    })

    it('should throw error if session is cancelled', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(() => session.moveToStep('step-1')).toThrow(
        'Cannot move to step when session is not active'
      )
    })
  })

  describe('isActive', () => {
    it('should return true when InProgress', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()

      expect(session.isActive()).toBe(true)
    })

    it('should return true when Paused', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.pause()

      expect(session.isActive()).toBe(true)
    })

    it('should return false when NotStarted', () => {
      const session = new Session('session-1', 'guide-1')

      expect(session.isActive()).toBe(false)
    })

    it('should return false when Completed', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.complete()

      expect(session.isActive()).toBe(false)
    })

    it('should return false when Cancelled', () => {
      const session = new Session('session-1', 'guide-1')
      session.start()
      session.cancel()

      expect(session.isActive()).toBe(false)
    })
  })
})
