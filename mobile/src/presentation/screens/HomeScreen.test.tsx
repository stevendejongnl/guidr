import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'

jest.mock('../../infrastructure/storage/AuthStorage')

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenAdmin: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockAuthStorage: jest.Mocked<AuthStorage>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenAdmin = jest.fn()
    mockOnOpenSettings = jest.fn()

    mockAuthStorage = {
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
    } as unknown as jest.Mocked<AuthStorage>

    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)

    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render title and description', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      expect(getByText('Guidr')).toBeTruthy()
      expect(getByText('The app is ready. Guide management features coming soon.')).toBeTruthy()
    })

    it('should render logout button', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      expect(getByText('Logout')).toBeTruthy()
    })

    it('should display user email when loaded', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome, test@example.com')).toBeTruthy()
      })
    })

    it('should display generic welcome when email is not available', async () => {
      mockAuthStorage.getUserEmail.mockResolvedValue(null)

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome!')).toBeTruthy()
      })
    })
  })

  describe('logout button', () => {
    it('should call onLogout when logout button is pressed', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      fireEvent.press(getByText('Logout'))

      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })

    it('should show loading indicator during logout', async () => {
      mockOnLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const { getByText, queryByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      fireEvent.press(getByText('Logout'))

      await waitFor(() => {
        expect(queryByText('Logging out...')).toBeTruthy()
      })

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('should disable button during logout', async () => {
      mockOnLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const { getByText, UNSAFE_getByProps } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      fireEvent.press(getByText('Logout'))

      await waitFor(() => {
        const button = UNSAFE_getByProps({ disabled: true })
        expect(button).toBeTruthy()
      })
    })

    it('should handle async logout errors', async () => {
      mockOnLogout.mockRejectedValue(new Error('Logout failed'))

      const { getByText, queryByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      fireEvent.press(getByText('Logout'))

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })

      // Should reset loading state even on error
      await waitFor(() => {
        expect(queryByText('Logging out...')).toBeNull()
        expect(getByText('Logout')).toBeTruthy()
      })
    })
  })

  describe('admin button', () => {
    it('should show admin button when adminMode is true', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={true} />
      )

      expect(getByText('⚙ Admin Tools')).toBeTruthy()
    })

    it('should not show admin button when adminMode is false', () => {
      const { queryByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      expect(queryByText('⚙ Admin Tools')).toBeNull()
    })

    it('should call onOpenAdmin when admin button is pressed', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={true} />
      )

      fireEvent.press(getByText('⚙ Admin Tools'))

      expect(mockOnOpenAdmin).toHaveBeenCalledTimes(1)
    })

    it('should have correct accessibility label for admin button', () => {
      const { getByLabelText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={true} />
      )

      expect(getByLabelText('Open admin tools')).toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('should handle email loading error gracefully', async () => {
      mockAuthStorage.getUserEmail.mockRejectedValue(new Error('Failed to load email'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome!')).toBeTruthy()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user email:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('menu', () => {
    it('should render menu button', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      expect(getByTestId('home-menu')).toBeTruthy()
    })

    it('should call onOpenSettings when settings menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenAdmin={mockOnOpenAdmin} onOpenSettings={mockOnOpenSettings} adminMode={false} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-settings'))

      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
    })
  })
})
