export class Signal<T> {
  private key: string
  private value: T
  private subscribers: ((value: T) => void)[]

  constructor(key: string, initialValue: T) {
    this.key = `Schedulr_${key}`
    this.subscribers = []
    const storedValue = localStorage.getItem(this.key)
    if (storedValue !== null) {
      this.value = JSON.parse(storedValue)
    } else {
      this.value = initialValue
      localStorage.setItem(this.key, JSON.stringify(this.value))
    }
  }

  get(): T {
    return this.value
  }

  set(newValue: T): void {
    this.value = newValue
    localStorage.setItem(this.key, JSON.stringify(this.value))
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
