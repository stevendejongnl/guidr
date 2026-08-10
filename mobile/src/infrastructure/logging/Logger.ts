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

  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled
  }

  isDebugMode(): boolean {
    return this.debugEnabled
  }

  /** Only emitted when debug mode is on. */
  debug(tag: string, message: string, data?: LogData): void {
    if (!this.debugEnabled) return
    const formatted = `[DEBUG][${tag}] ${message}${safeSerialize(data)}`
    console.log(formatted)
  }

  /** Always emitted to console. */
  info(tag: string, message: string, data?: LogData): void {
    const formatted = `[INFO][${tag}] ${message}${safeSerialize(data)}`
    console.log(formatted)
  }

  /** Always emitted to console. */
  warn(tag: string, message: string, data?: LogData): void {
    const formatted = `[WARN][${tag}] ${message}${safeSerialize(data)}`
    console.warn(formatted)
  }

  /** Always emitted to console. */
  error(tag: string, message: string, err?: unknown): void {
    const errStr = err instanceof Error ? err.message : err !== undefined ? String(err) : ''
    const formatted = `[ERROR][${tag}] ${message}${errStr ? ' ' + errStr : ''}`
    console.error(formatted)
  }
}

export const Logger = new AppLogger()
