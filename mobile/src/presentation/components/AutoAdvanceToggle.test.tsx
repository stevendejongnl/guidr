import React from 'react'
import { render } from '@testing-library/react-native'
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

  it('should render without crashing', () => {
    // Component renders successfully (either in loading state or with toggle visible)
    // No assertion needed - if render throws, test fails
    render(<AutoAdvanceToggle testID="toggle" />)
    expect(true).toBe(true)
  })
})
