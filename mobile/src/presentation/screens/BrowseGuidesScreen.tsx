import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { colors, spacing, typography } from '../theme'
import { SearchBar } from '../components/SearchBar'
import { CategoryChip } from '../components/CategoryChip'
import { GuideCard } from '../components/GuideCard'
import { EmptyState } from '../components/EmptyState'
import { NodeProgressIndicator } from '../components/NodeProgressIndicator'
import { HomeScreenMockData, MockGuide } from '../../infrastructure/mocks/HomeScreenMockData'

interface BrowseGuidesScreenProps {
  onBack: () => void
  onViewGuide: (guideId: string) => void
  testID?: string
}

const CATEGORIES = ['All Guides', 'Baking', 'Cooking', 'Sports & Fitness', 'Arts & Crafts', 'Meditation & Wellness']

export const BrowseGuidesScreen: React.FC<BrowseGuidesScreenProps> = ({
  onBack,
  onViewGuide,
  testID,
}) => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Guides')
  const [guides] = useState<MockGuide[]>(HomeScreenMockData.getRecommendedGuides([], 15))

  // Filter guides based on search and category
  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchText.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchText.toLowerCase())

      const matchesCategory =
        selectedCategory === 'All Guides' || guide.categoryName === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [guides, searchText, selectedCategory])

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID={`${testID}:back`}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Browse Guides</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Node Progress Indicator - visual flourish */}
      <View style={styles.progressIndicatorContainer}>
        <NodeProgressIndicator currentStep={3} totalSteps={5} variant="compact" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search guides..."
            testID={`${testID}:search`}
          />
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySection}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          {CATEGORIES.map(category => (
            <CategoryChip
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              testID={`${testID}:chip-${category}`}
            />
          ))}
        </ScrollView>

        {/* Popular Guides Section */}
        <View style={styles.guidesSection}>
          {filteredGuides.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All Guides'
                  ? 'Popular Guides'
                  : `${selectedCategory} Guides`}
              </Text>
              {filteredGuides.map(guide => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  onPress={() => onViewGuide(guide.id)}
                  testID={`${testID}:card-${guide.id}`}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                icon="📭"
                message={`No guides found for "${searchText}" in ${selectedCategory}`}
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchText('')
                  setSelectedCategory('All Guides')
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  progressIndicatorContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  categorySection: {
    paddingLeft: spacing.xl,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryChipsContainer: {
    paddingRight: spacing.xl,
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
