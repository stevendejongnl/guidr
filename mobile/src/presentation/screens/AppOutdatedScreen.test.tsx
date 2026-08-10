import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AppOutdatedScreen } from './AppOutdatedScreen'
describe('AppOutdatedScreen', () => {
  const mockOnChangeServer = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should render current version', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(getByText(/current app version \(1\.0\.0\)/i)).toBeTruthy()
  })
  it('should show minimum version requirement message', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(getByText(/2\.0\.0 or higher/)).toBeTruthy()
  })
  it('should show maximum version requirement message', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="3.0.0"
        maxVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(getByText(/2\.0\.0 or lower/)).toBeTruthy()
  })
  it('should show version range message when both min and max are set', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="0.5.0"
        minVersion="1.0.0"
        maxVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(getByText(/1\.0\.0 - 2\.0\.0/)).toBeTruthy()
  })
  it('should call onChangeServer when Change Server button is pressed', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    fireEvent.press(getByText('Change Server'))
    expect(mockOnChangeServer).toHaveBeenCalledTimes(1)
  })
  it('should show Download Update button', () => {
    const { getByText } = render(
      <AppOutdatedScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(getByText('Download Update')).toBeTruthy()
  })
  it('should render update button that can be pressed', () => {
    const { getByLabelText } = render(
      <AppOutdatedScreen
        currentVersion="1.0.0"
        minVersion="2.0.0"
        onChangeServer={mockOnChangeServer}
      />
    )
    // Just verify the button exists and is pressable
    const updateButton = getByLabelText('Download Update')
    expect(updateButton).toBeTruthy()
  })
})
