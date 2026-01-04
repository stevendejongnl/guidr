import RNFS from 'react-native-fs'
import { Platform, NativeModules } from 'react-native'

const { ApkInstallerModule } = NativeModules

export interface DownloadProgress {
  bytesWritten: number
  contentLength: number
  progress: number // 0-100
}

export class ApkInstaller {
  private downloadJob: ReturnType<typeof RNFS.downloadFile> | null = null
  private readonly apkFileName = 'guidr-update.apk'

  constructor(private readonly testMode: boolean = false) {}

  async downloadApk(
    url: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('APK download only supported on Android')
    }

    try {
      // Delete old APK if exists
      const apkPath = `${RNFS.CachesDirectoryPath}/${this.apkFileName}`
      const exists = await RNFS.exists(apkPath)
      if (exists) {
        await RNFS.unlink(apkPath)
      }

      // Download with progress tracking
      const downloadResult = RNFS.downloadFile({
        fromUrl: url,
        toFile: apkPath,
        progress: (res) => {
          const progressPercent =
            res.contentLength > 0
              ? Math.round((res.bytesWritten / res.contentLength) * 100)
              : 0

          onProgress({
            bytesWritten: res.bytesWritten,
            contentLength: res.contentLength,
            progress: progressPercent,
          })
        },
        progressInterval: 100, // Update every 100ms
      })

      this.downloadJob = downloadResult

      const response = await downloadResult.promise
      this.downloadJob = null

      if (response.statusCode !== 200) {
        throw new Error(
          `Download failed with status code ${response.statusCode}`
        )
      }

      // Verify file exists and has content
      const fileInfo = await RNFS.stat(apkPath)
      if (fileInfo.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      return apkPath
    } catch (error) {
      this.downloadJob = null
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to download APK')
    }
  }

  async installApk(filePath: string): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('APK installation only supported on Android')
    }

    if (this.testMode) {
      console.log('TEST MODE: Would install APK from', filePath)
      return
    }

    try {
      // Verify file exists
      const exists = await RNFS.exists(filePath)
      if (!exists) {
        throw new Error('APK file not found at specified path')
      }

      // Use native module to install APK via FileProvider
      // This properly handles content:// URIs required on Android 7+
      await ApkInstallerModule.installApk(filePath)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to install APK')
    }
  }

  async cancelDownload(): Promise<void> {
    if (this.downloadJob && 'stopDownload' in this.downloadJob) {
      (this.downloadJob as any).stopDownload()
      this.downloadJob = null
    }
  }

  async deleteDownloadedApk(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath)
      if (exists) {
        await RNFS.unlink(filePath)
      }
    } catch (error) {
      console.error('Failed to delete downloaded APK:', error)
      // Don't throw - cleanup is best effort
    }
  }

  async getFreeSpace(): Promise<number> {
    try {
      const fsInfo = await RNFS.getFSInfo()
      return fsInfo.freeSpace
    } catch (error) {
      console.error('Failed to get free space:', error)
      return 0
    }
  }

  async checkSufficientSpace(requiredBytes: number): Promise<boolean> {
    const freeSpace = await this.getFreeSpace()
    const bufferSpace = 10 * 1024 * 1024 // 10 MB buffer
    return freeSpace >= requiredBytes + bufferSpace
  }
}
