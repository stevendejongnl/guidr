import { ValidatedServerStorage } from './ValidatedServerStorage'
import { ServerConfigStorage } from './ServerConfigStorage'
import { HealthCheckService } from '../../domain/services/HealthCheckService'

jest.mock('./ServerConfigStorage')
jest.mock('../../domain/services/HealthCheckService')

describe('ValidatedServerStorage', () => {
  let validatedStorage: ValidatedServerStorage

  describe('setServerUrlWithValidation', () => {
    it('should validate server URL before saving', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn().mockResolvedValue({ healthy: true, responseTime: 100 }),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      await validatedStorage.setServerUrlWithValidation('https://example.com')

      expect(mockHealthCheckInstance.validateServer).toHaveBeenCalledWith('https://example.com')
    })

    it('should save URL if health check succeeds', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn().mockResolvedValue({ healthy: true, responseTime: 100 }),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      await validatedStorage.setServerUrlWithValidation('https://example.com')

      expect(mockStorageInstance.setServerUrl).toHaveBeenCalledWith('https://example.com')
    })

    it('should not save URL if health check fails', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest
          .fn()
          .mockResolvedValue({ healthy: false, responseTime: 100, error: 'Connection failed' }),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      await validatedStorage.setServerUrlWithValidation('https://invalid.example.com')

      expect(mockStorageInstance.setServerUrl).not.toHaveBeenCalled()
    })

    it('should return health check result', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const healthCheckResult = { healthy: true, responseTime: 127 }
      const mockHealthCheckInstance = {
        validateServer: jest.fn().mockResolvedValue(healthCheckResult),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.setServerUrlWithValidation('https://example.com')

      expect(result).toEqual(healthCheckResult)
    })

    it('should return health check result even if save fails', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn().mockRejectedValue(new Error('Save failed')),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const healthCheckResult = { healthy: true, responseTime: 100 }
      const mockHealthCheckInstance = {
        validateServer: jest.fn().mockResolvedValue(healthCheckResult),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.setServerUrlWithValidation('https://example.com')

      expect(result).toEqual(healthCheckResult)
    })

    it('should provide helpful error messages', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const errorMessage = 'Server returned HTTP 502'
      const mockHealthCheckInstance = {
        validateServer: jest
          .fn()
          .mockResolvedValue({ healthy: false, responseTime: 100, error: errorMessage }),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.setServerUrlWithValidation('https://example.com')

      expect(result.error).toBe(errorMessage)
    })
  })

  describe('delegation methods', () => {
    it('should delegate getServerUrl to storage', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn().mockResolvedValue('https://example.com'),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn(),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.getServerUrl()

      expect(result).toBe('https://example.com')
      expect(mockStorageInstance.getServerUrl).toHaveBeenCalled()
    })

    it('should delegate hasServerUrl to storage', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn().mockResolvedValue(true),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn(),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.hasServerUrl()

      expect(result).toBe(true)
      expect(mockStorageInstance.hasServerUrl).toHaveBeenCalled()
    })

    it('should delegate clearServerUrl to storage', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn(),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      await validatedStorage.clearServerUrl()

      expect(mockStorageInstance.clearServerUrl).toHaveBeenCalled()
    })

    it('should delegate initializeDefaultServerUrl to storage', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn(),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn(),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      await validatedStorage.initializeDefaultServerUrl()

      expect(mockStorageInstance.initializeDefaultServerUrl).toHaveBeenCalled()
    })

    it('should delegate getDefaultServerUrl to storage', async () => {
      const mockStorageInstance = {
        setServerUrl: jest.fn(),
        getServerUrl: jest.fn(),
        hasServerUrl: jest.fn(),
        clearServerUrl: jest.fn(),
        initializeDefaultServerUrl: jest.fn(),
        getDefaultServerUrl: jest.fn().mockResolvedValue('https://guidr.madebysteven.nl'),
      } as unknown as ServerConfigStorage

      const mockHealthCheckInstance = {
        validateServer: jest.fn(),
      } as unknown as HealthCheckService

      validatedStorage = new ValidatedServerStorage(mockStorageInstance, mockHealthCheckInstance)

      const result = await validatedStorage.getDefaultServerUrl()

      expect(result).toBe('https://guidr.madebysteven.nl')
      expect(mockStorageInstance.getDefaultServerUrl).toHaveBeenCalled()
    })
  })
})
