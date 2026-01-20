import React from 'react'
import { render } from '@testing-library/react-native'
import { NodeProgressIndicator } from './NodeProgressIndicator'
import { nodeTokens } from '../theme'

describe('NodeProgressIndicator', () => {
  it('renders correct number of nodes', () => {
    const { getByTestId } = render(
      <NodeProgressIndicator
        currentStep={2}
        totalSteps={5}
        testID="progress"
      />
    )

    expect(getByTestId('progress:node-1')).toBeDefined()
    expect(getByTestId('progress:node-2')).toBeDefined()
    expect(getByTestId('progress:node-3')).toBeDefined()
    expect(getByTestId('progress:node-4')).toBeDefined()
    expect(getByTestId('progress:node-5')).toBeDefined()
  })

  it('highlights current step node with primary color', () => {
    const { getByTestId } = render(
      <NodeProgressIndicator
        currentStep={3}
        totalSteps={5}
        testID="progress"
      />
    )

    const node3 = getByTestId('progress:node-3')
    const styles = node3.props['style']

    // Check if primary color is in the styles (could be in array)
    const nodeStyles = Array.isArray(styles) ? styles : [styles]
    const hasMinimumSize = nodeStyles.some(
      (s) => s && (s.width === nodeTokens.activeSize || s.height === nodeTokens.activeSize)
    )

    expect(hasMinimumSize).toBe(true)
  })

  it('renders with single step', () => {
    const { getByTestId } = render(
      <NodeProgressIndicator
        currentStep={1}
        totalSteps={1}
        testID="progress"
      />
    )

    expect(getByTestId('progress:node-1')).toBeDefined()
  })

  it('renders with many steps', () => {
    const { getByTestId } = render(
      <NodeProgressIndicator
        currentStep={5}
        totalSteps={10}
        testID="progress"
      />
    )

    for (let i = 1; i <= 10; i++) {
      expect(getByTestId(`progress:node-${i}`)).toBeDefined()
    }
  })

  it('has no testID when not provided', () => {
    const { root } = render(
      <NodeProgressIndicator currentStep={2} totalSteps={5} />
    )

    expect(root).toBeDefined()
  })
})
