import { User } from './User'

describe('User', () => {
  describe('constructor', () => {
    it('should create a user with valid parameters', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.passwordHash).toBe('password123')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should normalize email to lowercase', () => {
      const user = new User('user-123', 'Test@Example.COM', 'password123')

      expect(user.email).toBe('test@example.com')
    })

    it('should throw error if id is empty', () => {
      expect(() => {
        new User('', 'test@example.com', 'password123')
      }).toThrow('User id cannot be empty')
    })

    it('should throw error if id is whitespace', () => {
      expect(() => {
        new User('   ', 'test@example.com', 'password123')
      }).toThrow('User id cannot be empty')
    })

    it('should throw error if email is empty', () => {
      expect(() => {
        new User('user-123', '', 'password123')
      }).toThrow('User email cannot be empty')
    })

    it('should throw error if email is whitespace', () => {
      expect(() => {
        new User('user-123', '   ', 'password123')
      }).toThrow('User email cannot be empty')
    })

    it('should throw error if email format is invalid', () => {
      expect(() => {
        new User('user-123', 'notanemail', 'password123')
      }).toThrow('User email must be a valid email address')
    })

    it('should throw error if email is missing @', () => {
      expect(() => {
        new User('user-123', 'test.example.com', 'password123')
      }).toThrow('User email must be a valid email address')
    })

    it('should throw error if email is missing domain', () => {
      expect(() => {
        new User('user-123', 'test@', 'password123')
      }).toThrow('User email must be a valid email address')
    })

    it('should throw error if password is empty', () => {
      expect(() => {
        new User('user-123', 'test@example.com', '')
      }).toThrow('User password cannot be empty')
    })

    it('should throw error if password is whitespace', () => {
      expect(() => {
        new User('user-123', 'test@example.com', '   ')
      }).toThrow('User password cannot be empty')
    })
  })

  describe('updateEmail', () => {
    it('should update email and normalize to lowercase', () => {
      const user = new User('user-123', 'test@example.com', 'password123')
      const originalUpdatedAt = user.updatedAt

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(10)

      user.updateEmail('New@Example.COM')

      expect(user.email).toBe('new@example.com')
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error if new email is empty', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(() => {
        user.updateEmail('')
      }).toThrow('User email cannot be empty')
    })

    it('should throw error if new email is whitespace', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(() => {
        user.updateEmail('   ')
      }).toThrow('User email cannot be empty')
    })

    it('should throw error if new email format is invalid', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(() => {
        user.updateEmail('notanemail')
      }).toThrow('User email must be a valid email address')
    })
  })

  describe('updatePassword', () => {
    it('should update password and updatedAt timestamp', () => {
      const user = new User('user-123', 'test@example.com', 'password123')
      const originalUpdatedAt = user.updatedAt

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(10)

      user.updatePassword('newpassword456')

      expect(user.passwordHash).toBe('newpassword456')
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error if new password is empty', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(() => {
        user.updatePassword('')
      }).toThrow('User password cannot be empty')
    })

    it('should throw error if new password is whitespace', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(() => {
        user.updatePassword('   ')
      }).toThrow('User password cannot be empty')
    })
  })

  describe('getters', () => {
    it('should return email via getter', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(user.email).toBe('test@example.com')
    })

    it('should return passwordHash via getter', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(user.passwordHash).toBe('password123')
    })

    it('should return updatedAt via getter', () => {
      const user = new User('user-123', 'test@example.com', 'password123')

      expect(user.updatedAt).toBeInstanceOf(Date)
    })
  })
})
