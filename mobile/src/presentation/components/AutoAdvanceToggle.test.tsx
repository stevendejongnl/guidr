import React from 'react'
import { render, screen } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AutoAdvanceToggle } from './AutoAdvanceToggle'

jest.mock('@react-native-async-storage/async-storage')

describe('AutoAdvanceToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(true))
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
  })

  it('should call AsyncStorage.getItem on mount', () => {
    render(<AutoAdvanceToggle testID="toggle" />)

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      'Guidr_SessionPreference_AutoAdvance'
    )
  })

  it('should render toggle component', () => {
    render(<AutoAdvanceToggle testID="toggle" />)
    // Component renders either loading or the toggle
    // Simple check that render succeeds
    expect(screen.getByTestId('toggle')).toBeDefined()
  })
})
