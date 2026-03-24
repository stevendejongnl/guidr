import { expect } from '@open-wc/testing'
import { AuthService } from './auth-service.js'
import type { AuthClient, AuthResponse } from './auth-client.js'
import type { AuthStorage } from '../storage/auth-storage.js'

function makeUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    name: null,
    interests: null,
    isAdmin: false,
    isBeta: false,
    ...overrides,
  }
}

function makeAuthResponse(overrides = {}): AuthResponse {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'bearer',
    user: makeUser(),
    ...overrides,
  }
}

function makeStorage(overrides: Partial<AuthStorage> = {}): AuthStorage {
  const store: Record<string, string> = {}
  return {
    getAuthToken: () => store['token'] ?? null,
    setAuthToken: (t: string) => { store['token'] = t },
    hasAuthToken: () => 'token' in store,
    clearAuthToken: () => { delete store['token'] },
    getRefreshToken: () => store['refreshToken'] ?? null,
    setRefreshToken: (t: string) => { store['refreshToken'] = t },
    clearRefreshToken: () => { delete store['refreshToken'] },
    getUserEmail: () => store['email'] ?? null,
    setUserEmail: (e: string) => { store['email'] = e },
    clearUserEmail: () => { delete store['email'] },
    getUserIsAdmin: () => store['admin'] === 'true',
    setUserIsAdmin: (v: boolean) => { store['admin'] = String(v) },
    clearUserIsAdmin: () => { delete store['admin'] },
    getUserIsBeta: () => store['beta'] === 'true',
    setUserIsBeta: (v: boolean) => { store['beta'] = String(v) },
    clearUserIsBeta: () => { delete store['beta'] },
    getUserId: () => store['userId'] ?? null,
    setUserId: (id: string) => { store['userId'] = id },
    clearUserId: () => { delete store['userId'] },
    clearAll: () => { Object.keys(store).forEach(k => delete store[k]) },
    ...overrides,
  } as AuthStorage
}

function makeClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    login: async () => makeAuthResponse(),
    register: async () => makeAuthResponse(),
    getProfile: async () => makeUser(),
    updateProfile: async () => makeUser(),
    changePassword: async () => {},
    changeEmail: async () => makeAuthResponse(),
    deleteAccount: async () => {},
    refreshToken: async () => makeAuthResponse(),
    ...overrides,
  } as unknown as AuthClient
}

async function expectThrows(fn: () => Promise<unknown>, message: string) {
  try {
    await fn()
    throw new Error('Expected rejection but resolved')
  } catch (err) {
    expect((err as Error).message).to.include(message)
  }
}

