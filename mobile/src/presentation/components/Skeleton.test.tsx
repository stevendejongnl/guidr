import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Skeleton, SkeletonLines, SkeletonCard, SkeletonList } from './Skeleton'

describe('Skeleton', () => {
  it('renders a placeholder block with testID', () => {
    render(<Skeleton testID="skeleton-block" />)

    expect(screen.getByTestId('skeleton-block')).toBeTruthy()
  })

  it('applies the requested width and height', () => {
    render(<Skeleton testID="skeleton-block" width={120} height={20} />)

    expect(screen.getByTestId('skeleton-block')).toHaveStyle({ width: 120, height: 20 })
  })
})

describe('SkeletonLines', () => {
  it('renders the requested number of line placeholders', () => {
    render(<SkeletonLines testID="lines" count={4} />)

    // Each line is an unlabeled Skeleton block — assert via child count on the container.
    const container = screen.getByTestId('lines')
    expect(container.children).toHaveLength(4)
  })

  it('defaults to 3 lines when count is not provided', () => {
    render(<SkeletonLines testID="lines" />)

    expect(screen.getByTestId('lines').children).toHaveLength(3)
  })
})

describe('SkeletonCard', () => {
  it('renders with testID', () => {
    render(<SkeletonCard testID="skeleton-card" />)

    expect(screen.getByTestId('skeleton-card')).toBeTruthy()
  })
})

describe('SkeletonList', () => {
  it('renders `count` copies of the supplied item template', () => {
    render(
      <SkeletonList
        testID="skeleton-list"
        count={5}
        renderItem={(index) => <SkeletonCard key={index} testID={`item-${index}`} />}
      />
    )

    expect(screen.getByTestId('skeleton-list').children).toHaveLength(5)
    expect(screen.getByTestId('item-0')).toBeTruthy()
    expect(screen.getByTestId('item-4')).toBeTruthy()
  })
})
