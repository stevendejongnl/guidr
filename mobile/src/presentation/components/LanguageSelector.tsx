import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native'
import { colors, spacing, borderRadius, typography } from '@guidr/shared/tokens'
import { LANGUAGES, getLanguageLabel } from '../../domain/constants/Languages'

interface LanguageSelectorProps {
  selectedLanguage: string
  onSelectLanguage: (code: string) => void
  disabled?: boolean
  testID?: string
}

interface LanguageItem {
  code: string
  label: string
}

const languageList: LanguageItem[] = Object.entries(LANGUAGES)
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
  testID = 'language-selector',
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [search, setSearch] = useState('')

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return languageList
    const query = search.toLowerCase()
    return languageList.filter(
      item =>
        item.label.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
    )
  }, [search])

  const handleSelect = (code: string) => {
    onSelectLanguage(code)
    setModalVisible(false)
    setSearch('')
  }

  return (
    <View testID={testID}>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        testID={`${testID}-button`}
      >
        <Text style={styles.selectorText}>
          {getLanguageLabel(selectedLanguage)} ({selectedLanguage})
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        testID={`${testID}-modal`}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setSearch('')
              }}
              testID={`${testID}-close`}
            >
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            testID={`${testID}-search`}
            autoCapitalize="none"
          />

          <FlatList
            data={filteredLanguages}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageItem,
                  item.code === selectedLanguage && styles.languageItemSelected,
                ]}
                onPress={() => handleSelect(item.code)}
                testID={`${testID}-item-${item.code}`}
              >
                <Text
                  style={[
                    styles.languageLabel,
                    item.code === selectedLanguage && styles.languageLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.languageCode}>{item.code}</Text>
              </TouchableOpacity>
            )}
            testID={`${testID}-list`}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorText: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  searchInput: {
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageItemSelected: {
    backgroundColor: colors.surfaceLight,
  },
  languageLabel: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },
  languageLabelSelected: {
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  languageCode: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
  },
})
