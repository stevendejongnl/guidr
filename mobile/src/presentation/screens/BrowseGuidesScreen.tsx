import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { colors, spacing, typography, borderRadius, componentDefaults } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import { SafeScreen } from '../components/SafeScreen'
import { ScreenHeader } from '../components/ScreenHeader'
import { SearchBar } from '../components/SearchBar'
import { GuideCard } from '../components/GuideCard'
import { EmptyState } from '../components/EmptyState'
import { NodeProgressIndicator } from '../components/NodeProgressIndicator'
import { ContentLoader } from '../components/ContentLoader'
import { Skeleton, SkeletonCard, SkeletonList } from '../components/Skeleton'
import { GuideViewModel, createGuideViewModel } from '../viewmodels/GuideViewModel'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { GuideService } from '../../domain/services/GuideService'
import { GuideRepository } from '../../infrastructure/repositories/GuideRepository'
import { StepRepository } from '../../infrastructure/repositories/StepRepository'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { GuideFavoriteClient } from '../../infrastructure/api/GuideFavoriteClient'
import { ALL_GUIDE_TYPES, GUIDE_TYPE_LABELS, type GuideType } from '../../domain/constants/GuideTypes'

interface BrowseGuidesScreenProps {
  onBack: () => void
  onViewGuide: (guideId: string) => void
  testID?: string
  // Optional dependencies (for testing/DI)
  guideService?: GuideService
  guideFavoriteClient?: GuideFavoriteClient
  authStorage?: AuthStorage
  serverConfigStorage?: ServerConfigStorage
}

