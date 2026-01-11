import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { VersionDisplay } from '../components/VersionDisplay'
import { SafeScreen } from '../components/SafeScreen'
import { Menu, MenuItem } from '../components/Menu'
import { ErrorReporter } from '../../infrastructure/monitoring/ErrorReporter'
import { commonStyles, colors } from '../theme'

interface HomeScreenProps {
  onLogout: () => void | Promise<void>
  onOpenAdmin: () => void
  onOpenSettings: () => void
  adminMode: boolean
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout, onOpenAdmin, onOpenSettings, adminMode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const authStorage = new AuthStorage()

  const menuItems: MenuItem[] = [
    { id: 'settings', label: 'Settings', onPress: onOpenSettings },
  ]

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const email = await authStorage.getUserEmail()
        setUserEmail(email)
      } catch (error) {
        ErrorReporter.capture(error, { component: 'HomeScreen', action: 'loadUserEmail' })
        console.error('Failed to load user email:', error)
      }
    }
    loadUserEmail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      // Error is already handled by parent component (AppNavigator)
      // Just ensure loading state is reset
      console.error('Logout error:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <SafeScreen>
      <View style={commonStyles.container}>
        <Menu items={menuItems} testID="home-menu" />
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

          {adminMode && (
            <TouchableOpacity
              style={[commonStyles.buttonSecondary, { marginBottom: 16 }]}
              onPress={onOpenAdmin}
              accessibilityLabel="Open admin tools"
            >
              <Text style={commonStyles.buttonText}>⚙ Admin Tools</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={commonStyles.buttonDanger}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <>
                <ActivityIndicator color={colors.textPrimary} size="small" />
                <Text style={[commonStyles.buttonText, { marginLeft: 8 }]}>Logging out...</Text>
              </>
            ) : (
              <Text style={commonStyles.buttonText}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>
        <VersionDisplay />
      </View>
    </SafeScreen>
  )
}
