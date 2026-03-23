import { TokenRefreshService } from './TokenRefreshService'
import { AuthClient } from './AuthClient'
import { AuthStorage } from '../storage/AuthStorage'

describe('TokenRefreshService', () => {
  let mockAuthClient: jest.Mocked<Pick<AuthClient, 'refreshToken'>>
  let mockAuthStorage: jest.Mocked<Pick<AuthStorage, 'getRefreshToken' | 'setAuthToken' | 'setRefreshToken'>>
  let mockServerStorage: { getServerUrl: jest.Mock }
  let mockOnLogout: jest.Mock
  let service: TokenRefreshService

  const validAuthResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: false,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockAuthClient = {
      refreshToken: jest.fn().mockResolvedValue(validAuthResponse),
    }

    mockAuthStorage = {
      getRefreshToken: jest.fn().mockResolvedValue('stored-refresh-token'),
      setAuthToken: jest.fn().mockResolvedValue(undefined),
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
    }

    mockServerStorage = {
      getServerUrl: jest.fn().mockResolvedValue('http://localhost:8000'),
    }

    mockOnLogout = jest.fn().mockResolvedValue(undefined)

    service = new TokenRefreshService(
      mockAuthClient as unknown as AuthClient,
      mockAuthStorage as unknown as AuthStorage,
      mockServerStorage,
      mockOnLogout,
    )
  })

  describe('refreshAndRetry()', () => {
    describe('success', () => {
      it('should call authClient.refreshToken with the stored refresh token', async () => {
        await service.refreshAndRetry()

        expect(mockAuthClient.refreshToken).toHaveBeenCalledWith('stored-refresh-token')
      })

      it('should store the new access token in authStorage', async () => {
        await service.refreshAndRetry()

        expect(mockAuthStorage.setAuthToken).toHaveBeenCalledWith('new-access-token')
      })

      it('should store the new refresh token in authStorage', async () => {
        await service.refreshAndRetry()

        expect(mockAuthStorage.setRefreshToken).toHaveBeenCalledWith('new-refresh-token')
      })

      it('should return the new access token', async () => {
        const result = await service.refreshAndRetry()

        expect(result).toBe('new-access-token')
      })

      it('should not call onLogout when refresh succeeds', async () => {
        await service.refreshAndRetry()

        expect(mockOnLogout).not.toHaveBeenCalled()
      })
    })

    describe('failure', () => {
      it('should call onLogout when authClient.refreshToken throws', async () => {
        mockAuthClient.refreshToken.mockRejectedValue(new Error('Refresh token expired'))

        await expect(service.refreshAndRetry()).rejects.toThrow('Refresh token expired')

        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })

      it('should re-throw the original error when authClient.refreshToken throws', async () => {
        const originalError = new Error('Token has expired')
        mockAuthClient.refreshToken.mockRejectedValue(originalError)

        await expect(service.refreshAndRetry()).rejects.toBe(originalError)
      })

      it('should call onLogout when no refresh token is available', async () => {
        mockAuthStorage.getRefreshToken.mockResolvedValue(null)

        await expect(service.refreshAndRetry()).rejects.toThrow('No refresh token available')

        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })

      it('should not call authClient.refreshToken when no refresh token is available', async () => {
        mockAuthStorage.getRefreshToken.mockResolvedValue(null)

        await expect(service.refreshAndRetry()).rejects.toThrow()

        expect(mockAuthClient.refreshToken).not.toHaveBeenCalled()
      })
    })

    describe('concurrent calls deduplication', () => {
      it('should make only ONE authClient.refreshToken call when called concurrently', async () => {
        // Simulate a slow refresh so the second call arrives before the first finishes
        let resolveRefresh!: (value: typeof validAuthResponse) => void
        mockAuthClient.refreshToken.mockImplementation(
          () => new Promise(resolve => { resolveRefresh = resolve }),
        )

        const promise1 = service.refreshAndRetry()
        const promise2 = service.refreshAndRetry()

        // Flush microtask queue so getRefreshToken() has resolved and refreshToken() has been called
        await Promise.resolve()
        await Promise.resolve()

        // Resolve the in-flight refresh
        resolveRefresh(validAuthResponse)

        await Promise.all([promise1, promise2])

        expect(mockAuthClient.refreshToken).toHaveBeenCalledTimes(1)
      })

      it('should return the same access token for all concurrent callers', async () => {
        let resolveRefresh!: (value: typeof validAuthResponse) => void
        mockAuthClient.refreshToken.mockImplementation(
          () => new Promise(resolve => { resolveRefresh = resolve }),
        )

        const promise1 = service.refreshAndRetry()
        const promise2 = service.refreshAndRetry()
        const promise3 = service.refreshAndRetry()

        // Flush microtask queue so getRefreshToken() has resolved and refreshToken() has been called
        await Promise.resolve()
        await Promise.resolve()

        resolveRefresh(validAuthResponse)

        const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

        expect(result1).toBe('new-access-token')
        expect(result2).toBe('new-access-token')
        expect(result3).toBe('new-access-token')
      })

      it('should allow a new refresh after the previous one completes', async () => {
        await service.refreshAndRetry()

        mockAuthClient.refreshToken.mockClear()
        mockAuthClient.refreshToken.mockResolvedValue({
          ...validAuthResponse,
          accessToken: 'second-access-token',
          refreshToken: 'second-refresh-token',
        })

        const result = await service.refreshAndRetry()

        expect(mockAuthClient.refreshToken).toHaveBeenCalledTimes(1)
        expect(result).toBe('second-access-token')
      })
    })
  })
})
