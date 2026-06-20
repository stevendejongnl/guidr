import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { GuideService } from '../../domain/services/GuideService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { Guide } from '../../domain/entities/Guide'
import { SafeScreen } from '../components/SafeScreen'
import { GuideCard } from '../components/GuideCard'
import { SearchBar } from '../components/SearchBar'
import { EmptyState } from '../components/EmptyState'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { GuideFavoriteClient } from '../../infrastructure/api/GuideFavoriteClient'
import { createGuideViewModel } from '../viewmodels/GuideViewModel'
import { colors, spacing } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface GuideListScreenProps {
  onCreateGuide: () => void
  onEditGuide: (guideId: string) => void
  onViewGuide: (guideId: string) => void
  onBack: () => void
  // Optional dependency injection
  isAdmin?: boolean
  guideService?: GuideService
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
  guideFavoriteClient?: GuideFavoriteClient
}

export const GuideListScreen: React.FC<GuideListScreenProps> = ({
  onCreateGuide,
  onViewGuide,
  onBack,
  guideService: injectedGuideService,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
  guideFavoriteClient: injectedFavoriteClient,
}) => {
  const [guides, setGuides] = useState<Guide[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'mine' | 'public' | 'favorites'>('mine')
  const [favoriteGuides, setFavoriteGuides] = useState<Guide[]>([])

  const authStorage = injectedAuthStorage || new AuthStorage()
  const serverConfigStorage = injectedServerConfigStorage || new ServerConfigStorage()

  // Initialize services (use injected or create new)
  const servicesRef = React.useRef<{
    guideService: GuideService
  } | null>(null)

  const getServices = (serverUrl: string) => {
    if (servicesRef.current) {
      return servicesRef.current
    }

    if (injectedGuideService) {
      servicesRef.current = {
        guideService: injectedGuideService,
      }
      return servicesRef.current
    }

    const guideRepository = new GuideRepository(serverUrl)
    const stepRepository = new StepRepository(serverUrl)

    servicesRef.current = {
      guideService: new GuideService(guideRepository, stepRepository),
    }
    return servicesRef.current
  }

  const favoriteClientRef = React.useRef<GuideFavoriteClient | null>(
    injectedFavoriteClient || null,
  )

  const loadGuides = useCallback(async (tab: 'mine' | 'public' | 'favorites') => {
    try {
      setError(null)

      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }

      const services = getServices(serverUrl)

      // Initialize favorite client if not injected
      if (!favoriteClientRef.current) {
        favoriteClientRef.current = new GuideFavoriteClient(serverUrl)
      }

      if (tab === 'favorites') {
        const client = favoriteClientRef.current
        const favIds = await client.getFavoriteGuideIds(authToken)

        if (favIds.length > 0) {
          // Load all guides and filter to favorites
          const allGuides = await services.guideService.getAllGuides(authToken)
          const favSet = new Set(favIds)
          setFavoriteGuides(allGuides.filter(g => favSet.has(g.id)))
        } else {
          setFavoriteGuides([])
        }
        setGuides([])
      } else {
        const loadedGuides = tab === 'mine'
          ? await services.guideService.getMyGuides(authToken)
          : await services.guideService.getAllGuides(authToken)
        setGuides(loadedGuides)
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'GuideListScreen', action: 'loadGuides' })
      console.error('Failed to load guides:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guides')
    } finally {
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectedGuideService])

  useEffect(() => {
    loadGuides(filterTab)
  }, [filterTab, loadGuides])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGuides(filterTab)
  }

  const handleFilterTabChange = (tab: 'mine' | 'public' | 'favorites') => {
    setFilterTab(tab)
  }

  // Convert guides to viewmodels
  const guideViewModels = useMemo(() => {
    return guides.map(guide => createGuideViewModel(guide))
  }, [guides])

  // Convert favorite guides to viewmodels
  const favoriteViewModels = useMemo(() => {
    return favoriteGuides.map(guide => createGuideViewModel(guide))
  }, [favoriteGuides])

  // Filter guides based on search query and filter tab
  const filteredGuides = useMemo(() => {
    let filtered = filterTab === 'favorites' ? favoriteViewModels : guideViewModels

    // Apply filter tab (only public needs client-side filtering)
    if (filterTab === 'public') {
      filtered = filtered.filter(guide => guide.isPublic)
    }

    // Apply search query
    if (!searchQuery.trim()) {
      return filtered
    }

    const query = searchQuery.toLowerCase()
    return filtered.filter(
      guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.description?.toLowerCase().includes(query) ||
        guide.guideTypeLabel.toLowerCase().includes(query)
    )
  }, [guideViewModels, favoriteViewModels, searchQuery, filterTab])

  return (
    <SafeScreen testID="guide-list-screen">
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} testID="back-button">
            <Text style={commonStyles.linkText}>← Back</Text>
          </TouchableOpacity>
          <Text style={commonStyles.titleLarge}>Guides</Text>
          <TouchableOpacity onPress={onCreateGuide}>
            <Text style={commonStyles.linkText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={commonStyles.errorText}>{error}</Text>}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search guides..."
            testID="search-guides"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'mine' && styles.filterTabActive,
            ]}
            onPress={() => handleFilterTabChange('mine')}
            testID="filter-tab-mine"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'mine' && styles.filterTabTextActive,
            ]}>
              My Guides
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'public' && styles.filterTabActive,
            ]}
            onPress={() => handleFilterTabChange('public')}
            testID="filter-tab-public"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'public' && styles.filterTabTextActive,
            ]}>
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterTab === 'favorites' && styles.filterTabActive,
            ]}
            onPress={() => handleFilterTabChange('favorites')}
            testID="filter-tab-favorites"
          >
            <Text style={[
              styles.filterTabText,
              filterTab === 'favorites' && styles.filterTabTextActive,
            ]}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>

        {filteredGuides.length === 0 ? (
          <EmptyState
            icon="📚"
            message={searchQuery ? 'No guides match your search' : 'No guides yet'}
            actionLabel={searchQuery ? 'Clear search' : 'Create Guide'}
            onAction={searchQuery ? () => setSearchQuery('') : onCreateGuide}
          />
        ) : (
          <View style={styles.listContainer}>
            {filteredGuides.map(guideViewModel => (
              <View key={guideViewModel.id} style={styles.cardWrapper}>
                <GuideCard
                  guide={guideViewModel}
                  onPress={() => onViewGuide(guideViewModel.id)}
                  {...(filterTab === 'favorites' && { isFavorited: true })}
                  testID={`guide-card-${guideViewModel.id}`}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.textPrimary,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
})
