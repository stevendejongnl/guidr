import { HealthCheckResult, IHealthCheckService } from './IHealthCheckService'

/**
 * Service for validating server health and connectivity
 * Checks server availability via the /api/v1/health endpoint
 */
export class HealthCheckService implements IHealthCheckService {
  private readonly timeout: number = 10000 // 10 seconds

  /**
   * Validate a server URL by checking its health endpoint
   * @param serverUrl - The server URL to validate (will be normalized)
   * @returns Promise with health check result
   */
  async validateServer(serverUrl: string): Promise<HealthCheckResult> {
    try {
      // Normalize URL: strip /api/v1 suffix and trailing slashes
      const normalizedUrl = this.normalizeUrl(serverUrl)

      // Construct health endpoint
      const healthUrl = `${normalizedUrl}/api/v1/health`

      // Measure response time
      const startTime = Date.now()

      // Make request with timeout using AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      try {
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        // Check HTTP response status
        if (!response.ok) {
          return {
            healthy: false,
            responseTime,
            error: `Server returned HTTP ${response.status}`,
          }
        }

        // Parse response JSON
        let data: unknown
        try {
          data = await response.json()
        } catch {
          return {
            healthy: false,
            responseTime,
            error: 'Invalid JSON response from server',
          }
        }

        // Validate health status
        if (
          typeof data === 'object' &&
          data !== null &&
          'status' in data &&
          (data as any).status === 'healthy'
        ) {
          return {
            healthy: true,
            responseTime,
          }
        }

        return {
          healthy: false,
          responseTime,
          error: 'Invalid health status',
        }
      } catch (error) {
        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        if (error instanceof Error) {
          // Check if it's an abort error (timeout)
          if (error.name === 'AbortError') {
            return {
              healthy: false,
              responseTime,
              error: 'Request timeout',
            }
          }

          return {
            healthy: false,
            responseTime,
            error: error.message,
          }
        }

        return {
          healthy: false,
          responseTime,
          error: 'Unknown error occurred',
        }
      }
    } catch (error) {
      return {
        healthy: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Normalize server URL by removing /api/v1 suffix and trailing slashes
   * @param url - The URL to normalize
   * @returns Normalized URL
   */
  private normalizeUrl(url: string): string {
    // Strip /api/v1 or /api/v1/ suffix (only if at the end)
    let normalized = url.replace(/\/api\/v1\/?$/, '')

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '')

    return normalized
  }
}
