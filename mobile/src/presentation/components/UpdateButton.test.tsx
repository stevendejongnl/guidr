import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { UpdateButton } from './UpdateButton'
import { UpdateCheckResult } from '../../domain/services/UpdateService'

// UpdateButton constructs GitHubReleaseClient, UpdateCheckStorage, and UpdateService
// internally — these are infrastructure boundary modules that cannot be injected.
// Mocking them is the only option here (same pattern as ErrorReporter elsewhere).
jest.mock('../../infrastructure/api/GitHubReleaseClient')
jest.mock('../../infrastructure/storage/UpdateCheckStorage')
jest.mock('../../domain/services/UpdateService')

import { UpdateService } from '../../domain/services/UpdateService'

const MockUpdateService = UpdateService as jest.MockedClass<typeof UpdateService>

const buildNoUpdateResult = (): UpdateCheckResult => ({
  updateAvailable: false,
  isMandatory: false,
  currentVersion: '1.0.0',
  latestVersion: '1.0.0',
  release: null,
})

const buildUpdateAvailableResult = (isMandatory = false): UpdateCheckResult => ({
  updateAvailable: true,
  isMandatory,
  currentVersion: '1.0.0',
  latestVersion: '2.0.0',
  release: null,
})

describe('UpdateButton', () => {
  const mockOnCheckComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the "Check for Updates" button', () => {
    const { getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    expect(getByText('Check for Updates')).toBeTruthy()
  })

  it('shows ActivityIndicator while checking and hides it after', async () => {
    let resolveCheck!: (result: UpdateCheckResult) => void
    const checkPromise = new Promise<UpdateCheckResult>(resolve => {
      resolveCheck = resolve
    })

    MockUpdateService.prototype.checkForUpdates = jest.fn().mockReturnValue(checkPromise)

    const { queryByText, getByLabelText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    fireEvent.press(getByLabelText('Check for updates'))

    // Button text should be gone while loading (ActivityIndicator is shown)
    await waitFor(() => {
      expect(queryByText('Check for Updates')).toBeNull()
    })

    // Resolve and verify button comes back
    await act(async () => {
      resolveCheck(buildNoUpdateResult())
    })

    await waitFor(() => {
      expect(queryByText('Check for Updates')).toBeTruthy()
    })
  })

  it('shows "latest version" message when no update is available', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockResolvedValue(buildNoUpdateResult())

    const { getByLabelText, getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(getByText('You\'re on the latest version (v1.0.0)')).toBeTruthy()
    })
  })

  it('does not call onCheckComplete when no update is available', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockResolvedValue(buildNoUpdateResult())

    const { getByLabelText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(mockOnCheckComplete).not.toHaveBeenCalled()
    })
  })

  it('shows update available message when update exists', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockResolvedValue(buildUpdateAvailableResult())

    const { getByLabelText, getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(getByText('Update available: v2.0.0')).toBeTruthy()
    })
  })

  it('shows "(Required)" suffix when update is mandatory', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockResolvedValue(buildUpdateAvailableResult(true))

    const { getByLabelText, getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(getByText('Update available: v2.0.0 (Required)')).toBeTruthy()
    })
  })

  it('calls onCheckComplete with result when update is available', async () => {
    const result = buildUpdateAvailableResult()
    MockUpdateService.prototype.checkForUpdates = jest.fn().mockResolvedValue(result)

    const { getByLabelText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(mockOnCheckComplete).toHaveBeenCalledWith(result)
    })
  })

  it('shows error message when check throws an Error', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockRejectedValue(new Error('Network failure'))

    const { getByLabelText, getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(getByText('Network failure')).toBeTruthy()
    })
  })

  it('shows generic error message when check throws a non-Error', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockRejectedValue('string error')

    const { getByLabelText, getByText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(getByText('Failed to check for updates')).toBeTruthy()
    })
  })

  it('disables the button while checking', async () => {
    let resolveCheck!: (result: UpdateCheckResult) => void
    const checkPromise = new Promise<UpdateCheckResult>(resolve => {
      resolveCheck = resolve
    })
    MockUpdateService.prototype.checkForUpdates = jest.fn().mockReturnValue(checkPromise)

    const { getByLabelText } = render(
      <UpdateButton
        serverConfig={{}}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    const button = getByLabelText('Check for updates')
    fireEvent.press(button)

    await waitFor(() => {
      expect(button.props['disabled']).toBe(true)
    })

    await act(async () => {
      resolveCheck(buildNoUpdateResult())
    })
  })

  it('passes serverConfig to UpdateService constructor', async () => {
    MockUpdateService.prototype.checkForUpdates = jest
      .fn()
      .mockResolvedValue(buildNoUpdateResult())

    const serverConfig = { minAppVersion: '1.5.0' }

    const { getByLabelText } = render(
      <UpdateButton
        serverConfig={serverConfig}
        onCheckComplete={mockOnCheckComplete}
      />
    )

    await act(async () => {
      fireEvent.press(getByLabelText('Check for updates'))
    })

    await waitFor(() => {
      expect(MockUpdateService).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        serverConfig,
      )
    })
  })
})
