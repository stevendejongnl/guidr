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
import { CategoryListScreen } from '../screens/CategoryListScreen'
import { CategoryFormScreen } from '../screens/CategoryFormScreen'
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
import { CategoryService } from '../../domain/services/CategoryService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { CategoryRepository } from '../../infrastructure/repositories/CategoryRepository'
import { commonStyles, colors } from '../theme'

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
  const [showCategoryList, setShowCategoryList] = useState(false)
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [selectedCategoryParentId, setSelectedCategoryParentId] = useState<string | null>(null)
  const [showGuideList, setShowGuideList] = useState(false)
  const [guideFormMode, setGuideFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null)
  const [selectedGuideCategoryId, setSelectedGuideCategoryId] = useState<string | null>(null)
  const [showBrowseGuides, setShowBrowseGuides] = useState(false)
  const [showGuideDetail, setShowGuideDetail] = useState(false)
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)
  const [stepFormMode, setStepFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepGuideId, setEditingStepGuideId] = useState<string | null>(null)
  const [newStepOrder, setNewStepOrder] = useState(0)

  const serverStorage = new ServerConfigStorage()
  const authStorage = new AuthStorage()
  const healthCheckService = new HealthCheckService()

  // Create service instances
  const servicesRef = React.useRef<{
    guide: GuideService
    session: SessionService
    category: CategoryService
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

        // Load user email and admin status if authenticated
        if (hasToken) {
          const email = await authStorage.getUserEmail()
          setUserEmail(email || '')

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
      const categoryRepository = new CategoryRepository(serverUrl)

      servicesRef.current = {
        guide: new GuideService(guideRepository, stepRepository),
        session: new SessionService(sessionRepository, guideRepository, stepRepository),
        category: new CategoryService(categoryRepository),
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

    const adminStatus = await authStorage.getUserIsAdmin()
    setIsAdmin(adminStatus)
  }

  const handleLogout = async () => {
    try {
      await authStorage.clearAll()
      setHasAuthToken(false)
      setIsAdmin(false)
    } catch (error) {
      ErrorReporter.capture(error, { component: 'AppNavigator', action: 'logout' })
      console.error('Logout failed:', error)
      // Still update state to log out user even if storage clear fails
      setHasAuthToken(false)
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

  const handleBrowseCategories = () => {
    setShowCategoryList(true)
    setEditingCategoryId(null)
    setCategoryFormMode(null)
  }

  const handleCreateCategory = () => {
    setCategoryFormMode('create')
    setEditingCategoryId(null)
    setSelectedCategoryParentId(null)
  }

  const handleEditCategory = (categoryId: string) => {
    setEditingCategoryId(categoryId)
    setCategoryFormMode('edit')
  }

  const handleCategoryFormSave = () => {
    setCategoryFormMode(null)
    setEditingCategoryId(null)
  }

  const handleCategoryFormCancel = () => {
    setCategoryFormMode(null)
    setEditingCategoryId(null)
  }

  const handleCategoryListBack = () => {
    setShowCategoryList(false)
  }

  const handleManageGuides = () => {
    setShowGuideList(true)
  }

  const handleCreateGuide = (categoryId?: string) => {
    setSelectedGuideCategoryId(categoryId || null)
    setGuideFormMode('create')
  }

  const handleEditGuide = (guideId: string) => {
    setEditingGuideId(guideId)
    setGuideFormMode('edit')
  }

  const handleGuideFormSave = () => {
    setGuideFormMode(null)
    setEditingGuideId(null)
    setSelectedGuideCategoryId(null)
    setShowGuideList(true)
  }

  const handleGuideFormCancel = () => {
    setGuideFormMode(null)
    setEditingGuideId(null)
    setSelectedGuideCategoryId(null)
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

  const handleAddStep = (guideId: string, stepCount: number) => {
    setEditingStepGuideId(guideId)
    setEditingStepId(null)
    setNewStepOrder(stepCount)
    setStepFormMode('create')
    setShowStepForm(true)
  }

  const handleEditStep = (stepId: string) => {
    setEditingStepId(stepId)
    setStepFormMode('edit')
    setShowStepForm(true)
  }

  const handleStepFormSave = async () => {
    // After saving, refresh the guide detail by triggering a re-render
    setShowStepForm(false)
    setStepFormMode(null)
    setEditingStepId(null)

    // Reload guide detail by keeping it visible
    // The GuideDetailScreen will reload its steps on re-mount
  }

  const handleStepFormCancel = () => {
    setShowStepForm(false)
    setStepFormMode(null)
    setEditingStepId(null)
    setEditingStepGuideId(null)
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
    return (
      <GuideFormScreen
        mode={guideFormMode}
        {...(editingGuideId && { guideId: editingGuideId })}
        {...(selectedGuideCategoryId && { categoryId: selectedGuideCategoryId })}
        onSave={handleGuideFormSave}
        onCancel={handleGuideFormCancel}
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
      />
    )
  }

  if (categoryFormMode && serverUrl) {
    return (
      <CategoryFormScreen
        mode={categoryFormMode}
        {...(editingCategoryId && { categoryId: editingCategoryId })}
        parentId={selectedCategoryParentId}
        onSave={handleCategoryFormSave}
        onCancel={handleCategoryFormCancel}
      />
    )
  }

  if (showStepForm && stepFormMode && editingStepGuideId) {
    return (
      <StepFormScreen
        mode={stepFormMode}
        guideId={editingStepGuideId}
        {...(editingStepId && { stepId: editingStepId })}
        {...(stepFormMode === 'create' && { order: newStepOrder })}
        onSave={handleStepFormSave}
        onCancel={handleStepFormCancel}
      />
    )
  }

  if (showGuideDetail && selectedGuideId) {
    return (
      <GuideDetailScreen
        guideId={selectedGuideId}
        onBack={() => {
          setShowGuideDetail(false)
          setSelectedGuideId(null)
        }}
        onEdit={handleGuideDetailEdit}
        onAddStep={handleAddStep}
        onEditStep={handleEditStep}
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
          categoryService: servicesRef.current.category,
        })}
      />
    )
  }

  if (showCategoryList) {
    return (
      <CategoryListScreen
        onCreateCategory={handleCreateCategory}
        onEditCategory={handleEditCategory}
        onBack={handleCategoryListBack}
      />
    )
  }

  return (
    <HomeScreen
      onLogout={handleLogout}
      onOpenSettings={() => setShowSettingsScreen(true)}
      onOpenProfile={() => setShowProfileScreen(true)}
      onBrowseGuides={handleBrowseGuides}
      {...(isAdmin && { onManageGuides: handleManageGuides })}
      onBrowseCategories={handleBrowseCategories}
      onViewSessionDetail={handleViewSessionDetail}
      isAdmin={isAdmin}
      {...(servicesRef.current && {
        guideService: servicesRef.current.guide,
        sessionService: servicesRef.current.session,
        categoryService: servicesRef.current.category,
      })}
    />
  )
}

