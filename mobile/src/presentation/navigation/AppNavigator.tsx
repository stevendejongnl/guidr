import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View, Platform, AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { NotificationPreferencesStorage } from '../../infrastructure/storage/NotificationPreferencesStorage'
import { NotificationService } from '../../infrastructure/native/NotificationService'
import { WidgetService } from '../../infrastructure/native/WidgetService'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { ServerConfigClient } from '../../infrastructure/api/ServerConfigClient'
import { ServerConfigCache } from '../../infrastructure/storage/ServerConfigCache'
import { HealthCheckService } from '../../domain/services/HealthCheckService'
import { isVersionSupported } from '../../common/VersionUtils'
import { ServerSetupScreen } from '../screens/ServerSetupScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { RegistrationScreen } from '../screens/RegistrationScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { AdminScreen } from '../screens/AdminScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { SessionExecutionScreen } from '../screens/SessionExecutionScreen'
import { GuideListScreen } from '../screens/GuideListScreen'
import { GuideFormScreen } from '../screens/GuideFormScreen'
import { BrowseGuidesScreen } from '../screens/BrowseGuidesScreen'
import { GuideDetailScreen } from '../screens/GuideDetailScreen'
import { StepFormScreen } from '../screens/StepFormScreen'
import { SessionHistoryScreen } from '../screens/SessionHistoryScreen'
import { AppOutdatedScreen } from '../screens/AppOutdatedScreen'
import { ServerMaintenanceScreen } from '../screens/ServerMaintenanceScreen'
import { UpdateAvailableScreen } from '../screens/UpdateAvailableScreen'
import { UpdateDownloadScreen } from '../screens/UpdateDownloadScreen'
import { GitHubReleaseClient } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateService, UpdateCheckResult } from '../../domain/services/UpdateService'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { Logger } from '../../infrastructure/logging/Logger'
import { GuideService } from '../../domain/services/GuideService'
import { SessionService } from '../../domain/services/SessionService'
import { StepService } from '../../domain/services/StepService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { GuideFavoriteClient } from '../../infrastructure/api/GuideFavoriteClient'
import { TokenRefreshService } from '../../infrastructure/api/TokenRefreshService'
import { MaintenanceEventEmitter } from '../../common/MaintenanceEventEmitter'
import { colors } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface ServicesBundle {
  guide: GuideService
  session: SessionService
  step: StepService
  stepTimerClient: StepTimerClient
  guideFavoriteClient: GuideFavoriteClient
}

interface AppNavigatorProps {
  serverConfigStorage?: ServerConfigStorage
  authStorage?: AuthStorage
  healthCheckService?: HealthCheckService
  notificationPreferencesStorage?: NotificationPreferencesStorage
  notificationService?: NotificationService
  widgetService?: WidgetService
  githubReleaseClient?: GitHubReleaseClient
  updateCheckStorage?: UpdateCheckStorage
  createAuthClient?: (serverUrl: string) => AuthClient
  createServerConfigClient?: (serverUrl: string) => ServerConfigClient
  createServices?: (serverUrl: string) => ServicesBundle
  createTokenRefreshService?: (
    authClient: AuthClient,
    authStorage: AuthStorage,
    serverStorage: ServerConfigStorage,
    onLogout: () => Promise<void>,
  ) => TokenRefreshService
}

// How often to re-check for an app update while the app stays open in the foreground.
// checkForUpdates() itself caches its result for 24h, so this just controls how soon
// after that cache expires the app notices — not how often the network gets hit.
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

