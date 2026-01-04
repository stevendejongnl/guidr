import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { ServerConfigClient } from '../../infrastructure/api/ServerConfigClient'
import { ServerConfigCache } from '../../infrastructure/storage/ServerConfigCache'
import { isVersionSupported } from '../../common/VersionUtils'
import { ServerSetupScreen } from '../screens/ServerSetupScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { RegistrationScreen } from '../screens/RegistrationScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { DebugScreen } from '../screens/DebugScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { AppOutdatedScreen } from '../screens/AppOutdatedScreen'
import { UpdateAvailableScreen } from '../screens/UpdateAvailableScreen'
import { UpdateDownloadScreen } from '../screens/UpdateDownloadScreen'
import { GitHubReleaseClient } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateService, UpdateCheckResult } from '../../domain/services/UpdateService'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { commonStyles, colors } from '../theme'

export const AppNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [serverConfig, setServerConfig] = useState<{
    debugMode: boolean
    minAppVersion?: string | null
    maxAppVersion?: string | null
  } | null>(null)
  const [showDebugScreen, setShowDebugScreen] = useState(false)
  const [showSettingsScreen, setShowSettingsScreen] = useState(false)
  const [showServerSetup, setShowServerSetup] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [appVersion] = useState(() => DeviceInfo.getVersion())
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null)
  const [showUpdateDownload, setShowUpdateDownload] = useState(false)
  const [dismissedOptionalUpdate, setDismissedOptionalUpdate] = useState(false)

  const serverStorage = new ServerConfigStorage()
  const authStorage = new AuthStorage()

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        await serverStorage.initializeDefaultServerUrl()

        const url = await serverStorage.getServerUrl()
        setServerUrl(url)

        // Fetch server config if not cached
        if (!ServerConfigCache.hasConfig() && url) {
          try {
            const configClient = new ServerConfigClient(url)
            const config = await configClient.getConfig()
            ServerConfigCache.setConfig(config)
            setServerConfig(config)
          } catch (error) {
            ErrorReporter.capture(error, {
              component: 'AppNavigator',
              action: 'fetchServerConfig',
            })
            console.error('Failed to fetch server config:', error)
            // Set default config on failure
            const defaultConfig = { debugMode: false }
            ServerConfigCache.setConfig(defaultConfig)
            setServerConfig(defaultConfig)
          }
        } else {
          setServerConfig(ServerConfigCache.getConfig())
        }

        const hasToken = await authStorage.hasAuthToken()
        setHasAuthToken(hasToken)

        // Check for updates on Android
        if (Platform.OS === 'android') {
          const currentConfig = ServerConfigCache.getConfig()
          if (currentConfig) {
            try {
              const githubClient = new GitHubReleaseClient()
              const updateStorage = new UpdateCheckStorage()
              const updateService = new UpdateService(
                githubClient,
                updateStorage,
                { minAppVersion: currentConfig.minAppVersion ?? null }
              )
              const updateResult = await updateService.checkForUpdates(
                appVersion,
                false
              )
              setUpdateCheckResult(updateResult)
            } catch (error) {
              ErrorReporter.capture(error, {
                component: 'AppNavigator',
                action: 'checkForUpdates',
              })
              console.error('Update check failed:', error)
              // Don't block the app if update check fails
            }
          }
        }
      } catch (error) {
        ErrorReporter.capture(error, {
          component: 'AppNavigator',
          action: 'checkConfiguration',
        })
        console.error('Failed to check configuration:', error)
      } finally {
        setLoading(false)
      }
    }

    checkConfiguration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleServerSetupComplete = async () => {
    const url = await serverStorage.getServerUrl()
    setServerUrl(url)
    setShowServerSetup(false)

    // Clear server config cache and reload
    ServerConfigCache.clearConfig()
    if (url) {
      try {
        const configClient = new ServerConfigClient(url)
        const config = await configClient.getConfig()
        ServerConfigCache.setConfig(config)
        setServerConfig(config)
      } catch (error) {
        ErrorReporter.capture(error, {
          component: 'AppNavigator',
          action: 'handleServerSetupComplete',
        })
        console.error('Failed to fetch server config:', error)
        const defaultConfig = { debugMode: false }
        ServerConfigCache.setConfig(defaultConfig)
        setServerConfig(defaultConfig)
      }
    }

    // Clear auth since server changed
    await authStorage.clearAll()
    setHasAuthToken(false)
  }

  const handleLoginComplete = () => {
    setHasAuthToken(true)
  }

  const handleLogout = async () => {
    try {
      await authStorage.clearAll()
      setHasAuthToken(false)
    } catch (error) {
      ErrorReporter.capture(error, { component: 'AppNavigator', action: 'logout' })
      console.error('Logout failed:', error)
      // Still update state to log out user even if storage clear fails
      setHasAuthToken(false)
    }
  }

  const handleChangeServer = () => {
    setShowServerSetup(true)
  }

  const handleShowRegistration = () => {
    setShowRegistration(true)
  }

  const handleBackToLogin = () => {
    setShowRegistration(false)
  }

  const handleRegistrationComplete = () => {
    setHasAuthToken(true)
    setShowRegistration(false)
  }

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (showServerSetup) {
    return (
      <ServerSetupScreen
        storage={serverStorage}
        onComplete={handleServerSetupComplete}
        {...(serverUrl && { currentUrl: serverUrl })}
      />
    )
  }

  // Check if app version is supported by the server
  if (
    serverConfig &&
    !isVersionSupported(
      appVersion,
      serverConfig.minAppVersion,
      serverConfig.maxAppVersion
    )
  ) {
    return (
      <AppOutdatedScreen
        currentVersion={appVersion}
        minVersion={serverConfig.minAppVersion ?? null}
        maxVersion={serverConfig.maxAppVersion ?? null}
        onChangeServer={handleChangeServer}
      />
    )
  }

  // Check for Android updates
  if (
    Platform.OS === 'android' &&
    updateCheckResult?.updateAvailable &&
    !dismissedOptionalUpdate
  ) {
    if (updateCheckResult.isMandatory || !dismissedOptionalUpdate) {
      if (showUpdateDownload && updateCheckResult.release?.apkUrl) {
        return (
          <UpdateDownloadScreen
            apkUrl={updateCheckResult.release.apkUrl}
            onComplete={() => {
              // Installation triggered, user will restart app manually
              console.log('Update installation triggered')
            }}
            onCancel={() => {
              setShowUpdateDownload(false)
              if (!updateCheckResult.isMandatory) {
                setDismissedOptionalUpdate(true)
              }
            }}
            onError={(error) => {
              ErrorReporter.capture(error, {
                component: 'AppNavigator',
                action: 'updateDownloadError',
              })
              console.error('Update download error:', error)
              setShowUpdateDownload(false)
            }}
          />
        )
      }

      const handleDismiss = updateCheckResult.isMandatory
        ? undefined
        : () => setDismissedOptionalUpdate(true)

      return (
        <UpdateAvailableScreen
          currentVersion={updateCheckResult.currentVersion}
          latestVersion={updateCheckResult.latestVersion}
          changelog={updateCheckResult.release?.body || ''}
          isMandatory={updateCheckResult.isMandatory}
          onStartUpdate={() => setShowUpdateDownload(true)}
          {...(handleDismiss && { onDismiss: handleDismiss })}
          onChangeServer={handleChangeServer}
        />
      )
    }
  }

  if (!hasAuthToken && serverUrl) {
    const authClient = new AuthClient(serverUrl)

    if (showRegistration) {
      return (
        <RegistrationScreen
          authStorage={authStorage}
          authClient={authClient}
          onComplete={handleRegistrationComplete}
          onBackToLogin={handleBackToLogin}
        />
      )
    }

    return (
      <LoginScreen
        authStorage={authStorage}
        authClient={authClient}
        onComplete={handleLoginComplete}
        onChangeServer={handleChangeServer}
        onRegister={handleShowRegistration}
      />
    )
  }

  if (showDebugScreen && serverUrl) {
    return (
      <DebugScreen
        onBack={() => setShowDebugScreen(false)}
        serverUrl={serverUrl}
      />
    )
  }

  if (showSettingsScreen) {
    return (
      <SettingsScreen
        onBack={() => setShowSettingsScreen(false)}
        onChangeServer={() => {
          setShowSettingsScreen(false)
          handleChangeServer()
        }}
        onOpenDebug={() => {
          setShowSettingsScreen(false)
          setShowDebugScreen(true)
        }}
        debugMode={serverConfig?.debugMode ?? false}
        serverUrl={serverUrl}
      />
    )
  }

  return (
    <HomeScreen
      onLogout={handleLogout}
      onOpenDebug={() => setShowDebugScreen(true)}
      onOpenSettings={() => setShowSettingsScreen(true)}
      debugMode={serverConfig?.debugMode ?? false}
    />
  )
}

