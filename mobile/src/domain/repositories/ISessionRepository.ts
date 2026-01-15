import { Session, SessionStatus } from '../entities/Session'

export interface ISessionRepository {
  findById(id: string, authToken: string): Promise<Session | null>
  findAll(authToken: string): Promise<Session[]>
  findByGuideId(guideId: string, authToken: string): Promise<Session[]>
  findByStatus(status: SessionStatus, authToken: string): Promise<Session[]>
  save(session: Session, authToken: string): Promise<void>
  delete(id: string, authToken: string): Promise<void>

  // Session state transition actions (call dedicated API endpoints)
  start(id: string, authToken: string): Promise<Session>
  pause(id: string, stepElapsedSeconds: number, authToken: string): Promise<Session>
  resume(id: string, authToken: string): Promise<Session>
  complete(id: string, authToken: string): Promise<Session>
  cancel(id: string, authToken: string): Promise<Session>
  moveToStep(id: string, stepId: string, authToken: string): Promise<Session>
}
