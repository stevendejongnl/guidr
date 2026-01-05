import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { UpdateAvailableScreen } from './UpdateAvailableScreen'

describe('UpdateAvailableScreen', () => {
  const mockOnStartUpdate = jest.fn()
  const mockOnDismiss = jest.fn()
  const mockOnChangeServer = jest.fn()

  const defaultProps = {
    currentVersion: '1.14.1',
    latestVersion: '1.15.0',
    changelog: 'Bug fixes and improvements',
    isMandatory: false,
    onStartUpdate: mockOnStartUpdate,
    onDismiss: mockOnDismiss,
    onChangeServer: mockOnChangeServer,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render update available title for optional updates', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText('Update Available')).toBeTruthy()
  })

  it('should render update required title for mandatory updates', () => {
    const { getByText } = render(
      <UpdateAvailableScreen {...defaultProps} isMandatory={true} />
    )
    expect(getByText('Update Required')).toBeTruthy()
  })

  it('should render version upgrade information', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText(/v1\.14\.1 → v1\.15\.0/)).toBeTruthy()
  })

  it('should render changelog content', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText('Bug fixes and improvements')).toBeTruthy()
  })

  it('should render long changelog content (scrollable)', () => {
    const longChangelog = 'This is a long changelog with many updates and improvements'
    const { getByText } = render(
      <UpdateAvailableScreen {...defaultProps} changelog={longChangelog} />
    )
    expect(getByText(longChangelog)).toBeTruthy()
  })

  it('should call onStartUpdate when Update button is pressed', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    fireEvent.press(getByText('Update'))
    expect(mockOnStartUpdate).toHaveBeenCalledTimes(1)
  })

  it('should call onStartUpdate when Update Now button is pressed for mandatory updates', () => {
    const { getByText } = render(
      <UpdateAvailableScreen {...defaultProps} isMandatory={true} />
    )
    fireEvent.press(getByText('Update Now'))
    expect(mockOnStartUpdate).toHaveBeenCalledTimes(1)
  })

  it('should show Later button for optional updates', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText('Later')).toBeTruthy()
  })

  it('should not show Later button for mandatory updates', () => {
    const { queryByText } = render(
      <UpdateAvailableScreen
        currentVersion={defaultProps.currentVersion}
        latestVersion={defaultProps.latestVersion}
        changelog={defaultProps.changelog}
        isMandatory={true}
        onStartUpdate={mockOnStartUpdate}
        onChangeServer={mockOnChangeServer}
      />
    )
    expect(queryByText('Later')).toBeNull()
  })

  it('should call onDismiss when Later button is pressed', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    fireEvent.press(getByText('Later'))
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('should show Change Server button when provided', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText('Change Server')).toBeTruthy()
  })

  it('should call onChangeServer when Change Server button is pressed', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    fireEvent.press(getByText('Change Server'))
    expect(mockOnChangeServer).toHaveBeenCalledTimes(1)
  })

  it('should not show Change Server button when not provided', () => {
    const { queryByText } = render(
      <UpdateAvailableScreen
        currentVersion={defaultProps.currentVersion}
        latestVersion={defaultProps.latestVersion}
        changelog={defaultProps.changelog}
        isMandatory={defaultProps.isMandatory}
        onStartUpdate={mockOnStartUpdate}
        onDismiss={mockOnDismiss}
      />
    )
    expect(queryByText('Change Server')).toBeNull()
  })

  it('should show rocket icon for optional updates', () => {
    const { getByText } = render(<UpdateAvailableScreen {...defaultProps} />)
    expect(getByText('🚀')).toBeTruthy()
  })

  it('should show warning icon for mandatory updates', () => {
    const { getByText } = render(
      <UpdateAvailableScreen {...defaultProps} isMandatory={true} />
    )
    expect(getByText('⚠️')).toBeTruthy()
  })

  it('should render without changelog', () => {
    const props = {
      ...defaultProps,
      changelog: '',
    }
    const { queryByText } = render(<UpdateAvailableScreen {...props} />)
    expect(queryByText('What\'s New:')).toBeNull()
  })

  it('should have correct accessibility label for Update button', () => {
    const { getByLabelText } = render(
      <UpdateAvailableScreen {...defaultProps} />
    )
    expect(getByLabelText('Start update')).toBeTruthy()
  })

  it('should have correct accessibility label for mandatory Update Now button', () => {
    const { getByLabelText } = render(
      <UpdateAvailableScreen {...defaultProps} isMandatory={true} />
    )
    expect(getByLabelText('Update now')).toBeTruthy()
  })

  it('should have correct accessibility label for Later button', () => {
    const { getByLabelText } = render(
      <UpdateAvailableScreen {...defaultProps} />
    )
    expect(getByLabelText('Dismiss update')).toBeTruthy()
  })

  it('should have correct accessibility label for Change Server button', () => {
    const { getByLabelText } = render(
      <UpdateAvailableScreen {...defaultProps} />
    )
    expect(getByLabelText('Change server')).toBeTruthy()
  })
})
