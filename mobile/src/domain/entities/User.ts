export class User {
  readonly id: string
  private _email: string
  private _passwordHash: string
  readonly createdAt: Date
  private _updatedAt: Date
  private _isAdmin: boolean

  constructor(id: string, email: string, passwordHash: string, isAdmin: boolean = false) {
    if (!id || id.trim() === '') {
      throw new Error('User id cannot be empty')
    }
    if (!email || email.trim() === '') {
      throw new Error('User email cannot be empty')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('User email must be a valid email address')
    }
    if (!passwordHash || passwordHash.trim() === '') {
      throw new Error('User password cannot be empty')
    }

    this.id = id
    this._email = email.toLowerCase()
    this._passwordHash = passwordHash
    this._isAdmin = isAdmin
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get email(): string {
    return this._email
  }

  get passwordHash(): string {
    return this._passwordHash
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get isAdmin(): boolean {
    return this._isAdmin
  }

  updateEmail(newEmail: string): void {
    if (!newEmail || newEmail.trim() === '') {
      throw new Error('User email cannot be empty')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      throw new Error('User email must be a valid email address')
    }
    this._email = newEmail.toLowerCase()
    this._updatedAt = new Date()
  }

  updatePassword(newPasswordHash: string): void {
    if (!newPasswordHash || newPasswordHash.trim() === '') {
      throw new Error('User password cannot be empty')
    }
    this._passwordHash = newPasswordHash
    this._updatedAt = new Date()
  }
}
