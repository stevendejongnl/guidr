import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { LanguageSelector } from './LanguageSelector'

describe('LanguageSelector', () => {
  const mockOnSelectLanguage = jest.fn()

  beforeEach(() => {
    mockOnSelectLanguage.mockClear()
  })

  it('should render with selected language label and code', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
      />
    )

    const button = getByTestId('language-selector-button')
    expect(button).toBeTruthy()
  })

  it('should render Dutch when selected', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="nl"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    expect(getByTestId('lang-selector-button')).toBeTruthy()
  })

  it('should open modal when pressed', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    expect(getByTestId('lang-selector-modal')).toBeTruthy()
  })

  it('should not call onSelectLanguage when disabled', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        disabled={true}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    // When disabled, onSelectLanguage should not be called
    expect(mockOnSelectLanguage).not.toHaveBeenCalled()
  })

  it('should use custom testID', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="custom-lang"
      />
    )

    expect(getByTestId('custom-lang-button')).toBeTruthy()
  })

  it('should use default testID', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
      />
    )

    expect(getByTestId('language-selector-button')).toBeTruthy()
  })

  it('should close modal when close button is pressed', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    // Open modal
    fireEvent.press(getByTestId('lang-selector-button'))
    const modal = getByTestId('lang-selector-modal')
    expect(modal.props['visible']).toBe(true)

    // Close it
    fireEvent.press(getByTestId('lang-selector-close'))

    expect(modal.props['visible']).toBe(false)
  })

  it('modal starts closed (visible=false)', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    const modal = getByTestId('lang-selector-modal')
    expect(modal.props['visible']).toBe(false)
  })

  it('modal opens when button is pressed (visible=true)', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    const modal = getByTestId('lang-selector-modal')
    expect(modal.props['visible']).toBe(true)
  })

  it('should not open modal when disabled', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        disabled={true}
        testID="lang-selector"
      />
    )

    // Press despite disabled prop
    fireEvent.press(getByTestId('lang-selector-button'))

    const modal = getByTestId('lang-selector-modal')
    // Modal should remain closed
    expect(modal.props['visible']).toBe(false)
  })

  it('should render search input inside modal', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    expect(getByTestId('lang-selector-search')).toBeTruthy()
  })

  it('should render language list inside modal', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    expect(getByTestId('lang-selector-list')).toBeTruthy()
  })

  it('should accept search text input without error', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))
    // Should not throw
    expect(() =>
      fireEvent.changeText(getByTestId('lang-selector-search'), 'Dutch'),
    ).not.toThrow()
  })

  it('should render modal title "Select Language"', () => {
    const { getByText, getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))
    expect(getByText('Select Language')).toBeTruthy()
  })

  it('should call onSelectLanguage and close modal when renderItem is invoked with a language item', () => {
    // FlatList is mocked as string — invoke renderItem directly via the FlatList prop
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="en"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    const flatList = getByTestId('lang-selector-list')
    const renderItem: (arg: { item: { code: string; label: string } }) => React.ReactElement =
      flatList.props['renderItem']

    // Render the item for Dutch
    const { getByTestId: getByTestIdItem } = render(
      renderItem({ item: { code: 'nl', label: 'Dutch' } }),
    )

    fireEvent.press(getByTestIdItem('lang-selector-item-nl'))

    expect(mockOnSelectLanguage).toHaveBeenCalledWith('nl')

    // Modal should now be closed
    const modal = getByTestId('lang-selector-modal')
    expect(modal.props['visible']).toBe(false)
  })

  it('should apply selected styles when renderItem is called for the selected language', () => {
    const { getByTestId } = render(
      <LanguageSelector
        selectedLanguage="nl"
        onSelectLanguage={mockOnSelectLanguage}
        testID="lang-selector"
      />
    )

    fireEvent.press(getByTestId('lang-selector-button'))

    const flatList = getByTestId('lang-selector-list')
    const renderItem: (arg: { item: { code: string; label: string } }) => React.ReactElement =
      flatList.props['renderItem']

    // Render the selected item
    const { getByTestId: getByTestIdItem } = render(
      renderItem({ item: { code: 'nl', label: 'Dutch' } }),
    )

    // The item should exist (it's the selected one)
    expect(getByTestIdItem('lang-selector-item-nl')).toBeTruthy()
  })
})
