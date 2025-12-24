import AsyncStorage from '@react-native-async-storage/async-storage'
import { Signal } from './Signal'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage')

describe('Signal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with the initial value if no storage value exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      expect(signal.get()).toBe(42)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('Guidr_test', JSON.stringify(42))
    })

    it('should initialize with the value from storage if it exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(99))

      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      expect(signal.get()).toBe(99)
    })
  })

  describe('set', () => {
    it('should update the value and store it in AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      await signal.set(100)

      expect(signal.get()).toBe(100)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('Guidr_test', JSON.stringify(100))
    })

    it('should notify subscribers when the value changes', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      let subscribedValue: number | undefined
      const subscriber = (value: number) => {
        subscribedValue = value
      }

      signal.subscribe(subscriber)
      await signal.set(100)

      expect(subscribedValue).toBe(100)
    })
  })

  describe('subscribe/unsubscribe', () => {
    it('should allow subscribers to subscribe and receive updates', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      const values: number[] = []
      const subscriber = (value: number) => {
        values.push(value)
      }

      signal.subscribe(subscriber)
      await signal.set(100)
      await signal.set(200)

      expect(values).toEqual([100, 200])
    })

    it('should allow subscribers to unsubscribe', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      const signal = new Signal<number>('test', 42)
      await signal.initialize()

      let subscriberCalled = false
      const subscriber = () => {
        subscriberCalled = true
      }

      signal.subscribe(subscriber)
      signal.unsubscribe(subscriber)
      await signal.set(100)

      expect(subscriberCalled).toBe(false)
    })

    it('should support multiple subscribers', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      const signal = new Signal<string>('test', 'initial')
      await signal.initialize()

      const values1: string[] = []
      const values2: string[] = []

      signal.subscribe((v) => values1.push(v))
      signal.subscribe((v) => values2.push(v))

      await signal.set('first')
      await signal.set('second')

      expect(values1).toEqual(['first', 'second'])
      expect(values2).toEqual(['first', 'second'])
    })
  })

  describe('get', () => {
    it('should return the current value', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify('stored'))

      const signal = new Signal<string>('test', 'initial')
      await signal.initialize()

      expect(signal.get()).toBe('stored')
    })
  })
})
