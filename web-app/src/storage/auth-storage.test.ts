import { expect } from '@open-wc/testing'
import { AuthStorage } from './auth-storage.js'

describe('AuthStorage', () => {
  let storage: AuthStorage

  beforeEach(() => {
    localStorage.clear()
    storage = new AuthStorage()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('auth token', () => {
    it('returns null when no token set', () => {
      expect(storage.getAuthToken()).to.be.null
    })

    it('stores and retrieves token', () => {
      storage.setAuthToken('my-token')
      expect(storage.getAuthToken()).to.equal('my-token')
    })

    it('throws on empty token', () => {
      expect(() => storage.setAuthToken('')).to.throw('Auth token cannot be empty')
    })

    it('throws on whitespace-only token', () => {
      expect(() => storage.setAuthToken('   ')).to.throw('Auth token cannot be empty')
    })

    it('hasAuthToken returns false when not set', () => {
      expect(storage.hasAuthToken()).to.be.false
    })

    it('hasAuthToken returns true when set', () => {
      storage.setAuthToken('token')
      expect(storage.hasAuthToken()).to.be.true
    })

    it('clearAuthToken removes the token', () => {
      storage.setAuthToken('token')
      storage.clearAuthToken()
      expect(storage.getAuthToken()).to.be.null
    })
  })

  describe('user email', () => {
    it('returns null when not set', () => {
      expect(storage.getUserEmail()).to.be.null
    })

    it('stores and retrieves email', () => {
      storage.setUserEmail('user@example.com')
      expect(storage.getUserEmail()).to.equal('user@example.com')
    })

    it('throws on empty email', () => {
      expect(() => storage.setUserEmail('')).to.throw('User email cannot be empty')
    })

    it('throws on whitespace-only email', () => {
      expect(() => storage.setUserEmail('  ')).to.throw('User email cannot be empty')
    })

    it('clearUserEmail removes the email', () => {
      storage.setUserEmail('user@example.com')
      storage.clearUserEmail()
      expect(storage.getUserEmail()).to.be.null
    })
  })

  describe('isAdmin flag', () => {
    it('returns false when not set', () => {
      expect(storage.getUserIsAdmin()).to.be.false
    })

    it('stores and retrieves true', () => {
      storage.setUserIsAdmin(true)
      expect(storage.getUserIsAdmin()).to.be.true
    })

    it('stores and retrieves false', () => {
      storage.setUserIsAdmin(false)
      expect(storage.getUserIsAdmin()).to.be.false
    })

    it('clearUserIsAdmin removes the flag', () => {
      storage.setUserIsAdmin(true)
      storage.clearUserIsAdmin()
      expect(storage.getUserIsAdmin()).to.be.false
    })
  })

  describe('isBeta flag', () => {
    it('returns false when not set', () => {
      expect(storage.getUserIsBeta()).to.be.false
    })

    it('stores and retrieves true', () => {
      storage.setUserIsBeta(true)
      expect(storage.getUserIsBeta()).to.be.true
    })

    it('stores and retrieves false', () => {
      storage.setUserIsBeta(false)
      expect(storage.getUserIsBeta()).to.be.false
    })

    it('clearUserIsBeta removes the flag', () => {
      storage.setUserIsBeta(true)
      storage.clearUserIsBeta()
      expect(storage.getUserIsBeta()).to.be.false
    })
  })

  describe('user id', () => {
    it('returns null when not set', () => {
      expect(storage.getUserId()).to.be.null
    })

    it('stores and retrieves user id', () => {
      storage.setUserId('user-123')
      expect(storage.getUserId()).to.equal('user-123')
    })

    it('throws on empty user id', () => {
      expect(() => storage.setUserId('')).to.throw('User ID cannot be empty')
    })

    it('clearUserId removes the id', () => {
      storage.setUserId('user-123')
      storage.clearUserId()
      expect(storage.getUserId()).to.be.null
    })
  })

  describe('clearAll', () => {
    it('clears all stored values', () => {
      storage.setAuthToken('token')
      storage.setUserEmail('user@example.com')
      storage.setUserIsAdmin(true)
      storage.setUserIsBeta(true)
      storage.setUserId('user-123')

      storage.clearAll()

      expect(storage.getAuthToken()).to.be.null
      expect(storage.getUserEmail()).to.be.null
      expect(storage.getUserIsAdmin()).to.be.false
      expect(storage.getUserIsBeta()).to.be.false
      expect(storage.getUserId()).to.be.null
    })
  })
})
