import { expect } from '@open-wc/testing'
import { Signal } from './signal.js'

describe('Signal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with the initial value if no localStorage value exists', () => {
    const signal = new Signal<number>('test', 42)
    expect(signal.get()).to.be.equal(42)
  })

  it('should initialize with the value from localStorage if it exists', () => {
    localStorage.setItem('Schedulr_test', JSON.stringify(99))
    const signal = new Signal<number>('test', 42)
    expect(signal.get()).to.be.equal(99)
  })

  it('should update the value and store it in localStorage', () => {
    const signal = new Signal<number>('test', 42)
    signal.set(100)
    expect(signal.get()).to.be.equal(100)
    expect(localStorage.getItem('Schedulr_test')).to.be.equal(JSON.stringify(100))
  })

  it('should notify subscribers when the value changes', () => {
    const signal = new Signal<number>('test', 42)
    let subscribedValue: number | undefined
    const subscriber = (x: number) => {
      subscribedValue = x
    }

    signal.subscribe(subscriber)
    signal.set(100)
    expect(subscribedValue).to.be.equal(100)
  })

  it('should allow subscribers to unsubscribe', () => {
    const signal = new Signal<number>('test', 42)
    let subscriberCalled = false
    const subscriber = () => {
      subscriberCalled = true
    }
    signal.subscribe(subscriber)
    signal.unsubscribe(subscriber)
    signal.set(100)
    expect(subscriberCalled).to.be.false
  })
})
