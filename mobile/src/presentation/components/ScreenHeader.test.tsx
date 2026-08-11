import React from 'react'
import { Text } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { ScreenHeader } from './ScreenHeader'

describe('ScreenHeader', () => {
  it('renders the title', () => {
    const { getByText } = render(<ScreenHeader onBack={jest.fn()} title="Settings" />)
    expect(getByText('Settings')).toBeTruthy()
  })

  it('does not render a title element when title is omitted', () => {
    const { queryByText } = render(<ScreenHeader onBack={jest.fn()} />)
    expect(queryByText('Settings')).toBeFalsy()
  })

  it('calls onBack when the back button is pressed', () => {
    const onBack = jest.fn()
    const { getByTestId } = render(<ScreenHeader onBack={onBack} title="Settings" />)
    fireEvent.press(getByTestId('back-button'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('uses a custom back button testID when provided', () => {
    const { getByTestId } = render(
      <ScreenHeader onBack={jest.fn()} title="Settings" backTestID="settings-back-button" />
    )
    expect(getByTestId('settings-back-button')).toBeTruthy()
  })

  it('defaults the back button accessibility label to "Go back"', () => {
    const { getByLabelText } = render(<ScreenHeader onBack={jest.fn()} title="Settings" />)
    expect(getByLabelText('Go back')).toBeTruthy()
  })

  it('renders a custom right element when provided', () => {
    const { getByText } = render(
      <ScreenHeader onBack={jest.fn()} title="Guides" rightElement={<Text>+ New</Text>} />
    )
    expect(getByText('+ New')).toBeTruthy()
  })

  it('applies the header testID when provided', () => {
    const { getByTestId } = render(
      <ScreenHeader onBack={jest.fn()} title="Guides" testID="my-header" />
    )
    expect(getByTestId('my-header')).toBeTruthy()
  })
})
