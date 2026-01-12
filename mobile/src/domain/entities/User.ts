export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export class User {
  readonly id: string
  private _email: string
  private _passwordHash: string
  readonly createdAt: Date
  private _updatedAt: Date
  private _role: Role

  constructor(id: string, email: string, passwordHash: string, role: Role = Role.USER) {
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
    this._role = role
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

  get role(): Role {
    return this._role
  }

  get isAdmin(): boolean {
    return this._role === Role.ADMIN
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
