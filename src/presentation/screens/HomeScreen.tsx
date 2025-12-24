import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guidr</Text>
      <Text style={styles.subtitle}>Server configured successfully!</Text>
      <Text style={styles.description}>
        The app is ready. Guide management features coming soon.
      </Text>
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
  },
})
