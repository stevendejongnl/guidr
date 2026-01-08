import React, { useState } from 'react'
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
import {
  INTEREST_CATEGORIES,
  type InterestCategory,
} from '@domain/constants/InterestCategories'

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

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId],
    )
  }

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
    <View style={styles.container}>
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
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name (optional)"
            placeholderTextColor="#999"
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading}
            testID="update-profile-button">
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

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
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="new.email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="new-email-input"
              />

              <Text style={styles.label}>Password (for verification)</Text>
              <TextInput
                style={styles.input}
                value={emailPassword}
                onChangeText={setEmailPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                testID="email-password-input"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChangeEmail}
                disabled={loading}
                testID="change-email-submit">
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Change Email</Text>
                )}
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
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry
                testID="old-password-input"
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry
                testID="new-password-input"
              />

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#999"
                secureTextEntry
                testID="confirm-password-input"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
                testID="change-password-submit">
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Danger Zone Section */}
        <View style={[styles.section, styles.dangerZone]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>
          <Text style={styles.dangerWarning}>
            Once you delete your account, there is no going back. Please be
            certain.
          </Text>
          <TouchableOpacity
            style={[styles.buttonDanger, loading && styles.buttonDisabled]}
            onPress={handleDeleteAccount}
            disabled={loading}
            testID="delete-account-button">
            <Text style={styles.buttonDangerText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
  },
  interestsContainer: {
    marginBottom: 16,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  interestLabel: {
    fontSize: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  valueText: {
    fontSize: 16,
    color: '#666',
  },
  inlineForm: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  dangerZone: {
    borderWidth: 2,
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  dangerTitle: {
    color: '#dc3545',
  },
  dangerWarning: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 16,
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonDangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
