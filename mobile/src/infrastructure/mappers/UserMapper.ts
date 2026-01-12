import { User, Role } from '@domain/entities/User'
import type { UserDto, UserCreateRequest, UserUpdateRequest } from '../api/dtos/UserDto'

/**
 * Mapper for converting between User domain entity and API DTOs.
 *
 * SECURITY NOTE: The API never returns passwordHash for security.
 * When mapping from API DTO to domain entity, we use a placeholder passwordHash.
 * This means reconstructed User entities from API cannot be used for authentication.
 *
 * NOTE: Domain entities set createdAt/updatedAt in constructor.
 * When mapping from API DTO to domain entity, timestamps will be reset to current time.
 * This is a known limitation - functional behavior is unaffected.
 */
export class UserMapper {
  /**
   * Convert API DTO to domain entity.
   *
   * IMPORTANT: API does not return passwordHash for security.
   * Uses placeholder passwordHash - reconstructed entity cannot authenticate.
   * Use this only for display/read purposes, not for authentication logic.
   *
   * Backward compatibility: If role is not present, derives from isAdmin field.
   */
  static toDomain(dto: UserDto): User {
    // Use a marker to indicate password hash is not available
    const placeholderPasswordHash = '[NOT_AVAILABLE_FROM_API]'

    // Determine role: prefer role field, fall back to isAdmin
    let role = Role.USER
    if (dto.role === 'admin' || dto.role === Role.ADMIN) {
      role = Role.ADMIN
    } else if (dto.isAdmin === true) {
      // Backward compatibility: derive from isAdmin if role not present
      role = Role.ADMIN
    }

    return new User(dto.id, dto.email, placeholderPasswordHash, role)
  }

  /**
   * Convert domain entity to API DTO format.
   * Used for caching and verification.
   * Note: passwordHash is intentionally excluded (never sent to/from API).
   */
  static toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      role: user.role,
      isAdmin: user.isAdmin,
    }
  }

  /**
   * Convert to API create request format (registration).
   * @param email User email address
   * @param password Plain text password (will be hashed by server)
   */
  static toCreateRequest(email: string, password: string): UserCreateRequest {
    return {
      email,
      password, // Plain password, server will hash it
    }
  }

  /**
   * Convert user to API update request format.
   * Only includes mutable fields.
   * @param email Optional new email
   * @param password Optional new plain text password (will be hashed by server)
   */
  static toUpdateRequest(email?: string, password?: string): UserUpdateRequest {
    const request: UserUpdateRequest = {}

    if (email !== undefined) {
      request.email = email
    }

    if (password !== undefined) {
      request.password = password
    }

    return request
  }
}
