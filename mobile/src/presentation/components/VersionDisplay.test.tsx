import React from 'react'
import { render } from '@testing-library/react-native'
import { VersionDisplay } from './VersionDisplay'
import DeviceInfo from 'react-native-device-info'

jest.mock('react-native-device-info')

describe('VersionDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render version and build number', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.2.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('123')

    const { getByText } = render(<VersionDisplay />)

    expect(getByText('v1.2.0 (123)')).toBeTruthy()
  })

  it('should show version immediately with no loading state', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.0.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('1')

    const { getByText, queryByText } = render(<VersionDisplay />)

    expect(getByText('v1.0.0 (1)')).toBeTruthy()
    expect(queryByText('...')).toBeNull()
  })

  it('should handle error gracefully with fallback', () => {
    (DeviceInfo.getVersion as jest.Mock).mockImplementation(() => {
      throw new Error('Failed')
    });
    (DeviceInfo.getBuildNumber as jest.Mock).mockImplementation(() => {
      throw new Error('Failed')
    })

    const { getByText } = render(<VersionDisplay />)

    expect(getByText('v0.0.0 (0)')).toBeTruthy()
  })

  it('should be positioned absolutely in lower right', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.0.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('1')

    const { getByTestId } = render(<VersionDisplay />)

    const container = getByTestId('version-display')
    // The component uses useSafeAreaInsets() which returns 0 in tests
    // So the bottom position is insets.bottom (0) + spacing.sm (8) = 8
    const styles = container.props['style']
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: 'absolute', right: 20 }),
        expect.objectContaining({ bottom: 8 }),
      ])
    )
  })

  it('should render when isVisible is true', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.2.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('123')

    const { getByText } = render(<VersionDisplay isVisible={true} />)

    expect(getByText('v1.2.0 (123)')).toBeTruthy()
  })

  it('should not render when isVisible is false', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.2.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('123')

    const { queryByText, queryByTestId } = render(<VersionDisplay isVisible={false} />)

    expect(queryByText('v1.2.0 (123)')).toBeNull()
    expect(queryByTestId('version-display')).toBeNull()
  })

  it('should render by default when isVisible prop is omitted', () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.2.0');
    (DeviceInfo.getBuildNumber as jest.Mock).mockReturnValue('123')

    const { getByText } = render(<VersionDisplay />)

    expect(getByText('v1.2.0 (123)')).toBeTruthy()
  })
})
