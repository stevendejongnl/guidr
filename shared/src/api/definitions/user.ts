/**
 * User API type definitions and validators
 */

import typia from 'typia'

/**
 * User role type
 */
export type UserRole = 'admin' | 'user'

/**
 * User DTO (API response)
 */
export interface UserDto {
  id: string
  email: string
  name: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Current user info (includes auth token info)
 */
export interface CurrentUserDto extends UserDto {
  isAdmin: boolean
}

/**
 * User create request (admin only)
 */
export interface UserCreateRequest {
  email: string
  name: string | null
  role: UserRole
}

/**
 * User update request (partial)
 */
export interface UserUpdateRequest {
  name?: string | null
  role?: UserRole
  isActive?: boolean
}

/**
 * Typia validators
 */
export const validateUserDto = typia.createAssert<UserDto>()
export const validateCurrentUserDto = typia.createAssert<CurrentUserDto>()
export const validateUserList = typia.createAssert<UserDto[]>()
export const validateUserCreateRequest = typia.createAssert<UserCreateRequest>()
export const validateUserUpdateRequest = typia.createAssert<UserUpdateRequest>()

/**
 * Type guards
 */
export const isUserDto = typia.createIs<UserDto>()
export const isCurrentUserDto = typia.createIs<CurrentUserDto>()
