import { DiagnosticLogService } from '../native/DiagnosticLogService'

type LogData = unknown

function safeSerialize(data: LogData): string {
  if (data === undefined) return ''
  try {
    return ' ' + JSON.stringify(data)
  } catch {
    return ' [unserializable]'
  }
}

class AppLogger {
  private debugEnabled = false
  private readonly service = new DiagnosticLogService()

  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled
  }

  isDebugMode(): boolean {
    return this.debugEnabled
  }

  /** Only emitted when debug mode is on. Goes to console + native log. */
  debug(tag: string, message: string, data?: LogData): void {
    if (!this.debugEnabled) return
    const formatted = `[DEBUG][${tag}] ${message}${safeSerialize(data)}`
    console.log(formatted)
    this.service.log(formatted).catch(() => {})
  }

  /** Always emitted to console; goes to native log only when debug mode is on. */
  info(tag: string, message: string, data?: LogData): void {
    const formatted = `[INFO][${tag}] ${message}${safeSerialize(data)}`
    console.log(formatted)
    if (this.debugEnabled) {
      this.service.log(formatted).catch(() => {})
    }
  }

  /** Always emitted to console and native log regardless of debug mode. */
  warn(tag: string, message: string, data?: LogData): void {
    const formatted = `[WARN][${tag}] ${message}${safeSerialize(data)}`
    console.warn(formatted)
    this.service.log(formatted).catch(() => {})
  }

  /** Always emitted to console and native log regardless of debug mode. */
  error(tag: string, message: string, err?: unknown): void {
    const errStr = err instanceof Error ? err.message : err !== undefined ? String(err) : ''
    const formatted = `[ERROR][${tag}] ${message}${errStr ? ' ' + errStr : ''}`
    console.error(formatted)
    this.service.log(formatted).catch(() => {})
  }
}

export const Logger = new AppLogger()
