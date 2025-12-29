import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'
import { VersionDisplay } from '../components/VersionDisplay'

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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Guidr</Text>
        {userEmail ? (
          <Text style={styles.subtitle}>Welcome, {userEmail}</Text>
        ) : (
          <Text style={styles.subtitle}>Welcome!</Text>
        )}
        <Text style={styles.description}>
          The app is ready. Guide management features coming soon.
        </Text>

        {debugMode && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={onOpenDebug}
            accessibilityLabel="Open debug tools"
          >
            <Text style={styles.debugButtonText}>⚙ Debug Tools</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  debugButton: {
    backgroundColor: '#757575',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
