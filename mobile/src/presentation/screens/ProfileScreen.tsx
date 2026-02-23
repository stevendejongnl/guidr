import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { AuthClient } from '@infrastructure/api/AuthClient'
import { AuthStorage } from '@infrastructure/storage/AuthStorage'
import { SafeScreen } from '../components/SafeScreen'
import { colors, spacing, typography, borderRadius } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'
import {
  INTEREST_CATEGORIES,
  type InterestCategory,
} from '@domain/constants/InterestCategories'
import { LANGUAGES } from '@domain/constants/Languages'

interface ProfileScreenProps {
  onBack: () => void
  authClient: AuthClient
  authStorage: AuthStorage
  userEmail: string
}

export function ProfileScreen({
  onBack,
  authClient,
  authStorage,
  userEmail,
}: ProfileScreenProps) {
  // Profile state
  const [name, setName] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en'])

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const authToken = await authStorage.getAuthToken()
        if (!authToken) {
          return
        }

        const profile = await authClient.getProfile(authToken)
        setName(profile.name || '')
        setSelectedInterests(profile.interests || [])
        setSelectedLanguages(profile.preferredLanguages || ['en'])
      } catch (err) {
        // Silently fail - user can still manually enter their profile
        console.error('Failed to fetch profile:', err)
      }
    }

    loadProfile()
  }, [authClient, authStorage])

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId],
    )
  }

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages(prev =>
      prev.includes(langCode)
        ? prev.filter(code => code !== langCode)
        : [...prev, langCode],
    )
  }

  // Common languages shown as checkboxes (subset for UX)
  const COMMON_LANGUAGES = ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh']

  const handleUpdateProfile = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        setError('Not authenticated')
        return
      }

      await authClient.updateProfile(
        name.trim() || null,
        selectedInterests,
        authToken,
        selectedLanguages,
      )

      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    setError('')
    setSuccess('')

    if (!newEmail.trim()) {
      setError('Email cannot be empty')
      return
    }

    if (!emailPassword.trim()) {
      setError('Password is required to change email')
      return
    }

    setLoading(true)

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        setError('Not authenticated')
        return
      }

      const response = await authClient.changeEmail(
        newEmail.trim(),
        emailPassword,
        authToken,
      )

      // Update stored token and email
      await authStorage.setAuthToken(response.accessToken)

      setSuccess('Email changed successfully')
      setShowEmailForm(false)
      setNewEmail('')
      setEmailPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email change failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')

    if (!oldPassword.trim()) {
      setError('Current password cannot be empty')
      return
    }

    if (!newPassword.trim()) {
      setError('New password cannot be empty')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const authToken = await authStorage.getAuthToken()
      if (!authToken) {
        setError('Not authenticated')
        return
      }

      await authClient.changePassword(oldPassword, newPassword, authToken)

      setSuccess('Password changed successfully')
      setShowPasswordForm(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.prompt(
              'Confirm Password',
              'Enter your password to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (password: string | undefined) => {
                    if (!password || !password.trim()) {
                      setError('Password is required')
                      return
                    }

                    setLoading(true)
                    setError('')
                    setSuccess('')

                    try {
                      const authToken = await authStorage.getAuthToken()
                      if (!authToken) {
                        setError('Not authenticated')
                        return
                      }

                      await authClient.deleteAccount(password, authToken)

                      // Clear auth storage and go back
                      await authStorage.clearAll()
                      onBack()
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : 'Account deletion failed',
                      )
                    } finally {
                      setLoading(false)
                    }
                  },
                },
              ],
              'secure-text',
            )
          },
        },
      ],
    )
  }

  return (
    <SafeScreen>
      <View style={commonStyles.containerTop}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            testID="back-button">
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile & Account</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Success/Error Messages */}
          {success ? (
            <View style={styles.successMessage}>
              <Text style={commonStyles.successText}>{success}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorMessage}>
              <Text style={commonStyles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Profile Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Profile</Text>

            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={commonStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name (optional)"
              placeholderTextColor={colors.textMuted}
              editable={!loading}
              testID="name-input"
            />

            <Text style={styles.label}>Interests</Text>
            <View style={styles.interestsContainer}>
              {INTEREST_CATEGORIES.map((category: InterestCategory) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.interestItem}
                  onPress={() => toggleInterest(category.id)}
                  testID={`interest-${category.id}`}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedInterests.includes(category.id) &&
                        styles.checkboxChecked,
                    ]}>
                    {selectedInterests.includes(category.id) ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.interestLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Preferred Languages</Text>
            <View style={styles.interestsContainer}>
              {COMMON_LANGUAGES.map(langCode => (
                <TouchableOpacity
                  key={langCode}
                  style={styles.interestItem}
                  onPress={() => toggleLanguage(langCode)}
                  testID={`language-${langCode}`}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedLanguages.includes(langCode) &&
                        styles.checkboxChecked,
                    ]}>
                    {selectedLanguages.includes(langCode) ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.interestLabel}>
                    {LANGUAGES[langCode] ?? langCode} ({langCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
              testID="update-profile-button">
              {loading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : null}
              <Text style={commonStyles.buttonText}>{loading ? 'Saving...' : 'Update Profile'}</Text>
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Account</Text>

            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.valueText}>{userEmail}</Text>
              </View>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => setShowEmailForm(!showEmailForm)}
                testID="change-email-toggle">
                <Text style={styles.buttonSecondaryText}>
                  {showEmailForm ? 'Cancel' : 'Change Email'}
                </Text>
              </TouchableOpacity>
            </View>

            {showEmailForm ? (
              <View style={styles.inlineForm}>
                <Text style={styles.label}>New Email</Text>
                <TextInput
                  style={commonStyles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="new.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  testID="new-email-input"
                />

                <Text style={styles.label}>Password (for verification)</Text>
                <TextInput
                  style={commonStyles.input}
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                  testID="email-password-input"
                />

                <TouchableOpacity
                  style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
                  onPress={handleChangeEmail}
                  disabled={loading}
                  testID="change-email-submit">
                  {loading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : null}
                  <Text style={commonStyles.buttonText}>{loading ? 'Saving...' : 'Change Email'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.valueText}>••••••••</Text>
              </View>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => setShowPasswordForm(!showPasswordForm)}
                testID="change-password-toggle">
                <Text style={styles.buttonSecondaryText}>
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPasswordForm ? (
              <View style={styles.inlineForm}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={commonStyles.input}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                  testID="old-password-input"
                />

                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={commonStyles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                  testID="new-password-input"
                />

                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={commonStyles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  editable={!loading}
                  testID="confirm-password-input"
                />

                <TouchableOpacity
                  style={[commonStyles.button, loading && commonStyles.buttonDisabled]}
                  onPress={handleChangePassword}
                  disabled={loading}
                  testID="change-password-submit">
                  {loading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : null}
                  <Text style={commonStyles.buttonText}>{loading ? 'Saving...' : 'Change Password'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Danger Zone Section */}
          <View style={[commonStyles.section, styles.dangerZone]}>
            <Text style={[commonStyles.sectionTitle, styles.dangerTitle]}>
              Danger Zone
            </Text>
            <Text style={styles.dangerWarning}>
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>
            <TouchableOpacity
              style={[commonStyles.buttonDanger, loading && commonStyles.buttonDisabled]}
              onPress={handleDeleteAccount}
              disabled={loading}
              testID="delete-account-button">
              <Text style={styles.buttonDangerText}>Delete My Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  )
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightMedium,
  },
  headerTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
    flex: 1,
  },

  // Content
  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Form elements
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },

  // Messages with accent borders
  successMessage: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  errorMessage: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },

  // Interests/Checkboxes
  interestsContainer: {
    marginBottom: spacing.lg,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
  },
  interestLabel: {
    fontSize: typography.sizeMd,
    color: colors.textPrimary,
  },

  // Account management
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  accountInfo: {
    flex: 1,
  },
  valueText: {
    fontSize: typography.sizeMd,
    color: colors.textSecondary,
  },
  inlineForm: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
  },

  // Danger zone
  dangerZone: {
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.surfaceLight,
  },
  dangerTitle: {
    color: colors.danger,
  },
  dangerWarning: {
    fontSize: typography.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttonDangerText: {
    color: colors.textPrimary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
})
