import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { Menu, MenuItem, MenuToggleItem } from '../components/Menu'

import { QuickActionButton } from '../components/QuickActionButton'
import { ActivityItem } from '../components/ActivityItem'
import { GuideCard } from '../components/GuideCard'
import { AuthenticationError } from '../../common/ApiErrorUtils'
import { StepTimerClient } from '../../infrastructure/api/StepTimerClient'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { UserDto } from '../../infrastructure/api/dtos/UserDto'
import { ActiveTimerCard } from '../components/ActiveTimerCard'
import { useActiveTimers } from '../hooks/useActiveTimers'
import { useSyncConnection } from '../hooks/useSyncConnection'
import { GuideViewModel, createGuideViewModel } from '../viewmodels/GuideViewModel'
import { GuideService } from '../../domain/services/GuideService'
import { SessionService } from '../../domain/services/SessionService'
import { SessionStatus as DomainSessionStatus } from '../../domain/entities/Session'
import { Guide } from '../../domain/entities/Guide'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { SessionRepository } from '../../infrastructure/repositories/SessionRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'

// Mock session status enum for ActivityItem compatibility
enum ActivityItemSessionStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// Convert domain session status to activity item session status
const convertSessionStatus = (status: DomainSessionStatus): ActivityItemSessionStatus => {
  switch (status) {
    case DomainSessionStatus.NotStarted:
      return ActivityItemSessionStatus.NotStarted
    case DomainSessionStatus.InProgress:
      return ActivityItemSessionStatus.InProgress
    case DomainSessionStatus.Paused:
      return ActivityItemSessionStatus.Paused
    case DomainSessionStatus.Completed:
      return ActivityItemSessionStatus.Completed
    case DomainSessionStatus.Cancelled:
      return ActivityItemSessionStatus.Cancelled
  }
}

// Helper function to get recommended guides
const getRecommendedGuides = (guides: Guide[], userInterests: string[], limit: number): Guide[] => {
  if (!userInterests || userInterests.length === 0) {
    return guides.slice(0, limit)
  }
  // For now, return first N guides that match interests
  // In a real implementation, the backend would filter by interests
  return guides.slice(0, limit)
}

