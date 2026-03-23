import { MaintenanceEventEmitter } from './MaintenanceEventEmitter'

describe('MaintenanceEventEmitter', () => {
  beforeEach(() => {
    MaintenanceEventEmitter.setListener(null)
  })

  it('should call registered listener when emit is called', () => {
    const listener = jest.fn()
    MaintenanceEventEmitter.setListener(listener)
    MaintenanceEventEmitter.emit()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should not throw when emit is called with no listener', () => {
    expect(() => MaintenanceEventEmitter.emit()).not.toThrow()
  })

  it('should stop calling old listener after setListener(null)', () => {
    const listener = jest.fn()
    MaintenanceEventEmitter.setListener(listener)
    MaintenanceEventEmitter.setListener(null)
    MaintenanceEventEmitter.emit()
    expect(listener).not.toHaveBeenCalled()
  })

  it('should replace previous listener with new one', () => {
    const first = jest.fn()
    const second = jest.fn()
    MaintenanceEventEmitter.setListener(first)
    MaintenanceEventEmitter.setListener(second)
    MaintenanceEventEmitter.emit()
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
