import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'
import { AuthStorage } from '../../infrastructure/storage/AuthStorage'

jest.mock('../../infrastructure/storage/AuthStorage')

describe('HomeScreen', () => {
  let mockOnLogout: jest.Mock
  let mockOnOpenDebug: jest.Mock
  let mockAuthStorage: jest.Mocked<AuthStorage>

  beforeEach(() => {
    mockOnLogout = jest.fn()
    mockOnOpenDebug = jest.fn()

    mockAuthStorage = {
      getUserEmail: jest.fn().mockResolvedValue('test@example.com'),
    } as unknown as jest.Mocked<AuthStorage>

    ;(AuthStorage as jest.Mock).mockImplementation(() => mockAuthStorage)

    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render title and description', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      expect(getByText('Guidr')).toBeTruthy()
      expect(getByText('The app is ready. Guide management features coming soon.')).toBeTruthy()
    })

    it('should render logout button', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      expect(getByText('Logout')).toBeTruthy()
    })

    it('should display user email when loaded', async () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome, test@example.com')).toBeTruthy()
      })
    })

    it('should display generic welcome when email is not available', async () => {
      mockAuthStorage.getUserEmail.mockResolvedValue(null)

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      await waitFor(() => {
        expect(getByText('Welcome!')).toBeTruthy()
      })
    })
  })

  describe('logout button', () => {
    it('should call onLogout when logout button is pressed', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      fireEvent.press(getByText('Logout'))

      expect(mockOnLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('debug button', () => {
    it('should show debug button when debugMode is true', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={true} />
      )

      expect(getByText('⚙ Debug Tools')).toBeTruthy()
    })

    it('should not show debug button when debugMode is false', () => {
      const { queryByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
      )

      expect(queryByText('⚙ Debug Tools')).toBeNull()
    })

    it('should call onOpenDebug when debug button is pressed', () => {
      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={true} />
      )

      fireEvent.press(getByText('⚙ Debug Tools'))

      expect(mockOnOpenDebug).toHaveBeenCalledTimes(1)
    })

    it('should have correct accessibility label for debug button', () => {
      const { getByLabelText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={true} />
      )

      expect(getByLabelText('Open debug tools')).toBeTruthy()
    })
  })

  describe('error handling', () => {
    it('should handle email loading error gracefully', async () => {
      mockAuthStorage.getUserEmail.mockRejectedValue(new Error('Failed to load email'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const { getByText } = render(
        <HomeScreen onLogout={mockOnLogout} onOpenDebug={mockOnOpenDebug} debugMode={false} />
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
})
