import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { NotesEditor } from './NotesEditor'
import type { Note } from './NotesEditor'

describe('NotesEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state', () => {
    const { getByTestId } = render(
      <NotesEditor
        notes={[]}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    expect(getByTestId('notes')).toBeTruthy()
    expect(getByTestId('notes:key-input')).toBeTruthy()
    expect(getByTestId('notes:value-input')).toBeTruthy()
    expect(getByTestId('notes:add-button')).toBeTruthy()
  })

  it('renders existing notes', () => {
    const notes: Note[] = [
      { key: 'difficulty', value: 'beginner' },
      { key: 'duration', value: '30min' },
    ]

    const { getByText } = render(
      <NotesEditor
        notes={notes}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    expect(getByText('difficulty: beginner')).toBeTruthy()
    expect(getByText('duration: 30min')).toBeTruthy()
  })

  it('adds note with key and value', () => {
    const { getByTestId } = render(
      <NotesEditor
        notes={[]}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    fireEvent.changeText(getByTestId('notes:key-input'), 'difficulty')
    fireEvent.changeText(getByTestId('notes:value-input'), 'beginner')
    fireEvent.press(getByTestId('notes:add-button'))

    expect(mockOnChange).toHaveBeenCalledWith([
      { key: 'difficulty', value: 'beginner' },
    ])
  })

  it('does not add note when key is empty', () => {
    const { getByTestId } = render(
      <NotesEditor
        notes={[]}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    fireEvent.changeText(getByTestId('notes:value-input'), 'some value')
    fireEvent.press(getByTestId('notes:add-button'))

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('removes note by index', () => {
    const notes: Note[] = [
      { key: 'difficulty', value: 'beginner' },
      { key: 'duration', value: '30min' },
    ]

    const { getByTestId } = render(
      <NotesEditor
        notes={notes}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    fireEvent.press(getByTestId('notes:remove-0'))

    expect(mockOnChange).toHaveBeenCalledWith([
      { key: 'duration', value: '30min' },
    ])
  })

  it('disables inputs when disabled prop is true', () => {
    const { getByTestId } = render(
      <NotesEditor
        notes={[]}
        onChange={mockOnChange}
        disabled={true}
        testID="notes"
      />
    )

    expect(getByTestId('notes:key-input').props['editable']).toBe(false)
    expect(getByTestId('notes:value-input').props['editable']).toBe(false)
  })

  it('applies key from suggestion', () => {
    const { getByTestId } = render(
      <NotesEditor
        notes={[]}
        onChange={mockOnChange}
        testID="notes"
      />
    )

    fireEvent.press(getByTestId('notes:key-difficulty'))

    expect(getByTestId('notes:key-input').props['value']).toBe('difficulty')
  })
})
