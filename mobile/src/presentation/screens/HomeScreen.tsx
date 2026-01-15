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
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { colors, spacing, commonStyles } from '../theme'
import {
  HomeScreenMockData,
  MockSession,
  MockGuide,
  MockStats,
} from '../../infrastructure/mocks/HomeScreenMockData'
import { UserDto } from '../../infrastructure/api/dtos/UserDto'

interface HomeScreenProps {
  onLogout: () => void | Promise<void>
  onOpenSettings: () => void
  onOpenProfile: () => void
  onBrowseGuides?: () => void
  onStartSession?: () => void
  onViewSessions?: () => void
  onViewSessionDetail?: (sessionId: string) => void
  onViewGuideDetail?: (guideId: string) => void
  isAdmin: boolean
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onLogout,
  onOpenSettings,
  onOpenProfile,
  onBrowseGuides,
  onStartSession,
  onViewSessions,
  onViewSessionDetail,
  onViewGuideDetail,
  isAdmin,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserDto | null>(null)
  const [stats, setStats] = useState<MockStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<MockSession[]>([])
  const [recommendedGuides, setRecommendedGuides] = useState<MockGuide[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authStorage = new AuthStorage()
  const serverConfigStorage = new ServerConfigStorage()

  const loadData = async () => {
    try {
      setError(null)

      // Load user email
      const email = await authStorage.getUserEmail()
      setUserEmail(email)

      // Get auth token for API calls (will be available from parent component)
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      // Fetch user profile
      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }
      const authClient = new AuthClient(serverUrl)
      const profile = await authClient.getProfile(authToken)
      setUserProfile(profile)

      // Load mock data based on user interests
      const userInterests = profile.interests || []
      const dashboardStats = HomeScreenMockData.getStats(userInterests)
      const recentSess = HomeScreenMockData.getRecentSessions()
      const recommendedGuids = HomeScreenMockData.getRecommendedGuides(userInterests, 3)

      setStats(dashboardStats)
      setRecentSessions(recentSess)
      setRecommendedGuides(recommendedGuids)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'HomeScreen', action: 'loadData' })
      console.error('Failed to load home screen data:', err)
      // Graceful degradation - show what we can
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setRefreshing(false)
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

  const handleStartSession = () => {
    if (onStartSession) {
      onStartSession()
    } else {
      Alert.alert('Start Session', 'Feature coming soon!')
    }
  }

  const handleViewSessions = () => {
    if (onViewSessions) {
      onViewSessions()
    } else {
      Alert.alert('View Sessions', 'Feature coming soon!')
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

        {/* Quick Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsSection}>
            <StatCard icon="🏃" label="Active" value={stats.activeSessions} />
            <StatCard icon="✅" label="Completed" value={stats.completedSessions} />
            <StatCard icon="📚" label="Guides" value={stats.totalGuides} />
            <StatCard
              icon="⭐"
              label="Interests"
              value={stats.favoriteCategories.length}
            />
          </ScrollView>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <QuickActionButton
            icon="🔍"
            label="Browse Guides"
            onPress={handleBrowseGuides}
          />
          <QuickActionButton
            icon="▶️"
            label="Start Session"
            onPress={handleStartSession}
          />
          <QuickActionButton
            icon="📋"
            label="View Sessions"
            onPress={handleViewSessions}
          />
        </View>

        {/* Recent Activity */}
        {recentSessions.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Recent Activity</Text>
            {recentSessions.map(session => (
              <ActivityItem
                key={session.id}
                session={session}
                onResume={() => handleResumeSession(session.id)}
              />
            ))}
            <TouchableOpacity onPress={handleViewSessions}>
              <Text style={commonStyles.linkText}>View All Sessions →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommendations */}
        {recommendedGuides.length > 0 && (
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
})
