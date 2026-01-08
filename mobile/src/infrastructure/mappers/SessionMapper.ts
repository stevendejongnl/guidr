import { Session, SessionStatus } from '@domain/entities/Session'
import type { SessionDto, SessionCreateRequest } from '../api/dtos/SessionDto'

/**
 * Mapper for converting between Session domain entity and API DTOs.
 *
 * NOTE: Domain entities set createdAt/updatedAt in constructor.
 * When mapping from API DTO to domain entity, timestamps will be reset to current time.
 * State and timestamps from API will need to be manually applied after construction.
 * This is a known limitation due to entity design.
 */
export class SessionMapper {
  /**
   * Convert API DTO to domain entity.
   *
   * IMPORTANT: This creates a Session in NotStarted state.
   * The actual state from the API DTO is NOT preserved due to entity constructor behavior.
   * Repositories should use the DTO directly for cache storage instead of converting to entity.
   *
   * This method is primarily for creating new sessions from API responses.
   */
  static toDomain(dto: SessionDto): Session {
    const session = new Session(dto.id, dto.guideId)

    // Note: Session constructor sets status=NotStarted, timestamps=now
    // We cannot preserve the API state without violating encapsulation
    // This is acceptable for new sessions, but cached sessions should use DTO format

    return session
  }

  /**
   * Convert domain entity to API DTO format.
   * Used for caching and verification.
   */
  static toDto(session: Session): SessionDto {
    return {
      id: session.id,
      guideId: session.guideId,
      status: session.status as 'NotStarted' | 'InProgress' | 'Paused' | 'Completed' | 'Cancelled',
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      currentStepId: session.currentStepId ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }
  }

  /**
   * Convert to API create request format.
   */
  static toCreateRequest(guideId: string): SessionCreateRequest {
    return {
      guideId,
    }
  }

  /**
   * Convert API DTO status string to domain SessionStatus enum.
   */
  static toSessionStatus(status: string): SessionStatus {
    switch (status) {
      case 'NotStarted':
        return SessionStatus.NotStarted
      case 'InProgress':
        return SessionStatus.InProgress
      case 'Paused':
        return SessionStatus.Paused
      case 'Completed':
        return SessionStatus.Completed
      case 'Cancelled':
        return SessionStatus.Cancelled
      default:
        throw new Error(`Unknown session status: ${status}`)
    }
  }
}