const defaultCreateAuthClient = (serverUrl: string) => new AuthClient(serverUrl)
const defaultCreateServerConfigClient = (serverUrl: string) => new ServerConfigClient(serverUrl)
const defaultCreateServices = (serverUrl: string): ServicesBundle => {
  const guideRepository = new GuideRepository(serverUrl)
  const sessionRepository = new SessionRepository(serverUrl)
  const stepRepository = new StepRepository(serverUrl)

  return {
    guide: new GuideService(guideRepository, stepRepository),
    session: new SessionService(sessionRepository, guideRepository, stepRepository),
    step: new StepService(stepRepository),
    stepTimerClient: new StepTimerClient(serverUrl),
    guideFavoriteClient: new GuideFavoriteClient(serverUrl),
  }
}
const defaultCreateTokenRefreshService = (
  authClient: AuthClient,
  authStorage: AuthStorage,
  serverStorage: ServerConfigStorage,
  onLogout: () => Promise<void>,
) => new TokenRefreshService(authClient, authStorage, serverStorage, onLogout)

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  serverConfigStorage = new ServerConfigStorage(),
  authStorage = new AuthStorage(),
  healthCheckService = new HealthCheckService(),
  notificationPreferencesStorage = new NotificationPreferencesStorage(),
  notificationService = new NotificationService(),
  widgetService = new WidgetService(),
  githubReleaseClient = new GitHubReleaseClient(),
  updateCheckStorage = new UpdateCheckStorage(),
  createAuthClient = defaultCreateAuthClient,
  createServerConfigClient = defaultCreateServerConfigClient,
  createServices = defaultCreateServices,
  createTokenRefreshService = defaultCreateTokenRefreshService,
}) => {
  const [loading, setLoading] = useState(true)
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminModeActive, setAdminModeActive] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [serverConfig, setServerConfig] = useState<{
    minAppVersion?: string | null
    maxAppVersion?: string | null
  } | null>(null)
  const [showAdminScreen, setShowAdminScreen] = useState(false)
  const [showSettingsScreen, setShowSettingsScreen] = useState(false)
  const [showProfileScreen, setShowProfileScreen] = useState(false)
  const [showServerSetup, setShowServerSetup] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [appVersion] = useState(() => DeviceInfo.getVersion())
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null)
  const [showUpdateDownload, setShowUpdateDownload] = useState(false)
  const [dismissedOptionalUpdate, setDismissedOptionalUpdate] = useState(false)
  const [showSessionExecution, setShowSessionExecution] = useState(false)
  const [executingSessionId, setExecutingSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showGuideList, setShowGuideList] = useState(false)
  const [guideFormMode, setGuideFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null)
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [showBrowseGuides, setShowBrowseGuides] = useState(false)
  const [showGuideDetail, setShowGuideDetail] = useState(false)
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [focusStepId, setFocusStepId] = useState<string | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)
  const [stepFormMode, setStepFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepGuideId, setEditingStepGuideId] = useState<string | null>(null)
  const [newStepOrder, setNewStepOrder] = useState(0)
  const [canEditCurrentGuide, setCanEditCurrentGuide] = useState(false)
  const [editingGuideOwnerId, setEditingGuideOwnerId] = useState<string | null>(null)
  const [editingStepGuideOwnerId, setEditingStepGuideOwnerId] = useState<string | null>(null)
  const [stepsRefreshKey, setStepsRefreshKey] = useState(0)
  const [serverMaintenance, setServerMaintenance] = useState(false)

  useEffect(() => {
    MaintenanceEventEmitter.setListener(() => setServerMaintenance(true))
    return () => MaintenanceEventEmitter.setListener(null)
  }, [])

  const serverStorage = serverConfigStorage

  // Create service instances
  const servicesRef = React.useRef<{
    guide: GuideService
    session: SessionService
    step: StepService
    stepTimerClient: StepTimerClient
    guideFavoriteClient: GuideFavoriteClient
  } | null>(null)

  const tokenRefreshServiceRef = useRef<TokenRefreshService | null>(null)

  // Request notification permission on Android once the user is signed
  // in — covers both a cold start while already authenticated and a
  // fresh login/registration in the current session — instead of waiting
  // for a Settings toggle (which defaults to already-on and so never
  // fires) or the first timer.
  const requestNotificationPermissionIfEnabled = async () => {
    if (Platform.OS !== 'android') return
    try {
      const timerNotificationsEnabled =
        await notificationPreferencesStorage.getTimerNotificationsEnabled()
      if (timerNotificationsEnabled) {
        await notificationService.requestPermission()
      }
    } catch (error) {
      ErrorReporter.capture(error, {
        component: 'AppNavigator',
        action: 'requestNotificationPermission',
      })
      console.error('Failed to request notification permission:', error)
    }
  }

  // Jump straight to the step that was running when the user tapped the home-screen
  // widget. Checked on cold start (below) and whenever the app returns to the
  // foreground (singleTask + onNewIntent means a widget tap while already running
  // doesn't trigger a fresh mount, so AppState is the only signal we get for that case).
  //
  // urlOverride: on cold start this runs inside the same checkConfiguration() call that
  // just resolved the server URL — the serverUrl *state* is still stale (this effect's
  // closure was created at mount, before checkConfiguration set it), so the caller passes
  // the freshly-resolved value directly rather than relying on the state variable. The
  // AppState-triggered call omits it since serverUrl is long since settled by then.
  const checkWidgetLaunchTarget = async (urlOverride?: string) => {
    if (Platform.OS !== 'android') return
    const target = await widgetService.getAndClearLaunchTarget()
    if (target) {
      const url = urlOverride || serverUrl
      if (url) ensureServicesInitialized(url)
      setSelectedGuideId(target.guideId)
      setFocusStepId(target.stepId)
      setShowGuideDetail(true)
    }
  }

  // Re-checks for an app update and, when one exists and we haven't already fired a
  // notification for that exact version, shows one. Called on cold start, whenever the
  // app returns to the foreground, and periodically while it stays open — otherwise a
  // long-running session would only ever reflect whatever was known at launch, and a
  // user who never force-closes the app would never find out an update exists.
  // checkForUpdates() itself respects UpdateCheckCache's 24h window, so calling this
  // often is cheap — most calls just re-read the cache rather than hitting the network.
  const checkForAppUpdate = async () => {
    if (Platform.OS !== 'android') return
    const currentConfig = ServerConfigCache.getConfig()
    if (!currentConfig) return
    try {
      const updateService = new UpdateService(
        githubReleaseClient,
        updateCheckStorage,
        { minAppVersion: currentConfig.minAppVersion ?? null }
      )
      const updateResult = await updateService.checkForUpdates(appVersion, false)
      setUpdateCheckResult(updateResult)

      if (updateResult.updateAvailable) {
        const lastNotifiedVersion = await updateCheckStorage.getLastNotifiedVersion()
        if (lastNotifiedVersion !== updateResult.latestVersion) {
          await notificationService.showUpdateAvailableNotification(
            updateResult.latestVersion,
            updateResult.isMandatory,
          )
          await updateCheckStorage.setLastNotifiedVersion(updateResult.latestVersion)
        }
      }
    } catch (error) {
      ErrorReporter.capture(error, {
        component: 'AppNavigator',
        action: 'checkForUpdates',
      })
      console.error('Update check failed:', error)
      // Don't block the app if update check fails
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkWidgetLaunchTarget()
        checkForAppUpdate()
      }
    })
    return () => subscription.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Covers the session that never backgrounds: without this, a user who opens Guidr
  // and leaves it running in the foreground for hours would only ever see whatever
  // update state was known at launch.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const interval = setInterval(checkForAppUpdate, UPDATE_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const debugMode = await AsyncStorage.getItem('Guidr_DebugMode').then(v => v === 'true')
        Logger.setDebugMode(debugMode)
        Logger.info('AppNavigator', 'App starting', { debugMode })

        await serverStorage.initializeDefaultServerUrl()

        const url = await serverStorage.getServerUrl()
        setServerUrl(url)

        // Non-blocking health check on app startup
        if (url) {
          try {
            const healthCheckResult = await healthCheckService.validateServer(url)
            if (!healthCheckResult.healthy) {
              console.warn(
                'Server health check failed on startup:',
                healthCheckResult.error
              )
            }
          } catch (error) {
            console.warn('Failed to perform health check on startup:', error)
            // Don't block app startup on health check failure
          }
        }

        // Fetch server config if not cached
        if (!ServerConfigCache.hasConfig() && url) {
          try {
            const configClient = createServerConfigClient(url)
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
            const defaultConfig = {}
            ServerConfigCache.setConfig(defaultConfig)
            setServerConfig(defaultConfig)
          }
        } else {
          setServerConfig(ServerConfigCache.getConfig())
        }

        const hasToken = await authStorage.hasAuthToken()
        setHasAuthToken(hasToken)

        // Load user email, ID and admin status if authenticated
        if (hasToken) {
          const email = await authStorage.getUserEmail()
          setUserEmail(email || '')

          const userIdValue = await authStorage.getUserId()
          setUserId(userIdValue)

          const adminStatus = await authStorage.getUserIsAdmin()
          setIsAdmin(adminStatus)
          Logger.debug('AppNavigator', 'Auth state loaded', { hasToken, isAdmin: adminStatus })
          await requestNotificationPermissionIfEnabled()
          await checkWidgetLaunchTarget(url ?? undefined)
        }

        await checkForAppUpdate()
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

  const ensureServicesInitialized = (url: string) => {
    if (servicesRef.current) return
    servicesRef.current = createServices(url)
    tokenRefreshServiceRef.current = createTokenRefreshService(
      createAuthClient(url),
      authStorage,
      serverStorage,
      handleLogout,
    )
  }

  // Initialize services if we have server URL
  useEffect(() => {
    if (serverUrl) ensureServicesInitialized(serverUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl])

  const handleServerSetupComplete = async () => {
    const url = await serverStorage.getServerUrl()
    setServerUrl(url)
    setShowServerSetup(false)

    // Clear server config cache and reload
    ServerConfigCache.clearConfig()
    if (url) {
      try {
        const configClient = createServerConfigClient(url)
        const config = await configClient.getConfig()
        ServerConfigCache.setConfig(config)
        setServerConfig(config)
      } catch (error) {
        ErrorReporter.capture(error, {
          component: 'AppNavigator',
          action: 'handleServerSetupComplete',
        })
        console.error('Failed to fetch server config:', error)
        const defaultConfig = {}
        ServerConfigCache.setConfig(defaultConfig)
        setServerConfig(defaultConfig)
      }
    }

    // Clear auth since server changed
    await authStorage.clearAll()
    setHasAuthToken(false)
    setIsAdmin(false)
  }

  const handleLoginComplete = async () => {
    setHasAuthToken(true)
    const email = await authStorage.getUserEmail()
    setUserEmail(email || '')

    const userIdValue = await authStorage.getUserId()
    setUserId(userIdValue)

    const adminStatus = await authStorage.getUserIsAdmin()
    setIsAdmin(adminStatus)
    await requestNotificationPermissionIfEnabled()
  }

  const handleLogout = async () => {
    try {
      await authStorage.clearAll()
      setHasAuthToken(false)
      setUserId(null)
      setIsAdmin(false)
      setAdminModeActive(false)
    } catch (error) {
      ErrorReporter.capture(error, { component: 'AppNavigator', action: 'logout' })
      console.error('Logout failed:', error)
      // Still update state to log out user even if storage clear fails
      setHasAuthToken(false)
      setUserId(null)
      setIsAdmin(false)
      setAdminModeActive(false)
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

  const handleRegistrationComplete = async () => {
    setHasAuthToken(true)
    setShowRegistration(false)
    const email = await authStorage.getUserEmail()
    setUserEmail(email || '')

    const userIdValue = await authStorage.getUserId()
    setUserId(userIdValue)

    const adminStatus = await authStorage.getUserIsAdmin()
    setIsAdmin(adminStatus)
    await requestNotificationPermissionIfEnabled()
  }

  const handleViewSessionDetail = (sessionId: string) => {
    setExecutingSessionId(sessionId)
    setShowSessionExecution(true)
  }

  const handleSessionComplete = () => {
    setShowSessionExecution(false)
    setExecutingSessionId(null)
  }

  const handleSessionCancel = () => {
    setShowSessionExecution(false)
    setExecutingSessionId(null)
  }

  const handleSessionBack = () => {
    setShowSessionExecution(false)
    setExecutingSessionId(null)
  }

  const handleBrowseGuides = () => {
    setShowBrowseGuides(true)
  }

  const handleBrowseGuidesBack = () => {
    setShowBrowseGuides(false)
  }

  const handleBrowseGuidesViewGuide = (guideId: string) => {
    setSelectedGuideId(guideId)
    setShowGuideDetail(true)
  }

  const handleManageGuides = () => {
    setShowGuideList(true)
  }

  const handleCreateGuide = () => {
    setGuideFormMode('create')
  }

  const handleEditGuide = async (guideId: string) => {
    try {
      // Load guide to get ownership information
      if (servicesRef.current) {
        const token = await authStorage.getAuthToken()
        if (token) {
          const guide = await servicesRef.current.guide.getGuideById(guideId, token)
          if (guide) {
            setEditingGuideOwnerId(guide.createdByUserId || null)
            const canEdit = Boolean(adminModeActive || (userId && guide.isOwnedBy(userId)))
            setCanEditCurrentGuide(canEdit)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load guide for ownership check:', error)
    }
    setEditingGuideId(guideId)
    setGuideFormMode('edit')
  }

  const handleGuideFormSave = () => {
    setGuideFormMode(null)
    setEditingGuideId(null)
    setEditingGuideOwnerId(null)
    setShowGuideList(true)
  }

  const handleGuideFormCancel = () => {
    setGuideFormMode(null)
    setEditingGuideId(null)
    setEditingGuideOwnerId(null)
  }

  const handleViewGuide = (guideId: string) => {
    setSelectedGuideId(guideId)
    setShowGuideDetail(true)
  }

  const handleGuideDetailEdit = (guideId: string) => {
    setShowGuideDetail(false)
    handleEditGuide(guideId)
  }

  const handleGuideListBack = () => {
    setShowGuideList(false)
  }

  const handleAddStep = async (guideId: string, stepCount: number) => {
    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) throw new Error('No auth token found')

      const serverUrl = await serverStorage.getServerUrl()
      if (!serverUrl) throw new Error('No server URL configured')

      // Load the guide to check ownership
      const services = servicesRef.current
      if (services) {
        const guide = await services.guide.getGuideById(guideId, authToken)
        if (guide) {
          const canEdit = Boolean(adminModeActive || (userId && guide.isOwnedBy(userId)))
          setCanEditCurrentGuide(canEdit)
        }
      }
    } catch (error) {
      console.error('Failed to check guide authorization:', error)
      setCanEditCurrentGuide(false)
    }

    setEditingStepGuideId(guideId)
    setEditingStepId(null)
    setNewStepOrder(stepCount)
    setStepFormMode('create')
    setShowStepForm(true)
  }

  const handleEditStep = async (stepId: string, guideId?: string) => {
    const targetGuideId = guideId || editingStepGuideId
    if (targetGuideId) {
      setEditingStepGuideId(targetGuideId)
    }
    try {
      if (servicesRef.current && targetGuideId) {
        const token = await authStorage.getAuthToken()
        if (token) {
          const guide = await servicesRef.current.guide.getGuideById(targetGuideId, token)
          if (guide) {
            setEditingStepGuideOwnerId(guide.createdByUserId || null)
            const canEdit = Boolean(adminModeActive || (userId && guide.isOwnedBy(userId)))
            setCanEditCurrentGuide(canEdit)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load step guide for ownership check:', error)
      setCanEditCurrentGuide(false)
    }
    setEditingStepId(stepId)
    setStepFormMode('edit')
    setShowStepForm(true)
  }

  const handleStepFormSave = async () => {
    setShowStepForm(false)
    setStepFormMode(null)
    setEditingStepId(null)
    setEditingStepGuideOwnerId(null)

    // Increment refresh key so GuideFormScreen reloads its steps
    setStepsRefreshKey(prev => prev + 1)
  }

  const handleStepFormCancel = () => {
    setShowStepForm(false)
    setStepFormMode(null)
    setEditingStepId(null)
    setEditingStepGuideId(null)
    setEditingStepGuideOwnerId(null)
  }

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (serverMaintenance) {
    return (
      <ServerMaintenanceScreen
        onRetry={() => setServerMaintenance(false)}
        onChangeServer={() => {
          setServerMaintenance(false)
          setShowServerSetup(true)
        }}
      />
    )
  }

  if (showServerSetup) {
    return (
      <ServerSetupScreen
        storage={serverStorage}
        healthCheckService={healthCheckService}
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
    const authClient = createAuthClient(serverUrl)

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

  if (showAdminScreen && serverUrl) {
    return (
      <AdminScreen
        onBack={() => setShowAdminScreen(false)}
        serverUrl={serverUrl}
        healthCheckService={healthCheckService}
      />
    )
  }

  if (showProfileScreen && serverUrl) {
    const authClient = createAuthClient(serverUrl)

    return (
      <ProfileScreen
        onBack={() => setShowProfileScreen(false)}
        authClient={authClient}
        authStorage={authStorage}
        userEmail={userEmail}
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
        onOpenAdmin={() => {
          setShowSettingsScreen(false)
          setShowAdminScreen(true)
        }}
        isAdmin={isAdmin}
        adminModeActive={adminModeActive}
        onToggleAdminMode={setAdminModeActive}
        serverUrl={serverUrl}
        healthCheckService={healthCheckService}
      />
    )
  }

  if (showSessionExecution && executingSessionId) {
    return (
      <SessionExecutionScreen
        sessionId={executingSessionId}
        onComplete={handleSessionComplete}
        onCancel={handleSessionCancel}
        onBack={handleSessionBack}
      />
    )
  }

  if (showStepForm && stepFormMode && editingStepGuideId) {
    const isEditingOthersStep =
      stepFormMode === 'edit' &&
      adminModeActive &&
      userId !== null &&
      editingStepGuideOwnerId !== null &&
      editingStepGuideOwnerId !== userId

    return (
      <StepFormScreen
        mode={stepFormMode}
        guideId={editingStepGuideId}
        {...(editingStepId && { stepId: editingStepId })}
        {...(stepFormMode === 'create' && { order: newStepOrder })}
        onSave={handleStepFormSave}
        onCancel={handleStepFormCancel}
        canEdit={canEditCurrentGuide}
        isAdmin={adminModeActive}
        isEditingOthersContent={isEditingOthersStep}
      />
    )
  }

  if (guideFormMode && serverUrl) {
    const isEditingOthersGuide =
      guideFormMode === 'edit' &&
      adminModeActive &&
      userId !== null &&
      editingGuideOwnerId !== null &&
      editingGuideOwnerId !== userId

    return (
      <GuideFormScreen
        mode={guideFormMode}
        {...(editingGuideId && { guideId: editingGuideId })}
        onSave={handleGuideFormSave}
        onCancel={handleGuideFormCancel}
        isAdmin={adminModeActive}
        isEditingOthersContent={isEditingOthersGuide}
        onAddStep={handleAddStep}
        onEditStep={(stepId) => handleEditStep(stepId, editingGuideId || undefined)}
        {...(servicesRef.current && { stepService: servicesRef.current.step })}
        stepsRefreshKey={stepsRefreshKey}
      />
    )
  }

  if (showGuideDetail && selectedGuideId) {
    return (
      <GuideDetailScreen
        key={selectedGuideId}
        guideId={selectedGuideId}
        onBack={() => {
          setShowGuideDetail(false)
          setSelectedGuideId(null)
          setFocusStepId(null)
        }}
        onEdit={handleGuideDetailEdit}
        isAdmin={adminModeActive}
        {...(focusStepId && { focusStepId })}
        {...(servicesRef.current && {
          guideService: servicesRef.current.guide,
          stepService: servicesRef.current.step,
          stepTimerClient: servicesRef.current.stepTimerClient,
        })}
      />
    )
  }

  if (showGuideList) {
    return (
      <GuideListScreen
        onCreateGuide={handleCreateGuide}
        onEditGuide={handleEditGuide}
        onViewGuide={handleViewGuide}
        onBack={handleGuideListBack}
        isAdmin={adminModeActive}
        {...(servicesRef.current && {
          guideFavoriteClient: servicesRef.current.guideFavoriteClient,
        })}
      />
    )
  }

  if (showBrowseGuides) {
    return (
      <BrowseGuidesScreen
        onBack={handleBrowseGuidesBack}
        onViewGuide={handleBrowseGuidesViewGuide}
        {...(servicesRef.current && {
          guideService: servicesRef.current.guide,
          guideFavoriteClient: servicesRef.current.guideFavoriteClient,
        })}
      />
    )
  }

  if (showSessionHistory && servicesRef.current) {
    return (
      <SessionHistoryScreen
        onBack={() => setShowSessionHistory(false)}
        sessionService={servicesRef.current.session}
        guideService={servicesRef.current.guide}
        authStorage={authStorage}
      />
    )
  }

  return (
    <HomeScreen
      onLogout={handleLogout}
      onOpenSettings={() => setShowSettingsScreen(true)}
      onOpenProfile={() => setShowProfileScreen(true)}
      onBrowseGuides={handleBrowseGuides}
      onManageGuides={handleManageGuides}
      onViewSessionDetail={handleViewSessionDetail}
      onViewSessionHistory={() => setShowSessionHistory(true)}
      onViewGuideDetail={handleViewGuide}
      isAdmin={isAdmin}
      adminModeActive={adminModeActive}
      onToggleAdminMode={setAdminModeActive}
      {...(servicesRef.current && {
        guideService: servicesRef.current.guide,
        sessionService: servicesRef.current.session,
      })}
      {...(tokenRefreshServiceRef.current && {
        tokenRefreshService: tokenRefreshServiceRef.current,
      })}
    />
  )
}

