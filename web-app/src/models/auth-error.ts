/**
 * Custom error for authentication failures
 */
export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
