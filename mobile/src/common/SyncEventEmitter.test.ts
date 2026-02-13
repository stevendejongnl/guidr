import { SyncEventEmitter } from './SyncEventEmitter'

describe('SyncEventEmitter', () => {
  beforeEach(() => {
    SyncEventEmitter.removeAllListeners()
  })

  it('calls handler when event is emitted', () => {
    const handler = jest.fn()
    SyncEventEmitter.on('timer.started', handler)
    SyncEventEmitter.emit('timer.started', { timerId: 't1' })

    expect(handler).toHaveBeenCalledWith({ timerId: 't1' })
  })

  it('does not call handler for different event type', () => {
    const handler = jest.fn()
    SyncEventEmitter.on('timer.started', handler)
    SyncEventEmitter.emit('timer.paused', { timerId: 't1' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('returns unsubscribe function', () => {
    const handler = jest.fn()
    const unsub = SyncEventEmitter.on('timer.started', handler)
    unsub()
    SyncEventEmitter.emit('timer.started', { timerId: 't1' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('supports multiple handlers for same event', () => {
    const h1 = jest.fn()
    const h2 = jest.fn()
    SyncEventEmitter.on('timer.started', h1)
    SyncEventEmitter.on('timer.started', h2)
    SyncEventEmitter.emit('timer.started', { timerId: 't1' })

    expect(h1).toHaveBeenCalled()
    expect(h2).toHaveBeenCalled()
  })

  it('only unsubscribes the specific handler', () => {
    const h1 = jest.fn()
    const h2 = jest.fn()
    const unsub1 = SyncEventEmitter.on('timer.started', h1)
    SyncEventEmitter.on('timer.started', h2)
    unsub1()
    SyncEventEmitter.emit('timer.started', { timerId: 't1' })

    expect(h1).not.toHaveBeenCalled()
    expect(h2).toHaveBeenCalled()
  })

  it('removeAllListeners clears all handlers', () => {
    const handler = jest.fn()
    SyncEventEmitter.on('timer.started', handler)
    SyncEventEmitter.on('timer.paused', handler)
    SyncEventEmitter.removeAllListeners()
    SyncEventEmitter.emit('timer.started', {})
    SyncEventEmitter.emit('timer.paused', {})

    expect(handler).not.toHaveBeenCalled()
  })
})
