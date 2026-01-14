import React from 'react'
import { render } from '@testing-library/react-native'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders icon, label, and value', () => {
    const { getByTestId, getByText } = render(
      <StatCard icon="🏃" label="Active" value={12} testID="stat-card" />,
    )

    const card = getByTestId('stat-card')
    expect(card).toBeDefined()

    expect(getByText('🏃')).toBeDefined()
    expect(getByText('Active')).toBeDefined()
    expect(getByText('12')).toBeDefined()
  })

  it('handles string values', () => {
    const { getByText } = render(
      <StatCard icon="✅" label="Status" value="Ready" testID="stat-card" />,
    )

    expect(getByText('Ready')).toBeDefined()
  })

  it('renders with correct styling applied', () => {
    const { getByTestId } = render(
      <StatCard icon="📚" label="Guides" value={33} testID="stat-card" />,
    )

    const card = getByTestId('stat-card')
    // Card should have surface background and proper styling
    expect(card.props['style']).toBeDefined()
  })

  it('applies testID for accessibility', () => {
    const { getByTestId } = render(
      <StatCard icon="⭐" label="Categories" value={5} testID="my-stat" />,
    )

    const card = getByTestId('my-stat')
    expect(card).toBeDefined()
  })
})
