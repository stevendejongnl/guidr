import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { VersionDisplay } from '../components/VersionDisplay'
import { commonStyles } from '../theme'

interface HomeScreenProps {
  onLogout: () => void
  onOpenDebug: () => void
  debugMode: boolean
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout, onOpenDebug, debugMode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const authStorage = new AuthStorage()

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const email = await authStorage.getUserEmail()
        setUserEmail(email)
      } catch (error) {
        console.error('Failed to load user email:', error)
      }
    }
    loadUserEmail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.contentCentered}>
        <Text style={commonStyles.titleLarge}>Guidr</Text>
        {userEmail ? (
          <Text style={commonStyles.subtitle}>Welcome, {userEmail}</Text>
        ) : (
          <Text style={commonStyles.subtitle}>Welcome!</Text>
        )}
        <Text style={commonStyles.descriptionCentered}>
          The app is ready. Guide management features coming soon.
        </Text>

        {debugMode && (
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { marginBottom: 16 }]}
            onPress={onOpenDebug}
            accessibilityLabel="Open debug tools"
          >
            <Text style={commonStyles.buttonText}>⚙ Debug Tools</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={commonStyles.buttonDanger} onPress={onLogout}>
          <Text style={commonStyles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <VersionDisplay />
    </View>
  )
}

