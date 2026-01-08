import { UserService } from './UserService'
import { User } from '../entities/User'
import { IUserRepository } from '../repositories/IUserRepository'

describe('UserService', () => {
  let userService: UserService
  let mockRepository: jest.Mocked<IUserRepository>
  const authToken = 'mock-auth-token'

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    }
    userService = new UserService(mockRepository)
  })

  describe('registerUser', () => {
    it('should create a new user with generated ID and save to repository', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      const user = await userService.registerUser('test@example.com', 'password123', authToken)

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.passwordHash).toBe('password123')
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com', authToken)
      expect(mockRepository.save).toHaveBeenCalledWith(user, authToken)
    })

    it('should normalize email to lowercase before duplicate check', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      await userService.registerUser('Test@Example.COM', 'password123', authToken)

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com', authToken)
    })

    it('should throw error if email already exists', async () => {
      const existingUser = new User('existing-id', 'test@example.com', 'password123')
      mockRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(
        userService.registerUser('test@example.com', 'password123', authToken)
      ).rejects.toThrow('Email already registered')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error if email already exists with different case', async () => {
      const existingUser = new User('existing-id', 'test@example.com', 'password123')
      mockRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(
        userService.registerUser('Test@Example.COM', 'password123', authToken)
      ).rejects.toThrow('Email already registered')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error if email is invalid (delegated to User entity)', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      await expect(
        userService.registerUser('notanemail', 'password123', authToken)
      ).rejects.toThrow('User email must be a valid email address')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error if password is empty (delegated to User entity)', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      await expect(
        userService.registerUser('test@example.com', '', authToken)
      ).rejects.toThrow('User password cannot be empty')

      expect(mockRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const user = new User('user-123', 'test@example.com', 'password123')
      mockRepository.findById.mockResolvedValue(user)

      const result = await userService.getUserById('user-123', authToken)

      expect(result).toBe(user)
      expect(mockRepository.findById).toHaveBeenCalledWith('user-123', authToken)
    })

    it('should return null if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await userService.getUserById('nonexistent-id', authToken)

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent-id', authToken)
    })
  })

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      const user = new User('user-123', 'test@example.com', 'password123')
      mockRepository.findByEmail.mockResolvedValue(user)

      const result = await userService.getUserByEmail('test@example.com', authToken)

      expect(result).toBe(user)
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com', authToken)
    })

    it('should normalize email to lowercase before search', async () => {
      const user = new User('user-123', 'test@example.com', 'password123')
      mockRepository.findByEmail.mockResolvedValue(user)

      await userService.getUserByEmail('Test@Example.COM', authToken)

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com', authToken)
    })

    it('should return null if user not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null)

      const result = await userService.getUserByEmail('nonexistent@example.com', authToken)

      expect(result).toBeNull()
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com', authToken)
    })
  })

  describe('getAllUsers', () => {
    it('should return all users from repository', async () => {
      const users = [
        new User('user-1', 'test1@example.com', 'password123'),
        new User('user-2', 'test2@example.com', 'password456'),
      ]
      mockRepository.findAll.mockResolvedValue(users)

      const result = await userService.getAllUsers(authToken)

      expect(result).toBe(users)
      expect(mockRepository.findAll).toHaveBeenCalledWith(authToken)
    })

    it('should return empty array if no users exist', async () => {
      mockRepository.findAll.mockResolvedValue([])

      const result = await userService.getAllUsers(authToken)

      expect(result).toEqual([])
      expect(mockRepository.findAll).toHaveBeenCalledWith(authToken)
    })
  })

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      await userService.deleteUser('user-123', authToken)

      expect(mockRepository.delete).toHaveBeenCalledWith('user-123', authToken)
    })
  })
})