interface HomeScreenProps {
  onLogout: () => void | Promise<void>
  onOpenSettings: () => void
  onOpenProfile: () => void
  onBrowseGuides?: () => void
  onManageGuides?: () => void
  onViewSessionDetail?: (sessionId: string) => void
  onViewSessionHistory?: () => void
  onViewGuideDetail?: (guideId: string) => void
  isAdmin: boolean
  adminModeActive?: boolean
  onToggleAdminMode?: (value: boolean) => void
  // Optional dependencies (for testing/DI)
  guideService?: GuideService
  sessionService?: SessionService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
  authClient?: AuthClient
  stepTimerClient?: StepTimerClient
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onLogout,
  onOpenSettings,
  onOpenProfile,
  onBrowseGuides,
  onManageGuides,
  onViewSessionDetail,
  onViewSessionHistory,
  onViewGuideDetail,
  isAdmin,
  adminModeActive,
  onToggleAdminMode,
  guideService: injectedGuideService,
  sessionService: injectedSessionService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
  authClient: injectedAuthClient,
  stepTimerClient: injectedStepTimerClient,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserDto | null>(null)
  const [recommendedGuides, setRecommendedGuides] = useState<GuideViewModel[]>([])
  const [featuredGuides, setFeaturedGuides] = useState<GuideViewModel[]>([])
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string
    guideId: string
    guideTitle: string
    status: ActivityItemSessionStatus
    startedAt: Date
    currentStepTitle?: string
    progress: number
  }>>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [stepTimerClient, setStepTimerClient] = useState<StepTimerClient | null>(
    injectedStepTimerClient || null,
  )

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

  // Initialize services (use injected or create new)
  const servicesRef = React.useRef<{
    guideService: GuideService
    sessionService: SessionService
  } | null>(null)

  const getServices = (serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedGuideService && injectedSessionService) {
      servicesRef.current = {
        guideService: injectedGuideService,
        sessionService: injectedSessionService,
      }
      return servicesRef.current
    }

    const guideRepository = new GuideRepository(serverUrl)
    const sessionRepository = new SessionRepository(serverUrl)
    const stepRepository = new StepRepository(serverUrl)

    servicesRef.current = {
      guideService: new GuideService(guideRepository, stepRepository),
      sessionService: new SessionService(sessionRepository, guideRepository, stepRepository),
    }
    return servicesRef.current
  }

  const {
    activeTimers,
    refresh: refreshActiveTimers,
  } = useActiveTimers(authToken, stepTimerClient)

  // WebSocket sync for cross-device timer/session updates
  useSyncConnection({
    serverUrl,
    authToken,
    onReconnect: refreshActiveTimers,
  })

  const loadData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Load user email
      const email = await authStorage.getUserEmail()
      setUserEmail(email)

      // Get auth token for API calls
      const token = await authStorage.getAuthToken()
      if (!token) {
        throw new Error('No auth token found')
      }
      setAuthToken(token)

      // Fetch user profile
      const loadedServerUrl = await serverConfigStorage.getServerUrl()
      if (!loadedServerUrl) {
        throw new Error('No server URL configured')
      }
      setServerUrl(loadedServerUrl)

      // Initialize StepTimerClient if not injected
      if (!injectedStepTimerClient) {
        setStepTimerClient(new StepTimerClient(loadedServerUrl))
      }

      const authClient = injectedAuthClient || new AuthClient(loadedServerUrl)
      const profile = await authClient.getProfile(token)
      setUserProfile(profile)

      // Get services (either injected or create new)
      const services = getServices(loadedServerUrl)

      // Load all guides, highlighted guides, and sessions in parallel
      const [allGuides, highlightedGuides, allSessions] = await Promise.all([
        services.guideService.getAllGuides(token),
        services.guideService.getHighlightedGuides(token),
        services.sessionService.getAllSessions(token),
      ])

      // Get recommended guides filtered by user interests
      const userInterests = profile.interests || []
      const recommendedList = getRecommendedGuides(allGuides, userInterests, 3)

      const recommendedViewModels: GuideViewModel[] = recommendedList.map(guide =>
        createGuideViewModel(guide)
      )

      setRecommendedGuides(recommendedViewModels)

      // Get featured guides from dedicated highlighted endpoint (DB-level filter)
      const featuredViewModels: GuideViewModel[] = highlightedGuides
        .slice(0, 3)
        .map(guide => createGuideViewModel(guide))

      setFeaturedGuides(featuredViewModels)

      // Convert real sessions to ActivityItem-compatible format
      const recentSessionsList = allSessions.slice(0, 5).map(session => {
        const guide = allGuides.find(g => g.id === session.guideId)
        return {
          id: session.id,
          guideId: session.guideId,
          guideTitle: guide?.title || 'Unknown Guide',
          status: convertSessionStatus(session.status),
          startedAt: session.createdAt,
          progress: 0,
        }
      })

      setRecentSessions(recentSessionsList)
    } catch (err) {
      if (err instanceof AuthenticationError) {
        const refreshToken = await authStorage.getRefreshToken()
        if (refreshToken) {
          try {
            const serverUrl = await serverConfigStorage.getServerUrl()
            if (serverUrl) {
              const authClient = injectedAuthClient || new AuthClient(serverUrl)
              const response = await authClient.refreshToken(refreshToken)
              await authStorage.setAuthToken(response.accessToken)
              await authStorage.setRefreshToken(response.refreshToken)
              await loadData()
              return
            }
          } catch {
            // Refresh failed — fall through to logout
          }
        }
        await onLogout()
        return
      }
      ErrorReporter.capture(err, { component: 'HomeScreen', action: 'loadData' })
      console.error('Failed to load home screen data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadData(), refreshActiveTimers()])
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await onLogout()
          } catch (err) {
            console.error('Logout error:', err)
          }
        },
      },
    ])
  }

  const handleBrowseGuides = () => {
    if (onBrowseGuides) {
      onBrowseGuides()
    } else {
      Alert.alert('Discover Guides', 'Feature coming soon!')
    }
  }

  const handleManageGuides = () => {
    if (onManageGuides) {
      onManageGuides()
    } else {
      Alert.alert('Manage Guides', 'Feature coming soon!')
    }
  }

  const handleResumeSession = (sessionId: string) => {
    if (onViewSessionDetail) {
      onViewSessionDetail(sessionId)
    } else {
      const session = recentSessions.find(s => s.id === sessionId)
      Alert.alert(
        'Resume Session',
        `Resume "${session?.guideTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resume', onPress: () => {} },
        ]
      )
    }
  }

  const handleViewGuide = (guideId: string) => {
    if (onViewGuideDetail) {
      onViewGuideDetail(guideId)
    } else {
      const guide = recommendedGuides.find(g => g.id === guideId)
      Alert.alert(
        'View Guide',
        `Open "${guide?.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => {} },
        ]
      )
    }
  }

  const menuItems: MenuItem[] = [
    { id: 'profile', label: 'Profile', onPress: onOpenProfile },
    { id: 'settings', label: 'Settings', onPress: onOpenSettings },
    { id: 'logout', label: 'Logout', onPress: handleLogout },
  ]

  const menuToggleItems: MenuToggleItem[] = isAdmin && onToggleAdminMode
    ? [{
      id: 'admin-mode',
      label: 'Admin Mode',
      value: adminModeActive ?? false,
      onValueChange: onToggleAdminMode,
    }]
    : []

  const displayName = userProfile?.name || userEmail || 'User'

  return (
    <SafeScreen>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={commonStyles.titleLarge}>Guidr</Text>
            <Text style={commonStyles.subtitle}>Welcome, {displayName}!</Text>
          </View>
          <Menu items={menuItems} toggleItems={menuToggleItems} testID="home-menu" />
        </View>

        {error && <Text style={commonStyles.errorText}>{error}</Text>}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <QuickActionButton
            icon="🔍"
            label="Discover"
            onPress={handleBrowseGuides}
          />
          {!adminModeActive && (
            <QuickActionButton
              icon="📝"
              label="My Guides"
              onPress={handleManageGuides}
            />
          )}
        </View>

        {/* Active Timers (hidden in admin mode) */}
        {!isLoading && !adminModeActive && activeTimers.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Active Timers</Text>
            {activeTimers.map(timer => (
              <ActiveTimerCard
                key={timer.timerId}
                timer={timer}
                onPress={() => handleViewGuide(timer.guideId)}
              />
            ))}
          </View>
        )}

        {/* Featured Guides (hidden in admin mode) */}
        {!isLoading && !adminModeActive && featuredGuides.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>✨ Featured Guides</Text>
            {featuredGuides.map(guide => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onPress={() => handleViewGuide(guide.id)}
              />
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {!isLoading && recentSessions.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Recent Activity</Text>
            {recentSessions.map(session => (
              <ActivityItem
                key={session.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session={session as any}
                onResume={() => handleResumeSession(session.id)}
              />
            ))}
            {onViewSessionHistory && (
              <TouchableOpacity onPress={onViewSessionHistory}>
                <Text style={commonStyles.linkText}>View All Sessions →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recommendations (hidden in admin mode) */}
        {!isLoading && !adminModeActive && recommendedGuides.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Recommended for You</Text>
            {recommendedGuides.map(guide => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onPress={() => handleViewGuide(guide.id)}
              />
            ))}
            <TouchableOpacity onPress={handleBrowseGuides}>
              <Text style={commonStyles.linkText}>Browse All Guides →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <VersionDisplay isVisible={isAdmin} />
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  titleSection: {
    flex: 1,
  },
  actionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
})
