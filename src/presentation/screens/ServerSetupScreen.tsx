import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { VersionDisplay } from '../components/VersionDisplay'

interface ServerSetupScreenProps {
  storage: ServerConfigStorage
  onComplete: () => void
  currentUrl?: string
}

export const ServerSetupScreen: React.FC<ServerSetupScreenProps> = ({
  storage,
  onComplete,
  currentUrl,
}) => {
  const [url, setUrl] = useState(currentUrl || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUrlChange = (text: string) => {
    setUrl(text)
    if (error) {
      setError('')
    }
  }

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a server URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      await storage.setServerUrl(url)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Server Configuration</Text>
        <Text style={styles.description}>Enter your Guidr server URL to get started.</Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="https://api.example.com"
          placeholderTextColor="#999"
          value={url}
          onChangeText={handleUrlChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleSave}
          disabled={loading}
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={styles.activityIndicator} />
              <Text style={styles.buttonText}>Saving...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Save Server URL</Text>
          )}
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </KeyboardAvoidingView>
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
    marginBottom: 8,
    color: '#333',
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
})
