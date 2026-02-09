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
import { Menu, MenuItem } from '../components/Menu'
import { StatCard } from '../components/StatCard'
import { QuickActionButton } from '../components/QuickActionButton'
import { ActivityItem } from '../components/ActivityItem'
import { GuideCard } from '../components/GuideCard'
import { AuthenticationError } from '../../common/ApiErrorUtils'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { UserDto } from '../../infrastructure/api/dtos/UserDto'
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
  onViewGuideDetail?: (guideId: string) => void
  isAdmin: boolean
  // Optional dependencies (for testing/DI)
  guideService?: GuideService
  sessionService?: SessionService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
  authClient?: AuthClient
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onLogout,
  onOpenSettings,
  onOpenProfile,
  onBrowseGuides,
  onManageGuides,
  onViewSessionDetail,
  onViewGuideDetail,
  isAdmin,
  guideService: injectedGuideService,
  sessionService: injectedSessionService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
  authClient: injectedAuthClient,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserDto | null>(null)
  const [activeSessions, setActiveSessions] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
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

  const loadData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Load user email
      const email = await authStorage.getUserEmail()
      setUserEmail(email)

      // Get auth token for API calls
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      // Fetch user profile
      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }
      const authClient = injectedAuthClient || new AuthClient(serverUrl)
      const profile = await authClient.getProfile(authToken)
      setUserProfile(profile)

      // Get services (either injected or create new)
      const services = getServices(serverUrl)

      // Load all guides and sessions in parallel
      const [allGuides, allSessions] = await Promise.all([
        services.guideService.getAllGuides(authToken),
        services.sessionService.getAllSessions(authToken),
      ])

      // Calculate stats
      const activeCount = allSessions.filter(
        s => s.status === DomainSessionStatus.InProgress || s.status === DomainSessionStatus.Paused,
      ).length
      const completedCount = allSessions.filter(s => s.status === DomainSessionStatus.Completed).length

      setActiveSessions(activeCount)
      setCompletedSessions(completedCount)

      // Get recommended guides filtered by user interests
      const userInterests = profile.interests || []
      const recommendedList = getRecommendedGuides(allGuides, userInterests, 3)

      const recommendedViewModels: GuideViewModel[] = recommendedList.map(guide =>
        createGuideViewModel(guide)
      )

      setRecommendedGuides(recommendedViewModels)

      // Get featured guides (public and highlighted)
      const featuredList = allGuides
        .filter(guide => guide.isPublic && guide.isHighlighted)
        .slice(0, 3)

      const featuredViewModels: GuideViewModel[] = featuredList.map(guide =>
        createGuideViewModel(guide)
      )

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
    await loadData()
  }

  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleBrowseGuides = () => {
    if (onBrowseGuides) {
      onBrowseGuides()
    } else {
      Alert.alert('Browse Guides', 'Feature coming soon!')
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
          <Menu items={menuItems} testID="home-menu" />
        </View>

        {error && <Text style={commonStyles.errorText}>{error}</Text>}

        {!isLoading && (
          <>
            {/* Quick Stats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsSection}>
              <StatCard icon="🏃" label="Active" value={activeSessions} />
              <StatCard icon="✅" label="Done" value={completedSessions} />
              <StatCard icon="📚" label="Guides" value={recommendedGuides.length} />
            </ScrollView>
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <QuickActionButton
            icon="🔍"
            label="Browse Guides"
            onPress={handleBrowseGuides}
          />
          <QuickActionButton
            icon="📝"
            label="My Guides"
            onPress={handleManageGuides}
          />
        </View>

        {/* Featured Guides */}
        {!isLoading && featuredGuides.length > 0 && (
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
          </View>
        )}

        {/* Recommendations */}
        {!isLoading && recommendedGuides.length > 0 && (
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
  statsSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
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
