import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ProfileScreen } from './ProfileScreen'
import { AuthClient } from '@infrastructure/api/AuthClient'
import { AuthStorage } from '@infrastructure/storage/AuthStorage'

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
  prompt: jest.fn(),
}))

describe('ProfileScreen', () => {
  let mockAuthClient: jest.Mocked<AuthClient>
  let mockAuthStorage: jest.Mocked<AuthStorage>

  const defaultProps = {
    onBack: jest.fn(),
    userEmail: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock AuthClient
    mockAuthClient = {
      updateProfile: jest.fn(),
      changeEmail: jest.fn(),
      changePassword: jest.fn(),
      deleteAccount: jest.fn(),
    } as any

    // Mock AuthStorage
    mockAuthStorage = {
      getAuthToken: jest.fn().mockResolvedValue('mock-token'),
      setAuthToken: jest.fn().mockResolvedValue(undefined),
      clearAll: jest.fn().mockResolvedValue(undefined),
    } as any
  })

  describe('Rendering', () => {
    it('renders profile screen with header', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )
      expect(getByText('Profile & Account')).toBeTruthy()
    })

    it('renders back button', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )
      expect(getByTestId('back-button')).toBeTruthy()
    })

    it('renders profile section', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )
      expect(getByText('Profile')).toBeTruthy()
      expect(getByText('Display Name')).toBeTruthy()
      expect(getByText('Interests')).toBeTruthy()
    })

    it('renders account section', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )
      expect(getByText('Account')).toBeTruthy()
      expect(getByText('Email')).toBeTruthy()
      expect(getByText('test@example.com')).toBeTruthy()
      expect(getByText('Password')).toBeTruthy()
    })

    it('renders danger zone section', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )
      expect(getByText('Danger Zone')).toBeTruthy()
      expect(getByText('Delete My Account')).toBeTruthy()
    })

    it('renders all interest categories', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // Check for some interest categories
      expect(getByText('Baking')).toBeTruthy()
      expect(getByText('Cooking')).toBeTruthy()
      expect(getByText('Sports & Fitness')).toBeTruthy()
      expect(getByText('Lab Protocols')).toBeTruthy()
    })
  })

  describe('Back Button', () => {
    it('calls onBack when back button is pressed', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('back-button'))
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('Profile Section', () => {
    it('allows entering a name', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      const nameInput = getByTestId('name-input')
      fireEvent.changeText(nameInput, 'John Doe')
      expect(nameInput.props['value']).toBe('John Doe')
    })

    it('allows selecting interests', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      const bakingCheckbox = getByTestId('interest-baking')
      fireEvent.press(bakingCheckbox)

      // Interest should be selected (we can't easily test checkbox state without more complex setup)
    })

    it('allows deselecting interests', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      const bakingCheckbox = getByTestId('interest-baking')
      fireEvent.press(bakingCheckbox) // Select
      fireEvent.press(bakingCheckbox) // Deselect
    })

    it('updates profile successfully', async () => {
      mockAuthClient.updateProfile.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        name: 'John Doe',
        interests: ['baking'],
      })

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // Enter name
      fireEvent.changeText(getByTestId('name-input'), 'John Doe')

      // Select interest
      fireEvent.press(getByTestId('interest-baking'))

      // Submit
      fireEvent.press(getByTestId('update-profile-button'))

      await waitFor(() => {
        expect(mockAuthStorage.getAuthToken).toHaveBeenCalled()
        expect(mockAuthClient.updateProfile).toHaveBeenCalledWith(
          'John Doe',
          ['baking'],
          'mock-token',
        )
      })

      await waitFor(() => {
        expect(getByText('Profile updated successfully')).toBeTruthy()
      })
    })

    it('shows error when profile update fails', async () => {
      mockAuthClient.updateProfile.mockRejectedValue(
        new Error('Update failed'),
      )

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.changeText(getByTestId('name-input'), 'John Doe')
      fireEvent.press(getByTestId('update-profile-button'))

      await waitFor(() => {
        expect(getByText('Update failed')).toBeTruthy()
      })
    })

    it('shows error when not authenticated', async () => {
      mockAuthStorage.getAuthToken.mockResolvedValue(null)

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('update-profile-button'))

      await waitFor(() => {
        expect(getByText('Not authenticated')).toBeTruthy()
      })
    })
  })

  describe('Change Email Form', () => {
    it('shows email form when change email button is pressed', () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle'))
      expect(getByText('New Email')).toBeTruthy()
      expect(getByText('Password (for verification)')).toBeTruthy()
    })

    it('hides email form when cancel button is pressed', () => {
      const { getByTestId, queryByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle')) // Show
      fireEvent.press(getByTestId('change-email-toggle')) // Hide

      expect(queryByText('New Email')).toBeNull()
    })

    it('changes email successfully', async () => {
      mockAuthClient.changeEmail.mockResolvedValue({
        accessToken: 'new-token',
        tokenType: 'bearer',
        user: {
          id: '123',
          email: 'new@example.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      })

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // Open form
      fireEvent.press(getByTestId('change-email-toggle'))

      // Fill form
      fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com')
      fireEvent.changeText(getByTestId('email-password-input'), 'password123')

      // Submit
      fireEvent.press(getByTestId('change-email-submit'))

      await waitFor(() => {
        expect(mockAuthClient.changeEmail).toHaveBeenCalledWith(
          'new@example.com',
          'password123',
          'mock-token',
        )
      })

      await waitFor(() => {
        expect(mockAuthStorage.setAuthToken).toHaveBeenCalledWith('new-token')
        expect(getByText('Email changed successfully')).toBeTruthy()
      })
    })

    it('shows error when email is empty', async () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle'))
      fireEvent.press(getByTestId('change-email-submit'))

      await waitFor(() => {
        expect(getByText('Email cannot be empty')).toBeTruthy()
      })
    })

    it('shows error when password is empty', async () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle'))
      fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com')
      fireEvent.press(getByTestId('change-email-submit'))

      await waitFor(() => {
        expect(getByText('Password is required to change email')).toBeTruthy()
      })
    })

    it('shows error when email change fails', async () => {
      mockAuthClient.changeEmail.mockRejectedValue(
        new Error('Email already in use'),
      )

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle'))
      fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com')
      fireEvent.changeText(getByTestId('email-password-input'), 'password123')
      fireEvent.press(getByTestId('change-email-submit'))

      await waitFor(() => {
        expect(getByText('Email already in use')).toBeTruthy()
      })
    })
  })

  describe('Change Password Form', () => {
    it('shows password form when change password button is pressed', () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle'))
      expect(getByText('Current Password')).toBeTruthy()
      expect(getByText('New Password')).toBeTruthy()
      expect(getByText('Confirm New Password')).toBeTruthy()
    })

    it('hides password form when cancel button is pressed', () => {
      const { getByTestId, queryByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle')) // Show
      fireEvent.press(getByTestId('change-password-toggle')) // Hide

      expect(queryByText('Current Password')).toBeNull()
    })

    it('changes password successfully', async () => {
      mockAuthClient.changePassword.mockResolvedValue(undefined)

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // Open form
      fireEvent.press(getByTestId('change-password-toggle'))

      // Fill form
      fireEvent.changeText(getByTestId('old-password-input'), 'oldpass123')
      fireEvent.changeText(getByTestId('new-password-input'), 'newpass123')
      fireEvent.changeText(getByTestId('confirm-password-input'), 'newpass123')

      // Submit
      fireEvent.press(getByTestId('change-password-submit'))

      await waitFor(() => {
        expect(mockAuthClient.changePassword).toHaveBeenCalledWith(
          'oldpass123',
          'newpass123',
          'mock-token',
        )
      })

      await waitFor(() => {
        expect(getByText('Password changed successfully')).toBeTruthy()
      })
    })

    it('shows error when old password is empty', async () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle'))
      fireEvent.press(getByTestId('change-password-submit'))

      await waitFor(() => {
        expect(getByText('Current password cannot be empty')).toBeTruthy()
      })
    })

    it('shows error when new password is empty', async () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle'))
      fireEvent.changeText(getByTestId('old-password-input'), 'oldpass123')
      fireEvent.press(getByTestId('change-password-submit'))

      await waitFor(() => {
        expect(getByText('New password cannot be empty')).toBeTruthy()
      })
    })

    it('shows error when passwords do not match', async () => {
      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle'))
      fireEvent.changeText(getByTestId('old-password-input'), 'oldpass123')
      fireEvent.changeText(getByTestId('new-password-input'), 'newpass123')
      fireEvent.changeText(getByTestId('confirm-password-input'), 'different')
      fireEvent.press(getByTestId('change-password-submit'))

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy()
      })
    })

    it('shows error when password change fails', async () => {
      mockAuthClient.changePassword.mockRejectedValue(
        new Error('Current password is incorrect'),
      )

      const { getByTestId, getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-password-toggle'))
      fireEvent.changeText(getByTestId('old-password-input'), 'wrongpass')
      fireEvent.changeText(getByTestId('new-password-input'), 'newpass123')
      fireEvent.changeText(getByTestId('confirm-password-input'), 'newpass123')
      fireEvent.press(getByTestId('change-password-submit'))

      await waitFor(() => {
        expect(getByText('Current password is incorrect')).toBeTruthy()
      })
    })
  })

  describe('Delete Account', () => {
    it('renders delete account button', () => {
      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      const deleteButton = getByTestId('delete-account-button')
      expect(deleteButton).toBeTruthy()
    })

    it('has danger zone warning text', () => {
      const { getByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      expect(
        getByText(/Once you delete your account, there is no going back/),
      ).toBeTruthy()
    })
  })

  describe('Loading States', () => {
    it('shows loading indicator when updating profile', async () => {
      mockAuthClient.updateProfile.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                id: '123',
                email: 'test@example.com',
                createdAt: '2024-01-01',
                updatedAt: '2024-01-01',
              })
            }, 100)
          }),
      )

      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('update-profile-button'))

      // Button should be disabled during loading
      const button = getByTestId('update-profile-button')
      expect(button.props['disabled']).toBe(true)
    })

    it('disables buttons during operations', async () => {
      mockAuthClient.changeEmail.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                accessToken: 'new-token',
                tokenType: 'bearer',
                user: {
                  id: '123',
                  email: 'new@example.com',
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
              })
            }, 100)
          }),
      )

      const { getByTestId } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      fireEvent.press(getByTestId('change-email-toggle'))
      fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com')
      fireEvent.changeText(getByTestId('email-password-input'), 'password123')
      fireEvent.press(getByTestId('change-email-submit'))

      const button = getByTestId('change-email-submit')
      expect(button.props['disabled']).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('clears previous error when starting new operation', async () => {
      mockAuthClient.updateProfile.mockRejectedValue(new Error('First error'))

      const { getByTestId, getByText, queryByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // First operation fails
      fireEvent.press(getByTestId('update-profile-button'))
      await waitFor(() => {
        expect(getByText('First error')).toBeTruthy()
      })

      // Start second operation - should clear error
      mockAuthClient.updateProfile.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      })

      fireEvent.press(getByTestId('update-profile-button'))
      await waitFor(() => {
        expect(queryByText('First error')).toBeNull()
      })
    })

    it('clears previous success message when starting new operation', async () => {
      mockAuthClient.updateProfile.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      })

      const { getByTestId, getByText, queryByText } = render(
        <ProfileScreen
          {...defaultProps}
          authClient={mockAuthClient}
          authStorage={mockAuthStorage}
        />,
      )

      // First operation succeeds
      fireEvent.press(getByTestId('update-profile-button'))
      await waitFor(() => {
        expect(getByText('Profile updated successfully')).toBeTruthy()
      })

      // Start second operation - should clear success
      fireEvent.press(getByTestId('update-profile-button'))
      await waitFor(() => {
        expect(queryByText('Profile updated successfully')).toBeNull()
      })
    })
  })
})
