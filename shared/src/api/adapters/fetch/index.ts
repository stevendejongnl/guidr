/**
 * Validated HTTP Client with Typia validation
 * Automatically validates all API requests and responses
 *
 * Usage:
 * const client = new ValidatedHttpClient({
 *   baseUrl: 'https://api.example.com',
 *   getAuthToken: async () => authToken,
 * })
 *
 * const categories = await client.get(
 *   '/api/categories',
 *   validateCategoryList
 * )
 */

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string
  getAuthToken?: () => Promise<string | null>
  timeout?: number  // in milliseconds
}

/**
 * API Error - thrown when API returns error status
 */
class ApiErrorImpl extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiErrorImpl.prototype)
  }
}

/**
 * Validation Error - thrown when Typia validation fails
 */
class ValidationErrorImpl extends Error {
  constructor(
    public errors: any[],
    message: string
  ) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationErrorImpl.prototype)
  }
}

/**
 * Timeout Error - thrown when request times out
 */
class TimeoutErrorImpl extends Error {
  constructor(path: string, timeout: number) {
    super(`Request to ${path} timed out after ${timeout}ms`)
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutErrorImpl.prototype)
  }
}

// Export as types that can be used in catch blocks
export { ApiErrorImpl as ApiError, ValidationErrorImpl as ValidationError, TimeoutErrorImpl as TimeoutError }

// Also export the types
export type { ApiErrorImpl as ApiErrorType, ValidationErrorImpl as ValidationErrorType, TimeoutErrorImpl as TimeoutErrorType }

/**
 * Validated HTTP Client
 * Uses Typia validators to ensure type safety at runtime
 */
export class ValidatedHttpClient {
  private config: Required<HttpClientConfig>

  constructor(config: HttpClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      getAuthToken: config.getAuthToken ?? (async () => null),
      timeout: config.timeout ?? 30000,
    }
  }

  /**
   * GET request with response validation
   */
  async get<T>(
    path: string,
    validator: (data: unknown) => T
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`
    const token = await this.config.getAuthToken()

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.buildHeaders(token),
    })

    if (!response.ok) {
      const body = await this.parseResponseBody(response)
      throw new ApiErrorImpl(
        response.status,
        response.statusText,
        body,
        `GET ${path} failed with status ${response.status}`
      )
    }

    const data = await response.json()

    try {
      return validator(data)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Response validation failed for GET ${path}`
      )
    }
  }

  /**
   * POST request with request and response validation
   */
  async post<TRequest, TResponse>(
    path: string,
    body: TRequest,
    requestValidator: (data: unknown) => TRequest,
    responseValidator: (data: unknown) => TResponse
  ): Promise<TResponse> {
    // Validate request body
    try {
      requestValidator(body)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Request validation failed for POST ${path}`
      )
    }

    const url = `${this.config.baseUrl}${path}`
    const token = await this.config.getAuthToken()

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const responseBody = await this.parseResponseBody(response)
      throw new ApiErrorImpl(
        response.status,
        response.statusText,
        responseBody,
        `POST ${path} failed with status ${response.status}`
      )
    }

    const data = await response.json()

    try {
      return responseValidator(data)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Response validation failed for POST ${path}`
      )
    }
  }

  /**
   * PUT request with request and response validation
   */
  async put<TRequest, TResponse>(
    path: string,
    body: TRequest,
    requestValidator: (data: unknown) => TRequest,
    responseValidator: (data: unknown) => TResponse
  ): Promise<TResponse> {
    // Validate request body
    try {
      requestValidator(body)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Request validation failed for PUT ${path}`
      )
    }

    const url = `${this.config.baseUrl}${path}`
    const token = await this.config.getAuthToken()

    const response = await this.fetchWithTimeout(url, {
      method: 'PUT',
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const responseBody = await this.parseResponseBody(response)
      throw new ApiErrorImpl(
        response.status,
        response.statusText,
        responseBody,
        `PUT ${path} failed with status ${response.status}`
      )
    }

    const data = await response.json()

    try {
      return responseValidator(data)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Response validation failed for PUT ${path}`
      )
    }
  }

  /**
   * DELETE request with optional response validation
   */
  async delete<T = void>(
    path: string,
    responseValidator?: (data: unknown) => T
  ): Promise<T | void> {
    const url = `${this.config.baseUrl}${path}`
    const token = await this.config.getAuthToken()

    const response = await this.fetchWithTimeout(url, {
      method: 'DELETE',
      headers: this.buildHeaders(token),
    })

    if (!response.ok) {
      const body = await this.parseResponseBody(response)
      throw new ApiErrorImpl(
        response.status,
        response.statusText,
        body,
        `DELETE ${path} failed with status ${response.status}`
      )
    }

    // If no response expected or validator provided, return void
    if (!responseValidator) {
      return
    }

    // Otherwise validate and return response
    const data = await response.json()

    try {
      return responseValidator(data)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Response validation failed for DELETE ${path}`
      )
    }
  }

  /**
   * PATCH request with request and response validation
   */
  async patch<TRequest, TResponse>(
    path: string,
    body: TRequest,
    requestValidator: (data: unknown) => TRequest,
    responseValidator: (data: unknown) => TResponse
  ): Promise<TResponse> {
    // Validate request body
    try {
      requestValidator(body)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Request validation failed for PATCH ${path}`
      )
    }

    const url = `${this.config.baseUrl}${path}`
    const token = await this.config.getAuthToken()

    const response = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      headers: this.buildHeaders(token),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const responseBody = await this.parseResponseBody(response)
      throw new ApiErrorImpl(
        response.status,
        response.statusText,
        responseBody,
        `PATCH ${path} failed with status ${response.status}`
      )
    }

    const data = await response.json()

    try {
      return responseValidator(data)
    } catch (error) {
      throw new ValidationErrorImpl(
        [error],
        `Response validation failed for PATCH ${path}`
      )
    }
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /**
   * Build request headers
   */
  private buildHeaders(token: string | null): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutErrorImpl(url, this.config.timeout)
      }

      throw error
    }
  }

  /**
   * Parse response body safely
   */
  private async parseResponseBody(response: Response): Promise<any> {
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : null
    } catch {
      return null
    }
  }
}
