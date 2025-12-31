import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { ApkInstaller, DownloadProgress } from '../../infrastructure/update/ApkInstaller'
import { VersionDisplay } from '../components/VersionDisplay'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import {
  commonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
} from '../theme'

interface UpdateDownloadScreenProps {
  apkUrl: string
  onComplete: () => void
  onCancel: () => void
  onError: (error: string) => void
}

type DownloadState = 'downloading' | 'installing' | 'error'

export const UpdateDownloadScreen: React.FC<UpdateDownloadScreenProps> = ({
  apkUrl,
  onComplete,
  onCancel,
  onError,
}) => {
  const [state, setState] = useState<DownloadState>('downloading')
  const [progress, setProgress] = useState(0)
  const [bytesDownloaded, setBytesDownloaded] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [apkPath, setApkPath] = useState<string | null>(null)

  const installer = new ApkInstaller()

  useEffect(() => {
    startDownload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startDownload = async () => {
    try {
      setState('downloading')
      setError(null)

      const handleProgress = (progressData: DownloadProgress) => {
        setProgress(progressData.progress)
        setBytesDownloaded(progressData.bytesWritten)
        setTotalBytes(progressData.contentLength)
      }

      const filePath = await installer.downloadApk(apkUrl, handleProgress)
      setApkPath(filePath)

      // Download complete, now install
      setState('installing')
      await installer.installApk(filePath)

      onComplete()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to download update'
      ErrorReporter.capture(err, {
        component: 'UpdateDownloadScreen',
        action: 'downloadApk',
      })
      setError(errorMessage)
      setState('error')
      onError(errorMessage)
    }
  }

  const handleCancel = async () => {
    try {
      if (state === 'downloading') {
        await installer.cancelDownload()
      }
      if (apkPath) {
        await installer.deleteDownloadedApk(apkPath)
      }
    } catch (err) {
      ErrorReporter.capture(err, {
        component: 'UpdateDownloadScreen',
        action: 'cancelDownload',
      })
      console.error('Failed to cancel download:', err)
    }
    onCancel()
  }

  const handleRetry = () => {
    startDownload()
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  if (error) {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.contentCentered}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Download Failed</Text>
          <Text style={commonStyles.errorText}>{error}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={commonStyles.button}
              onPress={handleRetry}
              accessibilityLabel="Retry download"
            >
              <Text style={commonStyles.buttonText}>Retry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={commonStyles.buttonOutline}
              onPress={handleCancel}
              accessibilityLabel="Cancel download"
            >
              <Text style={commonStyles.buttonTextMuted}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <VersionDisplay />
      </View>
    )
  }

  if (state === 'installing') {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.contentCentered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>Installing...</Text>
          <Text style={styles.description}>
            Please approve the installation when prompted
          </Text>
        </View>
        <VersionDisplay />
      </View>
    )
  }

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.contentCentered}>
        <Text style={styles.icon}>📥</Text>
        <Text style={styles.title}>Downloading Update...</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {totalBytes > 0 && (
          <Text style={styles.sizeText}>
            {formatBytes(bytesDownloaded)} / {formatBytes(totalBytes)}
          </Text>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          accessibilityLabel="Cancel download"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizeXxl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  progressText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sizeText: {
    fontSize: typography.sizeSm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  cancelButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.danger,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
})
