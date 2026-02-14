import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { colors, spacing, borderRadius, typography } from '@guidr/shared/tokens'
import { LanguageSelector } from './LanguageSelector'

interface CopyToLanguageModalProps {
  visible: boolean
  onClose: () => void
  onCopy: (language: string) => void
  onTranslate: (language: string) => void
  isBeta: boolean
  currentLanguage: string
  loading?: boolean
  testID?: string
}

export const CopyToLanguageModal: React.FC<CopyToLanguageModalProps> = ({
  visible,
  onClose,
  onCopy,
  onTranslate,
  isBeta,
  currentLanguage,
  loading = false,
  testID = 'copy-to-language-modal',
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const isSameLanguage = selectedLanguage === currentLanguage

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      testID={testID}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Copy to Language</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              testID={`${testID}:close`}
            >
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Target Language</Text>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              disabled={loading}
              testID={`${testID}:language-selector`}
            />

            {isSameLanguage && (
              <Text style={styles.warning} testID={`${testID}:same-language-warning`}>
                Select a different language than the source guide.
              </Text>
            )}

            {loading && (
              <View style={styles.loadingContainer} testID={`${testID}:loading`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.copyButton, (isSameLanguage || loading) && styles.buttonDisabled]}
              onPress={() => onCopy(selectedLanguage)}
              disabled={isSameLanguage || loading}
              testID={`${testID}:copy-button`}
            >
              <Text style={[styles.buttonText, (isSameLanguage || loading) && styles.buttonTextDisabled]}>
                Copy
              </Text>
            </TouchableOpacity>

            {isBeta && (
              <TouchableOpacity
                style={[styles.button, styles.translateButton, (isSameLanguage || loading) && styles.buttonDisabled]}
                onPress={() => onTranslate(selectedLanguage)}
                disabled={isSameLanguage || loading}
                testID={`${testID}:translate-button`}
              >
                <Text style={[styles.buttonText, styles.translateButtonText, (isSameLanguage || loading) && styles.buttonTextDisabled]}>
                  Translate with AI
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.xxl,
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
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  warning: {
    fontSize: typography.sizeSm,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: colors.primary,
  },
  translateButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
  translateButtonText: {
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
})
