import { UserMapper } from './UserMapper'
import { User, Role } from '@domain/entities/User'
import type { UserDto } from '../api/dtos/UserDto'

function makeUserDto(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 'user-1',
    email: 'test@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('maps id and email from DTO', () => {
      const dto = makeUserDto({ id: 'user-abc', email: 'user@example.com' })

      const user = UserMapper.toDomain(dto)

      expect(user.id).toBe('user-abc')
      expect(user.email).toBe('user@example.com')
    })

    it('uses a placeholder passwordHash', () => {
      const user = UserMapper.toDomain(makeUserDto())

      expect(user.passwordHash).toBe('[NOT_AVAILABLE_FROM_API]')
    })

    it('defaults role to USER when neither role nor isAdmin is provided', () => {
      const dto = makeUserDto()

      const user = UserMapper.toDomain(dto)

      expect(user.role).toBe(Role.USER)
      expect(user.isAdmin).toBe(false)
    })

    it('sets role to ADMIN when role field is "admin"', () => {
      // line 31: dto.role === 'admin'
      const dto = makeUserDto({ role: 'admin' })

      const user = UserMapper.toDomain(dto)

      expect(user.role).toBe(Role.ADMIN)
      expect(user.isAdmin).toBe(true)
    })

    it('sets role to ADMIN when role field matches Role.ADMIN enum value', () => {
      // line 31: dto.role === Role.ADMIN (same as 'admin', included for clarity)
      const dto = makeUserDto({ role: Role.ADMIN })

      const user = UserMapper.toDomain(dto)

      expect(user.role).toBe(Role.ADMIN)
    })

    it('sets role to ADMIN via isAdmin=true for backward compatibility', () => {
      // line 33-35: else if (dto.isAdmin === true) — backward compat path
      const dto = makeUserDto({ isAdmin: true })

      const user = UserMapper.toDomain(dto)

      expect(user.role).toBe(Role.ADMIN)
      expect(user.isAdmin).toBe(true)
    })

    it('keeps role as USER when isAdmin=false', () => {
      const dto = makeUserDto({ isAdmin: false })

      const user = UserMapper.toDomain(dto)

      expect(user.role).toBe(Role.USER)
    })

    it('role field takes precedence over isAdmin for admin detection', () => {
      // role = 'user' but isAdmin = true: role wins since the if-else checks role first
      const dto = makeUserDto({ role: 'user', isAdmin: true })

      const user = UserMapper.toDomain(dto)

      // role is 'user', so the first branch (role === 'admin') fails
      // isAdmin=true triggers the else-if branch — result is ADMIN
      expect(user.role).toBe(Role.ADMIN)
    })

    it('returns a User instance', () => {
      const user = UserMapper.toDomain(makeUserDto())
      expect(user).toBeInstanceOf(User)
    })
  })

  describe('toDto', () => {
    it('maps id, email, role, and isAdmin from User entity', () => {
      const user = new User('user-1', 'admin@example.com', 'hash', Role.ADMIN)

      const dto = UserMapper.toDto(user)

      expect(dto.id).toBe('user-1')
      expect(dto.email).toBe('admin@example.com')
      expect(dto.role).toBe(Role.ADMIN)
      expect(dto.isAdmin).toBe(true)
    })

    it('maps createdAt and updatedAt as ISO strings', () => {
      const user = new User('user-1', 'test@example.com', 'hash')

      const dto = UserMapper.toDto(user)

      expect(typeof dto.createdAt).toBe('string')
      expect(typeof dto.updatedAt).toBe('string')
      expect(() => new Date(dto.createdAt)).not.toThrow()
      expect(() => new Date(dto.updatedAt)).not.toThrow()
    })

    it('sets isAdmin to false for regular users', () => {
      const user = new User('user-1', 'user@example.com', 'hash', Role.USER)

      const dto = UserMapper.toDto(user)

      expect(dto.isAdmin).toBe(false)
      expect(dto.role).toBe(Role.USER)
    })
  })

  describe('toCreateRequest', () => {
    it('includes email and plain password', () => {
      const request = UserMapper.toCreateRequest('new@example.com', 'plainpassword')

      expect(request.email).toBe('new@example.com')
      expect(request.password).toBe('plainpassword')
    })
  })

  describe('toUpdateRequest', () => {
    it('returns empty object when no fields provided', () => {
      // line 83: return request (with neither field set)
      const request = UserMapper.toUpdateRequest()

      expect(request).toEqual({})
    })

    it('includes email when provided', () => {
      const request = UserMapper.toUpdateRequest('updated@example.com')

      expect(request.email).toBe('updated@example.com')
      expect(request.password).toBeUndefined()
    })

    it('includes password when provided', () => {
      const request = UserMapper.toUpdateRequest(undefined, 'newpassword')

      expect(request.password).toBe('newpassword')
      expect(request.email).toBeUndefined()
    })

    it('includes both email and password when both provided', () => {
      const request = UserMapper.toUpdateRequest('new@example.com', 'newpassword')

      expect(request.email).toBe('new@example.com')
      expect(request.password).toBe('newpassword')
    })
  })
})
