import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { StepListItem } from './StepListItem'
import { Step } from '../../domain/entities/Step'

describe('StepListItem', () => {
  const mockStep = new Step('step-1', 'guide-1', 0, 'Test Step', 30, 'Test description')
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

    it('renders step duration in minutes', () => {
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
      const longStep = new Step('step-1', 'guide-1', 0, 'Long Step', 90, 'Test')
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
})
