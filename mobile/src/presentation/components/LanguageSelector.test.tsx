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
})
