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

  async createSession(guideId: string): Promise<Session> {
    const guide = await this.guideRepository.findById(guideId)
    if (!guide) {
      throw new Error(`Guide with id ${guideId} not found`)
    }

    const id = uuid.v4() as string
    const session = new Session(id, guideId)
    await this.sessionRepository.save(session)
    return session
  }

  async getSessionById(id: string): Promise<Session | null> {
    return await this.sessionRepository.findById(id)
  }

  async getAllSessions(): Promise<Session[]> {
    return await this.sessionRepository.findAll()
  }

  async getSessionsByGuideId(guideId: string): Promise<Session[]> {
    return await this.sessionRepository.findByGuideId(guideId)
  }

  async getSessionsByStatus(status: SessionStatus): Promise<Session[]> {
    return await this.sessionRepository.findByStatus(status)
  }

  async startSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.start()
    await this.sessionRepository.save(session)
  }

  async pauseSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.pause()
    await this.sessionRepository.save(session)
  }

  async resumeSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.resume()
    await this.sessionRepository.save(session)
  }

  async completeSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.complete()
    await this.sessionRepository.save(session)
  }

  async cancelSession(id: string): Promise<void> {
    const session = await this.sessionRepository.findById(id)
    if (!session) {
      throw new Error(`Session with id ${id} not found`)
    }
    session.cancel()
    await this.sessionRepository.save(session)
  }

  async moveToStep(sessionId: string, stepId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId)
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`)
    }

    const guide = await this.guideRepository.findById(session.guideId)
    if (!guide) {
      throw new Error(`Guide with id ${session.guideId} not found`)
    }

    const step = await this.stepRepository.findById(stepId)
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
    await this.sessionRepository.save(session)
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionRepository.delete(id)
  }
}
