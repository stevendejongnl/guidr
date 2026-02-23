import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { SessionHistoryScreen } from './SessionHistoryScreen'
import { Session, SessionStatus } from '../../domain/entities/Session'
import {
  createMockAuthStorage,
  createMockGuideService,
  createMockSessionService,
} from '../testUtils'

const makeSession = (overrides: Partial<Session> = {}): Session =>
  ({
    id: 's1',
    guideId: 'g1',
    status: SessionStatus.Completed,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:30:00Z'),
    startedAt: new Date('2026-01-01T10:00:00Z'),
    completedAt: new Date('2026-01-01T10:30:00Z'),
    ...overrides,
  }) as unknown as Session

describe('SessionHistoryScreen', () => {
  let mockOnBack: jest.Mock
  let mockSessionService: jest.Mocked<ReturnType<typeof createMockSessionService>>
  let mockGuideService: jest.Mocked<ReturnType<typeof createMockGuideService>>
  let mockAuthStorage: jest.Mocked<ReturnType<typeof createMockAuthStorage>>

  beforeEach(() => {
    mockOnBack = jest.fn()
    mockSessionService = createMockSessionService([])
    mockGuideService = createMockGuideService([])
    mockAuthStorage = createMockAuthStorage()
  })

  const renderScreen = () =>
    render(
      <SessionHistoryScreen
        onBack={mockOnBack}
        sessionService={mockSessionService}
        guideService={mockGuideService}
        authStorage={mockAuthStorage}
      />,
    )

  describe('rendering', () => {
    it('should render the screen title', () => {
      const { getByText } = renderScreen()
      expect(getByText('Session History')).toBeTruthy()
    })

    it('should render a back button', () => {
      const { getByTestId } = renderScreen()
      expect(getByTestId('session-history-back')).toBeTruthy()
    })

    it('should call onBack when back button is pressed', () => {
      const { getByTestId } = renderScreen()
      fireEvent.press(getByTestId('session-history-back'))
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading state', () => {
    it('should show a loading indicator while fetching sessions', () => {
      mockSessionService.getAllSessions.mockReturnValue(new Promise(() => {}))
      const { getByTestId } = renderScreen()
      expect(getByTestId('session-history-loading')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when there are no sessions', async () => {
      mockSessionService.getAllSessions.mockResolvedValue([])
      const { getByText } = renderScreen()
      await waitFor(() => {
        expect(getByText('No sessions yet')).toBeTruthy()
      })
    })
  })

  describe('session list', () => {
    it('should display a list of sessions after loading', async () => {
      const sessions = [makeSession({ id: 's1' }), makeSession({ id: 's2' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)

      const { getByTestId } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-item-s1')).toBeTruthy()
        expect(getByTestId('session-item-s2')).toBeTruthy()
      })
    })

    it('should display the guide name for each session', async () => {
      const sessions = [makeSession({ id: 's1', guideId: 'g1' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)
      mockGuideService.getGuideById.mockResolvedValue({
        id: 'g1',
        title: 'Sourdough Bread',
      } as never)

      const { getByText } = renderScreen()

      await waitFor(() => {
        expect(getByText('Sourdough Bread')).toBeTruthy()
      })
    })

    it('should display the session status', async () => {
      const sessions = [makeSession({ id: 's1', status: SessionStatus.Completed })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)

      const { getByText } = renderScreen()

      await waitFor(() => {
        expect(getByText('Completed')).toBeTruthy()
      })
    })

    it('should display the session date', async () => {
      const sessions = [makeSession({ id: 's1', createdAt: new Date('2026-01-01T10:00:00Z') })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)

      const { getByTestId } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-date-s1')).toBeTruthy()
      })
    })
  })

  describe('delete session', () => {
    it('should show a confirmation dialog when delete is pressed', async () => {
      const sessions = [makeSession({ id: 's1' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)

      const { getByTestId, getByText } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-delete-s1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('session-delete-s1'))

      expect(getByText('Delete Session')).toBeTruthy()
      expect(getByText('Are you sure you want to delete this session?')).toBeTruthy()
    })

    it('should call deleteSession when confirmed in dialog', async () => {
      const sessions = [makeSession({ id: 's1' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)
      mockAuthStorage.getAuthToken.mockResolvedValue('test-token')

      const { getByTestId } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-delete-s1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('session-delete-s1'))

      await waitFor(() => {
        expect(getByTestId('confirm-delete-button')).toBeTruthy()
      })

      fireEvent.press(getByTestId('confirm-delete-button'))

      await waitFor(() => {
        expect(mockSessionService.deleteSession).toHaveBeenCalledWith('s1', 'test-token')
      })
    })

    it('should remove the session from the list after deletion', async () => {
      const sessions = [makeSession({ id: 's1' }), makeSession({ id: 's2' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)
      mockSessionService.deleteSession.mockResolvedValue(undefined)

      const { getByTestId, queryByTestId } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-item-s1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('session-delete-s1'))

      await waitFor(() => {
        expect(getByTestId('confirm-delete-button')).toBeTruthy()
      })

      fireEvent.press(getByTestId('confirm-delete-button'))

      await waitFor(() => {
        expect(mockSessionService.deleteSession).toHaveBeenCalledWith('s1', 'test-token')
      })
      await waitFor(() => {
        expect(queryByTestId('session-item-s1')).toBeNull()
        expect(getByTestId('session-item-s2')).toBeTruthy()
      })
    })

    it('should not call deleteSession when dialog is cancelled', async () => {
      const sessions = [makeSession({ id: 's1' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)

      const { getByTestId } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-delete-s1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('session-delete-s1'))

      await waitFor(() => {
        expect(getByTestId('cancel-delete-button')).toBeTruthy()
      })

      fireEvent.press(getByTestId('cancel-delete-button'))

      expect(mockSessionService.deleteSession).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should display an error message when loading fails', async () => {
      mockSessionService.getAllSessions.mockRejectedValue(new Error('Failed to load sessions'))

      const { getByText } = renderScreen()

      await waitFor(() => {
        expect(getByText('Failed to load sessions')).toBeTruthy()
      })
    })

    it('should display an error message when delete fails', async () => {
      const sessions = [makeSession({ id: 's1' })]
      mockSessionService.getAllSessions.mockResolvedValue(sessions)
      mockSessionService.deleteSession.mockRejectedValue(new Error('Failed to delete session'))
      mockAuthStorage.getAuthToken.mockResolvedValue('test-token')

      const { getByTestId, getByText } = renderScreen()

      await waitFor(() => {
        expect(getByTestId('session-delete-s1')).toBeTruthy()
      })

      fireEvent.press(getByTestId('session-delete-s1'))

      await waitFor(() => {
        expect(getByTestId('confirm-delete-button')).toBeTruthy()
      })

      fireEvent.press(getByTestId('confirm-delete-button'))

      await waitFor(() => {
        expect(getByText('Failed to delete session')).toBeTruthy()
      })
    })
  })
})
