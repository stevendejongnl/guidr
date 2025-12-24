import { Session, SessionStatus } from '../entities/Session'

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>
  findAll(): Promise<Session[]>
  findByGuideId(guideId: string): Promise<Session[]>
  findByStatus(status: SessionStatus): Promise<Session[]>
  save(session: Session): Promise<void>
  delete(id: string): Promise<void>
}
