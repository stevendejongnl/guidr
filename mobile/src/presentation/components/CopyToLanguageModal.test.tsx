import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CopyToLanguageModal } from './CopyToLanguageModal'

describe('CopyToLanguageModal', () => {
  const mockOnClose = jest.fn()
  const mockOnCopy = jest.fn()
  const mockOnTranslate = jest.fn()

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onCopy: mockOnCopy,
    onTranslate: mockOnTranslate,
    isBeta: false,
    currentLanguage: 'en',
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnCopy.mockClear()
    mockOnTranslate.mockClear()
  })

  it('should render the modal with title', () => {
    const { getByText } = render(
      <CopyToLanguageModal {...defaultProps} />
    )

    expect(getByText('Copy to Language')).toBeTruthy()
  })

  it('should render copy button', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} />
    )

    expect(getByTestId('copy-to-language-modal:copy-button')).toBeTruthy()
  })

  it('should not render translate button when not beta', () => {
    const { queryByTestId } = render(
      <CopyToLanguageModal {...defaultProps} isBeta={false} />
    )

    expect(queryByTestId('copy-to-language-modal:translate-button')).toBeNull()
  })

  it('should render translate button when beta', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} isBeta={true} />
    )

    expect(getByTestId('copy-to-language-modal:translate-button')).toBeTruthy()
  })

  it('should show same-language warning when target matches source', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} currentLanguage="en" />
    )

    expect(getByTestId('copy-to-language-modal:same-language-warning')).toBeTruthy()
  })

  it('should call onClose when close button pressed', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} />
    )

    fireEvent.press(getByTestId('copy-to-language-modal:close'))

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading indicator when loading', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} loading={true} />
    )

    expect(getByTestId('copy-to-language-modal:loading')).toBeTruthy()
  })

  it('should use custom testID', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} testID="custom-modal" />
    )

    expect(getByTestId('custom-modal')).toBeTruthy()
    expect(getByTestId('custom-modal:copy-button')).toBeTruthy()
  })

  it('should render language selector', () => {
    const { getByTestId } = render(
      <CopyToLanguageModal {...defaultProps} />
    )

    expect(getByTestId('copy-to-language-modal:language-selector')).toBeTruthy()
  })
})
