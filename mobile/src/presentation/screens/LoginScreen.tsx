import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { colors } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface LoginScreenProps {
  authStorage: AuthStorage
  authClient: AuthClient
  onComplete: () => void
  onChangeServer: () => void
  onRegister: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authStorage,
  authClient,
  onComplete,
  onChangeServer,
  onRegister,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordInputRef = useRef<TextInput>(null)

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authClient.login(email, password)
      await authStorage.setAuthToken(response.accessToken)
      if (response.refreshToken) {
        await authStorage.setRefreshToken(response.refreshToken)
      }
      await authStorage.setUserEmail(response.user.email)
      await authStorage.setUserIsAdmin(response.user.isAdmin ?? false)
      await authStorage.setUserId(response.user.id)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeServer = () => {
    setError('')
    onChangeServer()
  }

  return (
    <SafeScreen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={commonStyles.container}>
          <View style={commonStyles.content}>
            <Text style={commonStyles.title}>Welcome to Guidr</Text>
            <Text style={commonStyles.description}>Sign in to continue</Text>

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
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />

            <TextInput
              ref={passwordInputRef}
              style={[commonStyles.input, error ? commonStyles.inputError : null]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[commonStyles.button, loading ? commonStyles.buttonDisabled : null]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={colors.textPrimary} size="small" style={commonStyles.activityIndicator} />
                  <Text style={commonStyles.buttonText}>Logging in...</Text>
                </>
              ) : (
                <Text style={commonStyles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={commonStyles.link}
              onPress={handleChangeServer}
            >
              <Text style={commonStyles.linkText}>Change Server</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={commonStyles.link}
              onPress={onRegister}
            >
              <Text style={commonStyles.linkText}>Don&apos;t have an account? Register</Text>
            </TouchableOpacity>
          </View>
          <VersionDisplay isVisible={false} />
        </View>
      </ScrollView>
    </SafeScreen>
  )
}

