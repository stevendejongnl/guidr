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
    expect(container.props['style']).toMatchObject({
      position: 'absolute',
      bottom: 20,
      right: 20,
    })
  })
})
