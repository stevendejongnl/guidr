import React from 'react'
import { render } from '@testing-library/react-native'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders completed status', () => {
    const { getByText } = render(
      <StatusBadge status="completed" testID="badge" />
    )

    expect(getByText('Completed')).toBeDefined()
  })

  it('renders in-progress status', () => {
    const { getByText } = render(
      <StatusBadge status="in-progress" testID="badge" />
    )

    expect(getByText('In Progress')).toBeDefined()
  })

  it('renders paused status', () => {
    const { getByText } = render(
      <StatusBadge status="paused" testID="badge" />
    )

    expect(getByText('Paused')).toBeDefined()
  })

  it('renders not-started status', () => {
    const { getByText } = render(
      <StatusBadge status="not-started" testID="badge" />
    )

    expect(getByText('Not Started')).toBeDefined()
  })

  it('renders solid variant by default', () => {
    const { getByTestId } = render(
      <StatusBadge status="completed" testID="badge" />
    )

    const badge = getByTestId('badge')
    expect(badge).toBeDefined()
  })

  it('renders outline variant', () => {
    const { getByTestId } = render(
      <StatusBadge status="completed" variant="outline" testID="badge" />
    )

    const badge = getByTestId('badge')
    expect(badge).toBeDefined()
  })

  it('renders all status types', () => {
    const { getByText: getByTextCompleted } = render(
      <StatusBadge status="completed" testID="badge-completed" />
    )
    const { getByText: getByTextInProgress } = render(
      <StatusBadge status="in-progress" testID="badge-in-progress" />
    )
    const { getByText: getByTextPaused } = render(
      <StatusBadge status="paused" testID="badge-paused" />
    )
    const { getByText: getByTextNotStarted } = render(
      <StatusBadge status="not-started" testID="badge-not-started" />
    )

    expect(getByTextCompleted('Completed')).toBeDefined()
    expect(getByTextInProgress('In Progress')).toBeDefined()
    expect(getByTextPaused('Paused')).toBeDefined()
    expect(getByTextNotStarted('Not Started')).toBeDefined()
  })
})
