import uuid from 'react-native-uuid'
import { Session, SessionStatus } from '../entities/Session'
import { ISessionRepository } from '../repositories/ISessionRepository'
import { IGuideRepository } from '../repositories/IGuideRepository'
import { IStepRepository } from '../repositories/IStepRepository'

export class SessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly guideRepository: IGuideRepository,
    private readonly stepRepository: IStepRepository
  ) {}

  async createSession(guideId: string, authToken: string): Promise<Session> {
    const guide = await this.guideRepository.findById(guideId, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }

    const id = uuid.v4() as string
    const session = new Session(id, guideId)
    await this.sessionRepository.save(session, authToken)
    return session
  }

  async getSessionById(id: string, authToken: string): Promise<Session | null> {
    return await this.sessionRepository.findById(id, authToken)
  }

  async getAllSessions(authToken: string): Promise<Session[]> {
    return await this.sessionRepository.findAll(authToken)
  }

  async getSessionsByGuideId(guideId: string, authToken: string): Promise<Session[]> {
    return await this.sessionRepository.findByGuideId(guideId, authToken)
  }

  async getSessionsByStatus(status: SessionStatus, authToken: string): Promise<Session[]> {
    return await this.sessionRepository.findByStatus(status, authToken)
  }

  async startSession(id: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(id, authToken)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.start()
    await this.sessionRepository.save(session, authToken)
  }

  async pauseSession(id: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(id, authToken)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.pause()
    await this.sessionRepository.save(session, authToken)
  }

  async resumeSession(id: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(id, authToken)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.resume()
    await this.sessionRepository.save(session, authToken)
  }

  async completeSession(id: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(id, authToken)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.complete()
    await this.sessionRepository.save(session, authToken)
  }

  async cancelSession(id: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(id, authToken)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.cancel()
    await this.sessionRepository.save(session, authToken)
  }

  async moveToStep(sessionId: string, stepId: string, authToken: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId, authToken)
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`)
    }

    const guide = await this.guideRepository.findById(session.guideId, authToken)
    if (!guide) {
      throw new Error(`Guide with id ${session.guideId} not found`)
    }

    const step = await this.stepRepository.findById(stepId, authToken)
    if (!step) {
      throw new Error(`Step with id ${stepId} not found`)
    }

    if (step.guideId !== guide.id) {
      throw new Error(`Step ${stepId} does not belong to guide ${guide.id}`)
    }

    if (!guide.stepIds.includes(stepId)) {
      throw new Error(`Step ${stepId} is not part of guide ${guide.id}`)
    }

    session.moveToStep(stepId)
    await this.sessionRepository.save(session, authToken)
  }

  async deleteSession(id: string, authToken: string): Promise<void> {
    await this.sessionRepository.delete(id, authToken)
  }
}
