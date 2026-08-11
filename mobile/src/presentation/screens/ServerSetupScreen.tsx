import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { ServerConfigStorage } from '../../infrastructure/storage/ServerConfigStorage'
import { IHealthCheckService, HealthCheckResult } from '../../domain/services/IHealthCheckService'
import { ValidatedServerStorage } from '../../infrastructure/storage/ValidatedServerStorage'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { colors } from '@guidr/shared/tokens'
import { commonStyles } from '@guidr/shared/styles/react-native'

interface ServerSetupScreenProps {
  storage: ServerConfigStorage
  healthCheckService: IHealthCheckService
  onComplete: () => void
  currentUrl?: string
  // Optional dependency (for testing/DI)
  validatedStorage?: ValidatedServerStorage
}

export const ServerSetupScreen: React.FC<ServerSetupScreenProps> = ({
  storage,
  healthCheckService,
  onComplete,
  currentUrl,
  validatedStorage: injectedValidatedStorage,
}) => {
  const [url, setUrl] = useState(currentUrl || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<HealthCheckResult | null>(null)

  const handleUrlChange = (text: string) => {
    setUrl(text)
    if (error) {
      setError('')
    }
    setValidationResult(null)
  }

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a server URL')
      return
    }

    setLoading(true)
    setError('')
    setValidationResult(null)

    try {
      // Use ValidatedServerStorage to validate and save
      const validatedStorage =
        injectedValidatedStorage ?? new ValidatedServerStorage(storage, healthCheckService)
      const result = await validatedStorage.setServerUrlWithValidation(url)

      // Check validation result
      if (!result.healthy) {
        setError(`Server validation failed: ${result.error || 'Unknown error'}`)
        setValidationResult(result)
        return
      }

      // Success - show response time and navigate
      setValidationResult(result)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeScreen>
      <View style={commonStyles.container}>
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

          {validationResult && validationResult.healthy ? (
            <Text style={commonStyles.successText}>
              ✓ Connected ({validationResult.responseTime}ms)
            </Text>
          ) : null}

          <TouchableOpacity
            style={[commonStyles.button, loading ? commonStyles.buttonDisabled : null]}
            onPress={handleSave}
            disabled={loading}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <>
                <ActivityIndicator color={colors.textPrimary} size="small" style={commonStyles.activityIndicator} />
                <Text style={commonStyles.buttonText}>Validating server...</Text>
              </>
            ) : (
              <Text style={commonStyles.buttonText}>Save Server URL</Text>
            )}
          </TouchableOpacity>
        </View>
        <VersionDisplay isVisible={false} />
      </View>
    </SafeScreen>
  )
}
