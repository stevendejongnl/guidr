import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AutoAdvanceToggle } from './AutoAdvanceToggle'

jest.mock('@react-native-async-storage/async-storage')

const mockGetItem = AsyncStorage.getItem as jest.Mock
const mockSetItem = AsyncStorage.setItem as jest.Mock

describe('AutoAdvanceToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetItem.mockResolvedValue(JSON.stringify(true))
    mockSetItem.mockResolvedValue(undefined)
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

  it('should default to enabled (true) when AsyncStorage returns null', async () => {
    mockGetItem.mockResolvedValue(null)

    const { getByTestId } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      const switchEl = getByTestId('auto-advance-switch')
      expect(switchEl.props['value']).toBe(true)
    })
  })

  it('should load persisted false value from AsyncStorage', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(false))

    const { getByTestId } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      const switchEl = getByTestId('auto-advance-switch')
      expect(switchEl.props['value']).toBe(false)
    })
  })

  it('should save to AsyncStorage when toggled', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(true))

    const { getByTestId } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      expect(getByTestId('auto-advance-switch')).toBeTruthy()
    })

    fireEvent(getByTestId('auto-advance-switch'), 'valueChange', false)

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'Guidr_SessionPreference_AutoAdvance',
        JSON.stringify(false),
      )
    })
  })

  it('should call onValueChange callback when toggled', async () => {
    const mockOnValueChange = jest.fn()
    mockGetItem.mockResolvedValue(JSON.stringify(true))

    const { getByTestId } = render(
      <AutoAdvanceToggle testID="toggle" onValueChange={mockOnValueChange} />
    )

    await waitFor(() => {
      expect(getByTestId('auto-advance-switch')).toBeTruthy()
    })

    fireEvent(getByTestId('auto-advance-switch'), 'valueChange', false)

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith(false)
    })
  })

  it('should default to true when AsyncStorage.getItem throws', async () => {
    mockGetItem.mockRejectedValue(new Error('Storage error'))

    const { getByTestId } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      const switchEl = getByTestId('auto-advance-switch')
      expect(switchEl.props['value']).toBe(true)
    })
  })

  it('should revert to previous value when AsyncStorage.setItem throws', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(true))
    mockSetItem.mockRejectedValue(new Error('Write error'))

    const { getByTestId } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      expect(getByTestId('auto-advance-switch')).toBeTruthy()
    })

    fireEvent(getByTestId('auto-advance-switch'), 'valueChange', false)

    // After the storage failure, value should revert to true
    await waitFor(() => {
      const switchEl = getByTestId('auto-advance-switch')
      expect(switchEl.props['value']).toBe(true)
    })
  })

  it('should show descriptive text when toggle is enabled', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(true))

    const { getByText } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      expect(
        getByText('When timer completes, move to next step automatically'),
      ).toBeTruthy()
    })
  })

  it('should show descriptive text when toggle is disabled', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(false))

    const { getByText } = render(<AutoAdvanceToggle testID="toggle" />)

    await waitFor(() => {
      expect(
        getByText('When timer completes, pause and wait for manual advancement'),
      ).toBeTruthy()
    })
  })
})
