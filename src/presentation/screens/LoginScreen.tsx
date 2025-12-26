import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { AuthClient } from '../../infrastructure/api/AuthClient'
import { VersionDisplay } from '../components/VersionDisplay'

interface LoginScreenProps {
  authStorage: AuthStorage
  authClient: AuthClient
  onComplete: () => void
  onChangeServer: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authStorage,
  authClient,
  onComplete,
  onChangeServer,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      await authStorage.setAuthToken(response.token)
      await authStorage.setUserEmail(response.email)
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Guidr</Text>
        <Text style={styles.description}>Sign in to continue</Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="email@example.com"
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={styles.activityIndicator} />
              <Text style={styles.buttonText}>Logging in...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changeServerLink}
          onPress={handleChangeServer}
        >
          <Text style={styles.changeServerText}>Change Server</Text>
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityIndicator: {
    marginRight: 8,
  },
  changeServerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  changeServerText: {
    color: '#2196f3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
})
