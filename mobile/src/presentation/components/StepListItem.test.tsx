import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { StepListItem } from './StepListItem'
import { Step } from '../../domain/entities/Step'

describe('StepListItem', () => {
  const mockStep = new Step('step-1', 'guide-1', 0, 'Test Step', 1800, 'Test description')
  const mockOnMoveUp = jest.fn()
  const mockOnMoveDown = jest.fn()
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders step title', () => {
      const { getByText } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(getByText('Test Step')).toBeTruthy()
    })

    it('renders step number', () => {
      const { getByText } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(getByText('1')).toBeTruthy()
    })

    it('renders step duration in minutes from seconds', () => {
      const { getByText } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(getByText('30 min')).toBeTruthy()
    })

    it('renders duration in hours and minutes for long durations', () => {
      const longStep = new Step('step-1', 'guide-1', 0, 'Long Step', 5400, 'Test')
      const { getByText } = render(
        <StepListItem
          step={longStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(getByText('1h 30m')).toBeTruthy()
    })

    it('hides duration when step has no timer', () => {
      const noTimerStep = new Step('step-1', 'guide-1', 0, 'No Timer', 0, 'Test')
      const { queryByText } = render(
        <StepListItem
          step={noTimerStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(queryByText('0 min')).toBeNull()
    })

    it('renders step description when present', () => {
      const { getByText } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(getByText('Test description')).toBeTruthy()
    })

    it('renders with testID', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step')).toBeTruthy()
    })
  })

  describe('Reorder Buttons', () => {
    it('enables up button when not first step', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={2}
          isFirst={false}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const upButton = getByTestId('test-step:move-up')
      expect(upButton).toBeTruthy()
      // Button should be enabled, check that it's not disabled
      expect(upButton.props['disabled']).not.toBe(true)
    })

    it('disables up button when first step', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const upButton = getByTestId('test-step:move-up')
      expect(upButton.props['disabled']).toBe(true)
    })

    it('enables down button when not last step', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const downButton = getByTestId('test-step:move-down')
      expect(downButton).toBeTruthy()
      expect(downButton.props['disabled']).not.toBe(true)
    })

    it('disables down button when last step', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={true}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const downButton = getByTestId('test-step:move-down')
      expect(downButton.props['disabled']).toBe(true)
    })

    it('calls onMoveUp when up button is pressed', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={2}
          isFirst={false}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const upButton = getByTestId('test-step:move-up')
      fireEvent.press(upButton)

      expect(mockOnMoveUp).toHaveBeenCalledWith('step-1')
    })

    it('calls onMoveDown when down button is pressed', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const downButton = getByTestId('test-step:move-down')
      fireEvent.press(downButton)

      expect(mockOnMoveDown).toHaveBeenCalledWith('step-1')
    })
  })

  describe('Edit and Delete Buttons', () => {
    it('renders edit button', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step:edit')).toBeTruthy()
    })

    it('calls onEdit when edit button is pressed', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const editButton = getByTestId('test-step:edit')
      fireEvent.press(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith('step-1')
    })

    it('renders delete button', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step:delete')).toBeTruthy()
    })

    it('calls onDelete when delete button is pressed', () => {
      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      const deleteButton = getByTestId('test-step:delete')
      fireEvent.press(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith('step-1')
    })
  })

  describe('Step Timer Integration', () => {
    const mockStep = new Step('step-1', 'guide-1', 0, 'Test Step', 300, 'Test description')
    const mockOnMoveUp = jest.fn()
    const mockOnMoveDown = jest.fn()
    const mockOnEdit = jest.fn()
    const mockOnDelete = jest.fn()
    const mockOnStart = jest.fn()
    const mockOnPause = jest.fn()
    const mockOnReset = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('does not render timer section without timer prop', () => {
      const { queryByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          testID="test-step"
        />
      )

      expect(queryByTestId('test-step:timer')).toBeNull()
      expect(queryByTestId('test-step:timer-start')).toBeNull()
    })

    it('renders timer display in MM:SS format when timer prop is provided', () => {
      const timer = {
        displaySeconds: 125,
        isRunning: false,
        isPaused: false,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByText, getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step:timer')).toBeTruthy()
      // 125 seconds = 2 minutes 5 seconds = "02:05"
      expect(getByText('02:05')).toBeTruthy()
    })

    it('shows Start button when timer is idle', () => {
      const timer = {
        displaySeconds: 300,
        isRunning: false,
        isPaused: false,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId, queryByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step:timer-start')).toBeTruthy()
      expect(queryByTestId('test-step:timer-pause')).toBeNull()
      expect(queryByTestId('test-step:timer-resume')).toBeNull()
    })

    it('shows Resume button when timer is paused', () => {
      const timer = {
        displaySeconds: 180,
        isRunning: false,
        isPaused: true,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId, getByText, queryByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      // When paused, the start button shows "Resume" text (same testID as start)
      expect(getByTestId('test-step:timer-start')).toBeTruthy()
      expect(getByText('Resume')).toBeTruthy()
      expect(queryByTestId('test-step:timer-pause')).toBeNull()
    })

    it('shows Pause button when timer is running', () => {
      const timer = {
        displaySeconds: 240,
        isRunning: true,
        isPaused: false,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId, queryByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      expect(getByTestId('test-step:timer-pause')).toBeTruthy()
      expect(queryByTestId('test-step:timer-start')).toBeNull()
      expect(queryByTestId('test-step:timer-resume')).toBeNull()
    })

    it('shows Complete message and only reset button when timer is complete', () => {
      const timer = {
        displaySeconds: 0,
        isRunning: false,
        isPaused: false,
        isComplete: true,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByText, getByTestId, queryByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      expect(getByText('Complete!')).toBeTruthy()
      expect(getByTestId('test-step:timer-reset')).toBeTruthy()
      expect(queryByTestId('test-step:timer-start')).toBeNull()
      expect(queryByTestId('test-step:timer-pause')).toBeNull()
      expect(queryByTestId('test-step:timer-resume')).toBeNull()
    })

    it('calls onStart when start button is pressed', () => {
      const timer = {
        displaySeconds: 300,
        isRunning: false,
        isPaused: false,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      const startButton = getByTestId('test-step:timer-start')
      fireEvent.press(startButton)

      expect(mockOnStart).toHaveBeenCalledTimes(1)
    })

    it('calls onPause when pause button is pressed', () => {
      const timer = {
        displaySeconds: 240,
        isRunning: true,
        isPaused: false,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      const pauseButton = getByTestId('test-step:timer-pause')
      fireEvent.press(pauseButton)

      expect(mockOnPause).toHaveBeenCalledTimes(1)
    })

    it('calls onReset when reset button is pressed', () => {
      const timer = {
        displaySeconds: 180,
        isRunning: false,
        isPaused: true,
        isComplete: false,
        mode: 'countdown' as const,
        onStart: mockOnStart,
        onPause: mockOnPause,
        onReset: mockOnReset,
      }

      const { getByTestId } = render(
        <StepListItem
          step={mockStep}
          stepNumber={1}
          isFirst={true}
          isLast={false}
          onMoveUp={mockOnMoveUp}
          onMoveDown={mockOnMoveDown}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          timer={timer}
          testID="test-step"
        />
      )

      const resetButton = getByTestId('test-step:timer-reset')
      fireEvent.press(resetButton)

      expect(mockOnReset).toHaveBeenCalledTimes(1)
    })
  })
})
