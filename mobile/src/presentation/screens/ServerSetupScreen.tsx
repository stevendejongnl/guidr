import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { commonStyles, colors } from '../theme'

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
    <SafeScreen>
      <KeyboardAvoidingView
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Server Configuration</Text>
          <Text style={commonStyles.description}>Enter your Guidr server URL to get started.</Text>

          <TextInput
            style={[commonStyles.input, error ? commonStyles.inputError : null]}
            placeholder="https://api.example.com"
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={handleUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!loading}
          />

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[commonStyles.button, loading ? commonStyles.buttonDisabled : null]}
            onPress={handleSave}
            disabled={loading}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <>
                <ActivityIndicator color={colors.textPrimary} size="small" style={commonStyles.activityIndicator} />
                <Text style={commonStyles.buttonText}>Saving...</Text>
              </>
            ) : (
              <Text style={commonStyles.buttonText}>Save Server URL</Text>
            )}
          </TouchableOpacity>
        </View>
        <VersionDisplay />
      </KeyboardAvoidingView>
    </SafeScreen>
  )
}
