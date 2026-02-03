/**
 * User API type definitions and validators
 * Matches actual API contract from api-server/src/presentation/api/models/user_models.py
 */

import typia from 'typia'

/**
 * User DTO (API response)
 * Matches UserResponse from API server
 */
export interface UserDto {
  id: string
  email: string
  createdAt: string
  updatedAt: string
  name?: string | null
  interests?: string[] | null
  isAdmin: boolean
}

/**
 * Authentication response from login/register endpoints
 */
export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: UserDto
}

/**
 * User create request (admin only)
 */
export interface UserCreateRequest {
  email: string
  name?: string | null
}

/**
 * User update request (partial)
 */
export interface UserUpdateRequest {
  name?: string | null
  interests?: string[] | null
}

/**
 * Typia validators
 */
export const validateUserDto = typia.createAssert<UserDto>()
export const validateAuthResponse = typia.createAssert<AuthResponse>()
export const validateUserList = typia.createAssert<UserDto[]>()
export const validateUserCreateRequest = typia.createAssert<UserCreateRequest>()
export const validateUserUpdateRequest = typia.createAssert<UserUpdateRequest>()

/**
 * Type guards
 */
export const isUserDto = typia.createIs<UserDto>()
export const isAuthResponse = typia.createIs<AuthResponse>()