describe('AuthService', () => {
  describe('login', () => {
    it('calls client.login and persists token and email', async () => {
      const storage = makeStorage()
      const service = new AuthService(makeClient(), storage)
      await service.login('user@example.com', 'password')
      expect(storage.getAuthToken()).to.equal('access-token')
      expect(storage.getUserEmail()).to.equal('user@example.com')
    })

    it('persists isAdmin and isBeta flags', async () => {
      const storage = makeStorage()
      const client = makeClient({
        login: async () => makeAuthResponse({ user: makeUser({ isAdmin: true, isBeta: true }) }),
      })
      const service = new AuthService(client, storage)
      await service.login('user@example.com', 'password')
      expect(storage.getUserIsAdmin()).to.be.true
      expect(storage.getUserIsBeta()).to.be.true
    })

    it('persists refresh token on login', async () => {
      const storage = makeStorage()
      const service = new AuthService(makeClient(), storage)
      await service.login('user@example.com', 'password')
      expect(storage.getRefreshToken()).to.equal('refresh-token')
    })

    it('throws when response has no accessToken', async () => {
      const client = makeClient({
        login: async () => ({ tokenType: 'bearer', user: makeUser() } as unknown as AuthResponse),
      })
      const service = new AuthService(client, makeStorage())
      await expectThrows(() => service.login('user@example.com', 'pass'), 'Invalid response from server')
    })

    it('rethrows Error from client', async () => {
      const client = makeClient({
        login: async () => { throw new Error('network down') },
      })
      const service = new AuthService(client, makeStorage())
      await expectThrows(() => service.login('user@example.com', 'pass'), 'network down')
    })

    it('wraps non-Error thrown value with Login failed', async () => {
      const client = makeClient({
        login: async () => { (() => { throw 'oops' })() },
      })
      const service = new AuthService(client, makeStorage())
      await expectThrows(() => service.login('user@example.com', 'pass'), 'Login failed')
    })
  })

  describe('register', () => {
    it('throws when password is too short', async () => {
      const service = new AuthService(makeClient(), makeStorage())
      await expectThrows(() => service.register('user@example.com', 'abc'), 'Password must be at least 6 characters')
    })

    it('persists token on success', async () => {
      const storage = makeStorage()
      const service = new AuthService(makeClient(), storage)
      await service.register('user@example.com', 'password123')
      expect(storage.getAuthToken()).to.equal('access-token')
    })

    it('persists refresh token on register', async () => {
      const storage = makeStorage()
      const service = new AuthService(makeClient(), storage)
      await service.register('user@example.com', 'password123')
      expect(storage.getRefreshToken()).to.equal('refresh-token')
    })

    it('throws when response missing accessToken', async () => {
      const client = makeClient({
        register: async () => ({ tokenType: 'bearer', user: makeUser() } as unknown as AuthResponse),
      })
      const service = new AuthService(client, makeStorage())
      await expectThrows(() => service.register('user@example.com', 'password123'), 'Invalid response from server')
    })

    it('wraps non-Error thrown value with Registration failed', async () => {
      const client = makeClient({
        register: async () => { ((() => { throw 'oops' })()) },
      })
      const service = new AuthService(client, makeStorage())
      await expectThrows(() => service.register('user@example.com', 'password123'), 'Registration failed')
    })
  })

  describe('logout', () => {
    it('clears storage', () => {
      const storage = makeStorage()
      storage.setAuthToken('token')
      const service = new AuthService(makeClient(), storage)
      service.logout()
      expect(storage.getAuthToken()).to.be.null
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      const service = new AuthService(makeClient(), makeStorage())
      expect(service.isAuthenticated()).to.be.false
    })

    it('returns true when token is set', () => {
      const storage = makeStorage()
      storage.setAuthToken('token')
      const service = new AuthService(makeClient(), storage)
      expect(service.isAuthenticated()).to.be.true
    })
  })

  describe('isAdmin / isBeta', () => {
    it('isAdmin returns storage value', () => {
      const storage = makeStorage()
      storage.setUserIsAdmin(true)
      const service = new AuthService(makeClient(), storage)
      expect(service.isAdmin()).to.be.true
    })

    it('isBeta returns storage value', () => {
      const storage = makeStorage()
      storage.setUserIsBeta(true)
      const service = new AuthService(makeClient(), storage)
      expect(service.isBeta()).to.be.true
    })
  })

  describe('getUserEmail / getAuthToken', () => {
    it('getUserEmail returns stored email', () => {
      const storage = makeStorage()
      storage.setUserEmail('user@example.com')
      const service = new AuthService(makeClient(), storage)
      expect(service.getUserEmail()).to.equal('user@example.com')
    })

    it('getAuthToken returns stored token', () => {
      const storage = makeStorage()
      storage.setAuthToken('my-token')
      const service = new AuthService(makeClient(), storage)
      expect(service.getAuthToken()).to.equal('my-token')
    })
  })

  describe('refreshProfile', () => {
    it('does nothing when no token', async () => {
      let called = false
      const client = makeClient({ getProfile: async () => { called = true; return makeUser() } })
      const service = new AuthService(client, makeStorage())
      await service.refreshProfile()
      expect(called).to.be.false
    })

    it('updates admin and beta flags from API', async () => {
      const storage = makeStorage()
      storage.setAuthToken('token')
      const client = makeClient({
        getProfile: async () => makeUser({ isAdmin: true, isBeta: true }),
      })
      const service = new AuthService(client, storage)
      await service.refreshProfile()
      expect(storage.getUserIsAdmin()).to.be.true
      expect(storage.getUserIsBeta()).to.be.true
    })
  })
})
