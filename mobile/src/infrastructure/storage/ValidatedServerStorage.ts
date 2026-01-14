import { ServerConfigStorage } from './ServerConfigStorage'
import { IHealthCheckService, HealthCheckResult } from '../../domain/services/IHealthCheckService'

/**
 * Wrapper around ServerConfigStorage that validates server URLs before saving
 * Ensures that all saved URLs are verified to be healthy and responding
 */
export class ValidatedServerStorage {
  constructor(
    private readonly storage: ServerConfigStorage,
    private readonly healthCheckService: IHealthCheckService
  ) {}

  /**
   * Validate and save a server URL
   * The URL is checked via health endpoint before being saved
   * @param url - The server URL to validate and save
   * @returns Health check result (contains healthy flag and error details if failed)
   */
  async setServerUrlWithValidation(url: string): Promise<HealthCheckResult> {
    // Validate server health first
    const validationResult = await this.healthCheckService.validateServer(url)

    // If validation succeeded, save the URL (storage will normalize it)
    if (validationResult.healthy) {
      try {
        await this.storage.setServerUrl(url)
      } catch {
        // If save fails, still return the validation result
        // The user knows the server is healthy but storage might have issues
      }
    }

    return validationResult
  }

  /**
   * Get the stored server URL
   * Delegates to underlying storage
   */
  async getServerUrl(): Promise<string | null> {
    return this.storage.getServerUrl()
  }

  /**
   * Check if a server URL is stored
   * Delegates to underlying storage
   */
  async hasServerUrl(): Promise<boolean> {
    return this.storage.hasServerUrl()
  }

  /**
   * Clear the stored server URL
   * Delegates to underlying storage
   */
  async clearServerUrl(): Promise<void> {
    return this.storage.clearServerUrl()
  }

  /**
   * Initialize default server URL if none is stored
   * Delegates to underlying storage
   */
  async initializeDefaultServerUrl(): Promise<void> {
    return this.storage.initializeDefaultServerUrl()
  }

  /**
   * Get the default server URL from config
   * Delegates to underlying storage
   */
  async getDefaultServerUrl(): Promise<string> {
    return this.storage.getDefaultServerUrl()
  }
}
