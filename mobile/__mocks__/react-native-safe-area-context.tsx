import React from 'react'
import { View } from 'react-native'

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const SafeAreaView = ({ children, style, ...props }: { children: React.ReactNode; style?: any; [key: string]: any }) => {
  return <View style={style} {...props}>{children}</View>
}

export const useSafeAreaInsets = () => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: 390,
  height: 844,
})

export const initialWindowMetrics = {
  insets: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  frame: {
    x: 0,
    y: 0,
    width: 390,
    height: 844,
  },
}

