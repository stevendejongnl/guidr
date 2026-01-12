/**
 * User DTO matching API response format
 */
export interface UserDto {
  id: string
  email: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  name?: string | null
  interests?: string[] | null
  isAdmin?: boolean
}

/**
 * Auth response from login/register endpoints
 */
export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: UserDto
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string
  password: string
}
