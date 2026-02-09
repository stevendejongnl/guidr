import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
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
import { AppOutdatedScreen } from '../screens/AppOutdatedScreen'
import { UpdateAvailableScreen } from '../screens/UpdateAvailableScreen'
import { UpdateDownloadScreen } from '../screens/UpdateDownloadScreen'
import { GitHubReleaseClient } from '../../infrastructure/api/GitHubReleaseClient'
import { UpdateCheckStorage } from '../../infrastructure/storage/UpdateCheckStorage'
import { UpdateService, UpdateCheckResult } from '../../domain/services/UpdateService'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { GuideService } from '../../domain/services/GuideService'
import { SessionService } from '../../domain/services/SessionService'
import { StepService } from '../../domain/services/StepService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { colors } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

export const AppNavigator: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [hasAuthToken, setHasAuthToken] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
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
  const [showBrowseGuides, setShowBrowseGuides] = useState(false)
  const [showGuideDetail, setShowGuideDetail] = useState(false)
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)
  const [stepFormMode, setStepFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepGuideId, setEditingStepGuideId] = useState<string | null>(null)
  const [newStepOrder, setNewStepOrder] = useState(0)
  const [canEditCurrentGuide, setCanEditCurrentGuide] = useState(false)
  const [editingGuideOwnerId, setEditingGuideOwnerId] = useState<string | null>(null)
  const [editingStepGuideOwnerId, setEditingStepGuideOwnerId] = useState<string | null>(null)

  const serverStorage = new ServerConfigStorage()
  const authStorage = new AuthStorage()
  const healthCheckService = new HealthCheckService()

  // Create service instances
  const servicesRef = React.useRef<{
    guide: GuideService
    session: SessionService
    step: StepService
  } | null>(null)

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
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
        }

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

  // Initialize services if we have server URL
  useEffect(() => {
    if (serverUrl && !servicesRef.current) {
      const guideRepository = new GuideRepository(serverUrl)
      const sessionRepository = new SessionRepository(serverUrl)
      const stepRepository = new StepRepository(serverUrl)

      servicesRef.current = {
        guide: new GuideService(guideRepository, stepRepository),
        session: new SessionService(sessionRepository, guideRepository, stepRepository),
        step: new StepService(stepRepository),
      }
    }
  }, [serverUrl])

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
  }

  const handleLogout = async () => {
    try {
      await authStorage.clearAll()
      setHasAuthToken(false)
      setUserId(null)
      setIsAdmin(false)
    } catch (error) {
      ErrorReporter.capture(error, { component: 'AppNavigator', action: 'logout' })
      console.error('Logout failed:', error)
      // Still update state to log out user even if storage clear fails
      setHasAuthToken(false)
      setUserId(null)
      setIsAdmin(false)
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
          const canEdit = Boolean(isAdmin || (userId && guide.isOwnedBy(userId)))
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

  const handleEditStep = async (stepId: string) => {
    try {
      // Load step to get guide ID, then load guide to get ownership
      if (servicesRef.current && editingStepGuideId) {
        const token = await authStorage.getAuthToken()
        if (token) {
          const guide = await servicesRef.current.guide.getGuideById(editingStepGuideId, token)
          if (guide) {
            setEditingStepGuideOwnerId(guide.createdByUserId || null)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load step guide for ownership check:', error)
    }
    setEditingStepId(stepId)
    setStepFormMode('edit')
    setShowStepForm(true)
  }

  const handleStepFormSave = async () => {
    // After saving, refresh the guide detail by triggering a re-render
    setShowStepForm(false)
    setStepFormMode(null)
    setEditingStepId(null)
    setEditingStepGuideOwnerId(null)

    // Reload guide detail by keeping it visible
    // The GuideDetailScreen will reload its steps on re-mount
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
    const authClient = new AuthClient(serverUrl)

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
        adminMode={isAdmin}
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

  if (guideFormMode && serverUrl) {
    const isEditingOthersGuide =
      guideFormMode === 'edit' &&
      isAdmin &&
      userId !== null &&
      editingGuideOwnerId !== null &&
      editingGuideOwnerId !== userId

    return (
      <GuideFormScreen
        mode={guideFormMode}
        {...(editingGuideId && { guideId: editingGuideId })}
        onSave={handleGuideFormSave}
        onCancel={handleGuideFormCancel}
        isAdmin={isAdmin}
        isEditingOthersContent={isEditingOthersGuide}
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
        isAdmin={isAdmin}
      />
    )
  }

  if (showStepForm && stepFormMode && editingStepGuideId) {
    const isEditingOthersStep =
      stepFormMode === 'edit' &&
      isAdmin &&
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
        isAdmin={isAdmin}
        isEditingOthersContent={isEditingOthersStep}
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
        }}
        onEdit={handleGuideDetailEdit}
        onAddStep={handleAddStep}
        onEditStep={handleEditStep}
        isAdmin={isAdmin}
        {...(servicesRef.current && {
          stepService: servicesRef.current.step,
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
        })}
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
      onViewGuideDetail={handleViewGuide}
      isAdmin={isAdmin}
      {...(servicesRef.current && {
        guideService: servicesRef.current.guide,
        sessionService: servicesRef.current.session,
      })}
    />
  )
}

