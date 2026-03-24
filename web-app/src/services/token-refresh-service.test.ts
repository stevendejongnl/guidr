import { expect } from '@open-wc/testing'
import { TokenRefreshService } from './token-refresh-service.js'
import type { AuthClient, AuthResponse } from './auth-client.js'
import type { AuthStorage } from '../storage/auth-storage.js'

function makeUser() {
  return {
    id: 'user-1',
    email: 'user@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    name: null,
    interests: null,
    isAdmin: false,
    isBeta: false,
  }
}

function makeAuthResponse(overrides = {}): AuthResponse {
  return {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    tokenType: 'bearer',
    user: makeUser(),
    ...overrides,
  }
}

function makeStorage(overrides: Partial<AuthStorage> = {}): AuthStorage {
  const store: Record<string, string | null> = {
    refreshToken: 'stored-refresh-token',
    authToken: 'old-access-token',
  }
  return {
    getRefreshToken: () => store['refreshToken'] ?? null,
    setRefreshToken: (t: string) => { store['refreshToken'] = t },
    clearRefreshToken: () => { store['refreshToken'] = null },
    getAuthToken: () => store['authToken'] ?? null,
    setAuthToken: (t: string) => { store['authToken'] = t },
    hasAuthToken: () => store['authToken'] !== null,
    clearAuthToken: () => { store['authToken'] = null },
    getUserEmail: () => null,
    setUserEmail: () => {},
    clearUserEmail: () => {},
    getUserIsAdmin: () => false,
    setUserIsAdmin: () => {},
    clearUserIsAdmin: () => {},
    getUserIsBeta: () => false,
    setUserIsBeta: () => {},
    clearUserIsBeta: () => {},
    getUserId: () => null,
    setUserId: () => {},
    clearUserId: () => {},
    clearAll: () => { Object.keys(store).forEach(k => { store[k] = null }) },
    ...overrides,
  } as unknown as AuthStorage
}

function makeAuthClient(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    refreshToken: async () => makeAuthResponse(),
    login: async () => makeAuthResponse(),
    register: async () => makeAuthResponse(),
    getProfile: async () => makeUser(),
    updateProfile: async () => makeUser(),
    changePassword: async () => {},
    changeEmail: async () => makeAuthResponse(),
    deleteAccount: async () => {},
    ...overrides,
  } as unknown as AuthClient
}

describe('TokenRefreshService', () => {
  describe('refreshAndRetry', () => {
    it('calls authClient.refreshToken and returns new access token', async () => {
      const storage = makeStorage()
      const service = new TokenRefreshService(makeAuthClient(), storage, () => {})
      const token = await service.refreshAndRetry()
      expect(token).to.equal('new-access-token')
    })

    it('stores new access token in storage', async () => {
      const storage = makeStorage()
      const service = new TokenRefreshService(makeAuthClient(), storage, () => {})
      await service.refreshAndRetry()
      expect(storage.getAuthToken()).to.equal('new-access-token')
    })

    it('stores new refresh token in storage', async () => {
      const storage = makeStorage()
      const service = new TokenRefreshService(makeAuthClient(), storage, () => {})
      await service.refreshAndRetry()
      expect(storage.getRefreshToken()).to.equal('new-refresh-token')
    })

    it('calls onLogout and throws when no refresh token in storage', async () => {
      const storage = makeStorage({ getRefreshToken: () => null })
      let logoutCalled = false
      const service = new TokenRefreshService(makeAuthClient(), storage, () => { logoutCalled = true })
      try {
        await service.refreshAndRetry()
        throw new Error('should have thrown')
      } catch (err) {
        expect((err as Error).message).to.include('No refresh token')
      }
      expect(logoutCalled).to.be.true
    })

    it('calls onLogout and rethrows when authClient.refreshToken fails', async () => {
      const authClient = makeAuthClient({
        refreshToken: async () => { throw new Error('refresh failed') },
      })
      let logoutCalled = false
      const service = new TokenRefreshService(authClient, makeStorage(), () => { logoutCalled = true })
      try {
        await service.refreshAndRetry()
        throw new Error('should have thrown')
      } catch (err) {
        expect((err as Error).message).to.equal('refresh failed')
      }
      expect(logoutCalled).to.be.true
    })

    it('deduplicates concurrent refresh calls into one network request', async () => {
      let refreshCallCount = 0
      const authClient = makeAuthClient({
        refreshToken: async () => {
          refreshCallCount++
          return makeAuthResponse()
        },
      })
      const service = new TokenRefreshService(authClient, makeStorage(), () => {})
      const [token1, token2, token3] = await Promise.all([
        service.refreshAndRetry(),
        service.refreshAndRetry(),
        service.refreshAndRetry(),
      ])
      expect(refreshCallCount).to.equal(1)
      expect(token1).to.equal('new-access-token')
      expect(token2).to.equal('new-access-token')
      expect(token3).to.equal('new-access-token')
    })

    it('allows a second refresh after the first completes', async () => {
      let refreshCallCount = 0
      const authClient = makeAuthClient({
        refreshToken: async () => {
          refreshCallCount++
          return makeAuthResponse()
        },
      })
      const service = new TokenRefreshService(authClient, makeStorage(), () => {})
      await service.refreshAndRetry()
      await service.refreshAndRetry()
      expect(refreshCallCount).to.equal(2)
    })
  })
})
