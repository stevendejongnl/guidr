import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native'
import { colors, spacing, borderRadius, typography } from '../theme'

export interface MenuItem {
  id: string
  label: string
  onPress: () => void
  testID?: string
}

interface MenuProps {
  items: MenuItem[]
  testID?: string
}

export const Menu: React.FC<MenuProps> = ({ items, testID }) => {
  const [visible, setVisible] = useState(false)

  const handleItemPress = (item: MenuItem) => {
    setVisible(false)
    item.onPress()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setVisible(true)}
        accessibilityLabel="Open menu"
        testID={testID ?? 'menu-button'}
      >
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
          testID="menu-overlay"
        >
          <View style={styles.menuContainer}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item)}
                testID={item.testID ?? `menu-item-${item.id}`}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: typography.sizeXl,
    color: colors.textPrimary,
    fontWeight: typography.weightBold,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: spacing.sm + 54, // Below the menu button (safe area is handled by container)
    paddingRight: spacing.xl,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    minWidth: 180,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
})

