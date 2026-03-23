type MaintenanceListener = () => void

let listener: MaintenanceListener | null = null

export const MaintenanceEventEmitter = {
  setListener(fn: MaintenanceListener | null): void {
    listener = fn
  },
  emit(): void {
    listener?.()
  },
}
