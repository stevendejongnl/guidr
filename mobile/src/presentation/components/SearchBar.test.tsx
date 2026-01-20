import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        placeholder="Search guides..."
        testID="search"
      />
    )

    expect(getByPlaceholderText('Search guides...')).toBeDefined()
  })

  it('updates text on input change', () => {
    const onChangeText = jest.fn()
    const { getByTestId } = render(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        testID="search"
      />
    )

    const input = getByTestId('search:input')
    fireEvent.changeText(input, 'sourdough')

    expect(onChangeText).toHaveBeenCalledWith('sourdough')
  })

  it('shows clear button when text is present', () => {
    const { getByTestId } = render(
      <SearchBar
        value="search text"
        onChangeText={() => {}}
        testID="search"
      />
    )

    expect(getByTestId('search:clear')).toBeDefined()
  })

  it('hides clear button when text is empty', () => {
    const { queryByTestId } = render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        testID="search"
      />
    )

    expect(queryByTestId('search:clear')).toBeNull()
  })

  it('calls onChangeText and onClear when clear button is pressed', () => {
    const onChangeText = jest.fn()
    const onClear = jest.fn()
    const { getByTestId } = render(
      <SearchBar
        value="search text"
        onChangeText={onChangeText}
        onClear={onClear}
        testID="search"
      />
    )

    const clearButton = getByTestId('search:clear')
    fireEvent.press(clearButton)

    expect(onChangeText).toHaveBeenCalledWith('')
    expect(onClear).toHaveBeenCalled()
  })

  it('uses default placeholder when not provided', () => {
    const { getByPlaceholderText } = render(
      <SearchBar
        value=""
        onChangeText={() => {}}
        testID="search"
      />
    )

    expect(getByPlaceholderText('Search...')).toBeDefined()
  })
})
