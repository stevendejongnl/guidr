/**
 * Health check result from server validation
 */
export interface HealthCheckResult {
  /**
   * Whether the server is healthy and responding correctly
   */
  healthy: boolean

  /**
   * Response time in milliseconds
   */
  responseTime: number

  /**
   * Error message if validation failed
   */
  error?: string
}

/**
 * Service for validating server health and connectivity
 */
export interface IHealthCheckService {
  /**
   * Validate a server URL by checking its health endpoint
   * @param serverUrl - The server URL to validate (normalized or raw)
   * @returns Promise with health check result
   */
  validateServer(serverUrl: string): Promise<HealthCheckResult>
}
