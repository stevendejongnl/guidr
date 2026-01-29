import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { commonStyles, colors } from '../theme'

interface RegistrationScreenProps {
  authStorage: AuthStorage
  authClient: AuthClient
  onComplete: () => void
  onBackToLogin: () => void
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  authStorage,
  authClient,
  onComplete,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailChange = (text: string) => {
    setEmail(text)
    if (error) {
      setError('')
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    if (error) {
      setError('')
    }
  }

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text)
    if (error) {
      setError('')
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleRegister = async () => {
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const registerResponse = await authClient.register(email, password)
      await authStorage.setAuthToken(registerResponse.accessToken)
      await authStorage.setUserEmail(registerResponse.user.email)
      await authStorage.setUserIsAdmin(registerResponse.user.isAdmin ?? false)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setError('')
    onBackToLogin()
  }

  return (
    <SafeScreen>
      <View style={commonStyles.container}>
        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Create Account</Text>
          <Text style={commonStyles.description}>Sign up to get started</Text>

          <TextInput
            style={[commonStyles.input, error ? commonStyles.inputError : null]}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={[commonStyles.input, error ? commonStyles.inputError : null]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            editable={!loading}
          />

          <TextInput
            style={[commonStyles.input, error ? commonStyles.inputError : null]}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            editable={!loading}
          />

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[commonStyles.button, loading ? commonStyles.buttonDisabled : null]}
            onPress={handleRegister}
            disabled={loading}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <>
                <ActivityIndicator color={colors.textPrimary} size="small" style={commonStyles.activityIndicator} />
                <Text style={commonStyles.buttonText}>Creating account...</Text>
              </>
            ) : (
              <Text style={commonStyles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={commonStyles.link}
            onPress={handleBackToLogin}
          >
            <Text style={commonStyles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
        <VersionDisplay isVisible={false} />
      </View>
    </SafeScreen>
  )
}
