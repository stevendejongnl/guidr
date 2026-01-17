import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders message', () => {
    const { getByText } = render(<EmptyState icon="📭" message="No categories yet" />)
    expect(getByText('No categories yet')).toBeTruthy()
  })

  it('does not render action button when not provided', () => {
    const { queryByText } = render(<EmptyState icon="📭" message="No categories yet" />)
    expect(queryByText('Create')).toBeFalsy()
  })

  it('renders action button when provided', () => {
    const { getByText } = render(
      <EmptyState
        icon="📭"
        message="No categories yet"
        actionLabel="Create"
        onAction={jest.fn()}
      />
    )
    expect(getByText('Create')).toBeTruthy()
  })

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn()
    const { getByText } = render(
      <EmptyState
        icon="📭"
        message="No categories yet"
        actionLabel="Create"
        onAction={onAction}
      />
    )
    fireEvent.press(getByText('Create'))
    expect(onAction).toHaveBeenCalled()
  })
})
