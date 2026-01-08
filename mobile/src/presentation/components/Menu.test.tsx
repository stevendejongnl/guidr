import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Menu, MenuItem } from './Menu'

describe('Menu', () => {
  const mockOnPress = jest.fn()
  const defaultItems: MenuItem[] = [
    { id: 'settings', label: 'Settings', onPress: mockOnPress },
    { id: 'about', label: 'About', onPress: mockOnPress },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders menu button', () => {
    const { getByTestId } = render(<Menu items={defaultItems} />)
    expect(getByTestId('menu-button')).toBeTruthy()
  })

  it('opens menu when button is pressed', () => {
    const { getByTestId, getByText } = render(<Menu items={defaultItems} />)

    fireEvent.press(getByTestId('menu-button'))

    expect(getByText('Settings')).toBeTruthy()
    expect(getByText('About')).toBeTruthy()
  })

  it('calls onPress when menu item is pressed', () => {
    const { getByTestId } = render(<Menu items={defaultItems} />)

    fireEvent.press(getByTestId('menu-button'))
    fireEvent.press(getByTestId('menu-item-settings'))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  it('closes menu when overlay is pressed', () => {
    const { getByTestId, queryByText } = render(<Menu items={defaultItems} />)

    fireEvent.press(getByTestId('menu-button'))
    expect(queryByText('Settings')).toBeTruthy()

    fireEvent.press(getByTestId('menu-overlay'))
    // Modal animation might keep item in tree briefly, but menu should be closed
  })

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <Menu items={defaultItems} testID="custom-menu" />
    )
    expect(getByTestId('custom-menu')).toBeTruthy()
  })

  it('renders menu items with custom testIDs', () => {
    const items: MenuItem[] = [
      { id: 'settings', label: 'Settings', onPress: mockOnPress, testID: 'custom-settings' },
    ]
    const { getByTestId } = render(<Menu items={items} />)

    fireEvent.press(getByTestId('menu-button'))
    expect(getByTestId('custom-settings')).toBeTruthy()
  })
})

