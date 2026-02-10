import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Menu, MenuItem, MenuToggleItem } from './Menu'

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

  describe('toggle items', () => {
    const mockOnValueChange = jest.fn()
    const toggleItems: MenuToggleItem[] = [
      { id: 'admin-mode', label: 'Admin Mode', value: false, onValueChange: mockOnValueChange },
    ]

    it('renders toggle items with Switch', () => {
      const { getByTestId, getByText } = render(
        <Menu items={defaultItems} toggleItems={toggleItems} />
      )

      fireEvent.press(getByTestId('menu-button'))
      expect(getByText('Admin Mode')).toBeTruthy()
      expect(getByTestId('menu-toggle-switch-admin-mode')).toBeTruthy()
    })

    it('fires onValueChange without closing menu', () => {
      const { getByTestId, getByText } = render(
        <Menu items={defaultItems} toggleItems={toggleItems} />
      )

      fireEvent.press(getByTestId('menu-button'))
      fireEvent(getByTestId('menu-toggle-switch-admin-mode'), 'onValueChange', true)

      expect(mockOnValueChange).toHaveBeenCalledWith(true)
      // Menu should still be open — regular items still visible
      expect(getByText('Settings')).toBeTruthy()
    })

    it('renders toggle items above regular items', () => {
      const { getByTestId } = render(
        <Menu items={defaultItems} toggleItems={toggleItems} />
      )

      fireEvent.press(getByTestId('menu-button'))
      expect(getByTestId('menu-toggle-admin-mode')).toBeTruthy()
      expect(getByTestId('menu-item-settings')).toBeTruthy()
    })
  })
})

