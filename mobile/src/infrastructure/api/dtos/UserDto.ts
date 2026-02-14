/**
 * API DTO for User entity.
 * Matches the api-server response format (camelCase).
 * Note: passwordHash is never returned by the API for security.
 */
export interface UserDto {
  id: string
  email: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  name?: string | null
  interests?: string[] | null
  preferredLanguages?: string[] | null
  role?: string // 'user' | 'admin'
  isAdmin?: boolean // Deprecated: use role instead
}

/**
 * Request body for user registration.
 */
export interface UserCreateRequest {
  email: string
  password: string // Plain password, will be hashed by server
}

/**
 * Request body for updating an existing user.
 * All fields are optional (PATCH).
 */
export interface UserUpdateRequest {
  email?: string
  password?: string // Plain password, will be hashed by server
}

/**
 * Response from auth endpoints (login/register).
 */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserDto
}
