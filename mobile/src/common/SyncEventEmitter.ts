type SyncHandler = (payload: Record<string, unknown>) => void

class SyncEventEmitterClass {
  private handlers: Map<string, Set<SyncHandler>> = new Map()

  on(type: string, handler: SyncHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    const set = this.handlers.get(type)
    if (set) {
      set.add(handler)
    }

    return () => {
      const set = this.handlers.get(type)
      if (set) {
        set.delete(handler)
        if (set.size === 0) {
          this.handlers.delete(type)
        }
      }
    }
  }

  emit(type: string, payload: Record<string, unknown>): void {
    const set = this.handlers.get(type)
    if (set) {
      for (const handler of set) {
        handler(payload)
      }
    }
  }

  removeAllListeners(): void {
    this.handlers.clear()
  }
}

export const SyncEventEmitter = new SyncEventEmitterClass()
