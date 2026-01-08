import AsyncStorage from '@react-native-async-storage/async-storage'

export class Signal<T> {
  private key: string
  private value: T
  private subscribers: ((value: T) => void)[]
  private initialized: boolean

  constructor(key: string, initialValue: T) {
    this.key = `Guidr_${key}`
    this.subscribers = []
    this.value = initialValue
    this.initialized = false
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    const storedValue = await AsyncStorage.getItem(this.key)
    if (storedValue !== null) {
      this.value = JSON.parse(storedValue)
    } else {
      await AsyncStorage.setItem(this.key, JSON.stringify(this.value))
    }

    this.initialized = true
  }

  get(): T {
    return this.value
  }

  async set(newValue: T): Promise<void> {
    this.value = newValue
    await AsyncStorage.setItem(this.key, JSON.stringify(this.value))
    this.notifySubscribers()
  }

  subscribe(callback: (value: T) => void): void {
    this.subscribers.push(callback)
  }

  unsubscribe(callback: (value: T) => void): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback)
  }

  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.value)
    }
  }
}
