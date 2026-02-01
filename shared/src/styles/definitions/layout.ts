/**
 * Platform-agnostic layout style definitions
 */

import { colors, spacing } from '../../tokens'

export const layoutDefinitions = {
  // Screen/Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  containerTop: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  contentCentered: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  // Flex helpers
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Spacing helpers
  gap: {
    gap: spacing.md,
  },
  gapSmall: {
    gap: spacing.sm,
  },
  gapLarge: {
    gap: spacing.lg,
  },

  // Loading/Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.lg,
  },
}
