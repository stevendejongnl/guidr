import { ApkInstaller, DownloadProgress } from './ApkInstaller'
import RNFS from 'react-native-fs'
import { Platform, NativeModules } from 'react-native'

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: jest.fn(),
  unlink: jest.fn(),
  downloadFile: jest.fn(),
  stat: jest.fn(),
  getFSInfo: jest.fn(),
}))

// Mock react-native NativeModules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 30,
  },
  NativeModules: {
    ApkInstallerModule: {
      installApk: jest.fn(),
    },
  },
}))

describe('ApkInstaller', () => {
  let installer: ApkInstaller
  let mockProgressCallback: jest.Mock<void, [DownloadProgress]>

  beforeEach(() => {
    installer = new ApkInstaller()
    mockProgressCallback = jest.fn()
    jest.clearAllMocks()
    Platform.OS = 'android'
  })

  describe('downloadApk', () => {
    it('should download APK successfully', async () => {
      const mockDownloadJob = {
        jobId: 1,
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1000 }),
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockReturnValue(mockDownloadJob)
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 1000 })

      const result = await installer.downloadApk(
        'https://example.com/app.apk',
        mockProgressCallback
      )

      expect(result).toBe('/cache/guidr-update.apk')
      expect(RNFS.downloadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fromUrl: 'https://example.com/app.apk',
          toFile: '/cache/guidr-update.apk',
        })
      )
    })

    it('should delete old APK before downloading', async () => {
      const mockDownloadJob = {
        jobId: 1,
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 1000 }),
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(true)
      ;(RNFS.unlink as jest.Mock).mockResolvedValue(undefined)
      ;(RNFS.downloadFile as jest.Mock).mockReturnValue(mockDownloadJob)
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 1000 })

      await installer.downloadApk(
        'https://example.com/app.apk',
        mockProgressCallback
      )

      expect(RNFS.unlink).toHaveBeenCalledWith('/cache/guidr-update.apk')
    })

    it('should call progress callback during download', async () => {
      let capturedProgressCallback: ((res: any) => void) | undefined
      let resolveDownload: (value: any) => void

      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve
      })

      const mockDownloadJob = {
        jobId: 1,
        promise: downloadPromise,
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockImplementation((options) => {
        capturedProgressCallback = options.progress
        return mockDownloadJob
      })
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 1000 })

      const downloadApkPromise = installer.downloadApk(
        'https://example.com/app.apk',
        mockProgressCallback
      )

      // Wait for downloadFile to be called and capture the progress callback
      await new Promise((resolve) => setImmediate(resolve))

      // Now the callback should be captured, simulate progress
      capturedProgressCallback!({
        bytesWritten: 500,
        contentLength: 1000,
      })
      capturedProgressCallback!({
        bytesWritten: 1000,
        contentLength: 1000,
      })

      // Now resolve the download
      resolveDownload!({ statusCode: 200, bytesWritten: 1000 })
      await downloadApkPromise

      expect(mockProgressCallback).toHaveBeenCalledWith({
        bytesWritten: 500,
        contentLength: 1000,
        progress: 50,
      })
      expect(mockProgressCallback).toHaveBeenCalledWith({
        bytesWritten: 1000,
        contentLength: 1000,
        progress: 100,
      })
    })

    it('should handle progress when contentLength is 0', async () => {
      let capturedProgressCallback: ((res: any) => void) | undefined
      let resolveDownload: (value: any) => void

      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve
      })

      const mockDownloadJob = {
        jobId: 1,
        promise: downloadPromise,
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockImplementation((options) => {
        capturedProgressCallback = options.progress
        return mockDownloadJob
      })
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 500 })

      const downloadApkPromise = installer.downloadApk(
        'https://example.com/app.apk',
        mockProgressCallback
      )

      // Wait for downloadFile to be called and capture the progress callback
      await new Promise((resolve) => setImmediate(resolve))

      // Now the callback should be captured, simulate progress
      capturedProgressCallback!({
        bytesWritten: 500,
        contentLength: 0,
      })

      resolveDownload!({ statusCode: 200, bytesWritten: 500 })
      await downloadApkPromise

      expect(mockProgressCallback).toHaveBeenCalledWith({
        bytesWritten: 500,
        contentLength: 0,
        progress: 0,
      })
    })

    it('should throw error on non-200 status code', async () => {
      const mockDownloadJob = {
        jobId: 1,
        promise: Promise.resolve({ statusCode: 404, bytesWritten: 0 }),
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockReturnValue(mockDownloadJob)

      await expect(
        installer.downloadApk(
          'https://example.com/app.apk',
          mockProgressCallback
        )
      ).rejects.toThrow('Download failed with status code 404')
    })

    it('should throw error if downloaded file is empty', async () => {
      const mockDownloadJob = {
        jobId: 1,
        promise: Promise.resolve({ statusCode: 200, bytesWritten: 0 }),
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockReturnValue(mockDownloadJob)
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 0 })

      await expect(
        installer.downloadApk(
          'https://example.com/app.apk',
          mockProgressCallback
        )
      ).rejects.toThrow('Downloaded file is empty')
    })

    it('should throw error on iOS platform', async () => {
      Platform.OS = 'ios'

      await expect(
        installer.downloadApk(
          'https://example.com/app.apk',
          mockProgressCallback
        )
      ).rejects.toThrow('APK download only supported on Android')
    })
  })

  describe('installApk', () => {
    it('should install APK successfully', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true)
      ;(NativeModules['ApkInstallerModule'].installApk as jest.Mock).mockResolvedValue(undefined)

      await installer.installApk('/cache/guidr-update.apk')

      expect(NativeModules['ApkInstallerModule'].installApk).toHaveBeenCalledWith(
        '/cache/guidr-update.apk'
      )
    })

    it('should throw error if file does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false)

      await expect(
        installer.installApk('/cache/guidr-update.apk')
      ).rejects.toThrow('APK file not found at specified path')
    })

    it('should throw error if native module fails', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true)
      ;(NativeModules['ApkInstallerModule'].installApk as jest.Mock).mockRejectedValue(
        new Error('Native module error')
      )

      await expect(
        installer.installApk('/cache/guidr-update.apk')
      ).rejects.toThrow('Native module error')
    })

    it('should throw error on iOS platform', async () => {
      Platform.OS = 'ios'

      await expect(
        installer.installApk('/cache/guidr-update.apk')
      ).rejects.toThrow('APK installation only supported on Android')
    })

    it('should skip installation in test mode', async () => {
      const testInstaller = new ApkInstaller(true)
      ;(RNFS.exists as jest.Mock).mockResolvedValue(true)

      await testInstaller.installApk('/cache/guidr-update.apk')

      expect(NativeModules['ApkInstallerModule'].installApk).not.toHaveBeenCalled()
    })
  })

  describe('cancelDownload', () => {
    it('should cancel active download', async () => {
      const mockDownloadJob = {
        jobId: 1,
        promise: new Promise(() => {}), // Never resolves
        stopDownload: jest.fn(),
      }

      ;(RNFS.exists as jest.Mock).mockResolvedValue(false)
      ;(RNFS.downloadFile as jest.Mock).mockReturnValue(mockDownloadJob)
      ;(RNFS.stat as jest.Mock).mockResolvedValue({ size: 1000 })

      // Start download but don't await
      installer.downloadApk('https://example.com/app.apk', mockProgressCallback)

      // Give it a moment to set the downloadJob
      await new Promise((resolve) => setTimeout(resolve, 10))

      await installer.cancelDownload()

      expect(mockDownloadJob.stopDownload).toHaveBeenCalled()
    })

    it('should not throw if no download is active', async () => {
      await expect(installer.cancelDownload()).resolves.not.toThrow()
    })
  })

  describe('deleteDownloadedApk', () => {
    it('should delete existing APK', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true)
      ;(RNFS.unlink as jest.Mock).mockResolvedValue(undefined)

      await installer.deleteDownloadedApk('/cache/guidr-update.apk')

      expect(RNFS.unlink).toHaveBeenCalledWith('/cache/guidr-update.apk')
    })

    it('should not throw if APK does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false)

      await expect(
        installer.deleteDownloadedApk('/cache/guidr-update.apk')
      ).resolves.not.toThrow()
    })

    it('should not throw on unlink error', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true)
      ;(RNFS.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'))

      await expect(
        installer.deleteDownloadedApk('/cache/guidr-update.apk')
      ).resolves.not.toThrow()
    })
  })

  describe('getFreeSpace', () => {
    it('should return free space', async () => {
      (RNFS.getFSInfo as jest.Mock).mockResolvedValue({
        freeSpace: 1000000000,
        totalSpace: 2000000000,
      })

      const freeSpace = await installer.getFreeSpace()

      expect(freeSpace).toBe(1000000000)
    })

    it('should return 0 on error', async () => {
      (RNFS.getFSInfo as jest.Mock).mockRejectedValue(new Error('Failed'))

      const freeSpace = await installer.getFreeSpace()

      expect(freeSpace).toBe(0)
    })
  })

  describe('checkSufficientSpace', () => {
    it('should return true when sufficient space available', async () => {
      (RNFS.getFSInfo as jest.Mock).mockResolvedValue({
        freeSpace: 100 * 1024 * 1024, // 100 MB
        totalSpace: 1000 * 1024 * 1024,
      })

      const sufficient = await installer.checkSufficientSpace(50 * 1024 * 1024) // 50 MB

      expect(sufficient).toBe(true)
    })

    it('should return false when insufficient space', async () => {
      (RNFS.getFSInfo as jest.Mock).mockResolvedValue({
        freeSpace: 5 * 1024 * 1024, // 5 MB
        totalSpace: 1000 * 1024 * 1024,
      })

      const sufficient = await installer.checkSufficientSpace(50 * 1024 * 1024) // 50 MB

      expect(sufficient).toBe(false)
    })

    it('should account for 10MB buffer', async () => {
      (RNFS.getFSInfo as jest.Mock).mockResolvedValue({
        freeSpace: 15 * 1024 * 1024, // 15 MB
        totalSpace: 1000 * 1024 * 1024,
      })

      // 10 MB file + 10 MB buffer = 20 MB required
      const sufficient = await installer.checkSufficientSpace(10 * 1024 * 1024)

      expect(sufficient).toBe(false)
    })
  })
})
