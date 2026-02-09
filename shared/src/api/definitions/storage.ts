/**
 * Storage validation types
 * Used for validating data retrieved from local storage
 */

import typia from 'typia'

/**
 * Server configuration
 */
export interface ServerConfig {
  url: string
  lastValidated: string  // ISO timestamp
}

/**
 * Cached entity with metadata
 */
export interface CachedData<T> {
  data: T
  timestamp: string  // ISO timestamp
  ttl: number  // Time to live in milliseconds
}

/**
 * Authentication token storage
 */
export interface StoredAuthToken {
  token: string
  expiresAt: string  // ISO timestamp
  scope: string
}

/**
 * Validators for server config
 */
export const validateServerConfig = typia.createAssert<ServerConfig>()
export const validateStoredAuthToken = typia.createAssert<StoredAuthToken>()

/**
 * Generic cached data validator helper
 * Usage: createCachedDataValidator<GuideDto>(validateGuideDto)
 *
 * Note: This function signature exists for API compatibility and type inference.
 * The actual validation is performed on CachedData<T> which includes the data field.
 */
export function createCachedDataValidator<T>(
  _dataValidator?: (data: unknown) => T
) {
  return typia.createAssert<CachedData<T>>()
}

/**
 * Type guards
 */
export const isServerConfig = typia.createIs<ServerConfig>()
export const isStoredAuthToken = typia.createIs<StoredAuthToken>()
