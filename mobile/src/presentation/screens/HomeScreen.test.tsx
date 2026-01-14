import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'

jest.mock('../../infrastructure/storage/AuthStorage')

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenSettings: jest.Mock
  let mockOnOpenProfile: jest.Mock
  let mockAuthStorage: jest.Mocked<AuthStorage>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenSettings = jest.fn()
    mockOnOpenProfile = jest.fn()

    mockAuthStorage = {
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
    } as unknown as jest.Mocked<AuthStorage>

    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)

    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render title and description', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      expect(getByText('Guidr')).toBeTruthy()
      expect(getByText('The app is ready. Guide management features coming soon.')).toBeTruthy()
    })

    it('should render logout menu item', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      fireEvent.press(getByTestId('home-menu'))
      expect(getByTestId('menu-item-logout')).toBeTruthy()
    })

    it('should display user email when loaded', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      await waitFor(() => {
        expect(getByText('Welcome, test@example.com')).toBeTruthy()
      })
    })

    it('should display generic welcome when email is not available', async () => {
      mockAuthStorage.getUserEmail.mockResolvedValue(null)

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      await waitFor(() => {
        expect(getByText('Welcome!')).toBeTruthy()
      })
    })
  })

  describe('logout menu item', () => {
    it('should call onLogout when logout menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-logout'))

      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })

    it('should handle async logout errors', async () => {
      mockOnLogout.mockRejectedValue(new Error('Logout failed'))

      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-logout'))

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('error handling', () => {
    it('should handle email loading error gracefully', async () => {
      mockAuthStorage.getUserEmail.mockRejectedValue(new Error('Failed to load email'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
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
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      expect(getByTestId('home-menu')).toBeTruthy()
    })

    it('should call onOpenProfile when profile menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-profile'))

      expect(mockOnOpenProfile).toHaveBeenCalledTimes(1)
    })

    it('should call onOpenSettings when settings menu item is pressed', () => {
      const { getByTestId } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenSettings={mockOnOpenSettings} onOpenProfile={mockOnOpenProfile} />
      )

      fireEvent.press(getByTestId('home-menu'))
      fireEvent.press(getByTestId('menu-item-settings'))

      expect(mockOnOpenSettings).toHaveBeenCalledTimes(1)
    })
  })
})