export const BrowseGuidesScreen: React.FC<BrowseGuidesScreenProps> = ({
  onBack,
  onViewGuide,
  testID,
  guideService: injectedGuideService,
  guideFavoriteClient: injectedFavoriteClient,
  authStorage: injectedAuthStorage,
  serverConfigStorage: injectedServerConfigStorage,
}) => {
  const [searchText, setSearchText] = useState('')
  const [selectedType, setSelectedType] = useState<GuideType | 'all'>('all')
  const [guides, setGuides] = useState<GuideViewModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const authStorage = React.useMemo(
    () => injectedAuthStorage ?? new AuthStorage(),
    [injectedAuthStorage],
  )
  const serverConfigStorage = React.useMemo(
    () => injectedServerConfigStorage ?? new ServerConfigStorage(),
    [injectedServerConfigStorage],
  )

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

  const loadData = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Get auth token for API calls
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        throw new Error('No auth token found')
      }

      // Load current user ID
      const userId = await authStorage.getUserId()
      setCurrentUserId(userId)

      // Fetch server URL
      const serverUrl = await serverConfigStorage.getServerUrl()
      if (!serverUrl) {
        throw new Error('No server URL configured')
      }

      // Initialize favorite client if not injected
      if (!favoriteClientRef.current) {
        favoriteClientRef.current = new GuideFavoriteClient(serverUrl)
      }

      // Get services
      const services = getServices(serverUrl)

      // Load guides and favorites in parallel
      const [allGuides, favIds] = await Promise.all([
        services.guideService.getAllGuides(authToken),
        favoriteClientRef.current.getFavoriteGuideIds(authToken).catch(() => []),
      ])

      setFavoriteIds(new Set(favIds))

      // Convert guides to view models
      const guideViewModels: GuideViewModel[] = allGuides.map(guide =>
        createGuideViewModel(guide)
      )

      setGuides(guideViewModels)
    } catch (err) {
      ErrorReporter.capture(err, { component: 'BrowseGuidesScreen', action: 'loadData' })
      console.error('Failed to load guides:', err)
      setError(err instanceof Error ? err.message : 'Failed to load guides')
    } finally {
      setRefreshing(false)
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (guideId: string) => {
    const client = favoriteClientRef.current
    if (!client) return

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) return

      const isFav = favoriteIds.has(guideId)
      if (isFav) {
        await client.unfavoriteGuide(guideId, authToken)
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(guideId)
          return next
        })
      } else {
        await client.favoriteGuide(guideId, authToken)
        setFavoriteIds(prev => new Set(prev).add(guideId))
      }
    } catch (err) {
      ErrorReporter.capture(err, { component: 'BrowseGuidesScreen', action: 'toggleFavorite' })
      console.error('Failed to toggle favorite:', err)
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

  // Filter guides based on search and type
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (guide.description && guide.description.toLowerCase().includes(searchText.toLowerCase()))

      const matchesType =
        selectedType === 'all' || guide.guideType === selectedType

      return matchesSearch && matchesType
    })
  }, [guides, searchText, selectedType])

  const selectedTypeLabel = selectedType === 'all'
    ? 'All Guides'
    : GUIDE_TYPE_LABELS[selectedType]

  const browseSkeleton = (
    <>
      <View style={styles.searchSection}>
        <Skeleton height={44} radius={borderRadius.md} />
      </View>
      <View style={styles.skeletonChipsRow}>
        {[0, 1, 2, 3].map(index => (
          <Skeleton
            key={index}
            width={90}
            height={componentDefaults.chipHeight}
            radius={borderRadius.sm}
          />
        ))}
      </View>
      <View style={styles.guidesSection}>
        <SkeletonList count={5} renderItem={index => <SkeletonCard key={index} />} />
      </View>
    </>
  )

  return (
    <SafeScreen {...(testID && { testID })}>
      <ScreenHeader
        onBack={onBack}
        title="Discover Guides"
        backTestID={`${testID}:back`}
      />

      {/* Node Progress Indicator - visual flourish */}
      <View style={styles.progressIndicatorContainer}>
        <NodeProgressIndicator currentStep={3} totalSteps={5} variant="compact" />
      </View>

      {error && <Text style={commonStyles.errorText}>{error}</Text>}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <ContentLoader isLoading={isLoading && !refreshing} skeleton={browseSkeleton}>
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search guides..."
              testID={`${testID}:search`}
            />
          </View>

          {/* Type Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterSection}
            contentContainerStyle={styles.filterChipsContainer}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'all' && styles.filterChipSelected]}
              onPress={() => setSelectedType('all')}
              testID={`${testID}:chip-All Guides`}
            >
              <Text style={[styles.filterChipLabel, selectedType === 'all' && styles.filterChipLabelSelected]}>
                All Guides
              </Text>
            </TouchableOpacity>
            {ALL_GUIDE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, selectedType === type && styles.filterChipSelected]}
                onPress={() => setSelectedType(type)}
                testID={`${testID}:chip-${GUIDE_TYPE_LABELS[type]}`}
              >
                <Text style={[styles.filterChipLabel, selectedType === type && styles.filterChipLabelSelected]}>
                  {GUIDE_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Popular Guides Section */}
          <View style={styles.guidesSection}>
            {filteredGuides.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  {selectedType === 'all'
                    ? 'Popular Guides'
                    : `${selectedTypeLabel} Guides`}
                </Text>
                {filteredGuides.map(guide => {
                  const owned = Boolean(currentUserId && guide.createdByUserId === currentUserId)
                  return (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      onPress={() => onViewGuide(guide.id)}
                      isOwned={owned}
                      isFavorited={favoriteIds.has(guide.id)}
                      {...(!owned && { onToggleFavorite: () => handleToggleFavorite(guide.id) })}
                      testID={`${testID}:card-${guide.id}`}
                    />
                  )
                })}
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  icon="📭"
                  message={`No guides found for "${searchText}" in ${selectedTypeLabel}`}
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setSearchText('')
                    setSelectedType('all')
                  }}
                />
              </View>
            )}
          </View>
        </ContentLoader>
      </ScrollView>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  progressIndicatorContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skeletonChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  filterSection: {
    paddingLeft: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChipsContainer: {
    paddingRight: spacing.xl,
  },
  filterChip: {
    height: componentDefaults.chipHeight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  filterChipSelected: {
    backgroundColor: colors.buttonPrimary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  filterChipLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.textSecondary,
  },
  filterChipLabelSelected: {
    color: colors.textPrimary,
  },
  guidesSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyStateContainer: {
    paddingVertical: spacing.xxxl,
  },
})
