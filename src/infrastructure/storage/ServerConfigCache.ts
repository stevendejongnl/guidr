export interface CachedServerConfig {
  debugMode: boolean
}

export class ServerConfigCache {
  private static config: CachedServerConfig | null = null

  static setConfig(config: CachedServerConfig): void {
    this.config = config
  }

  static getConfig(): CachedServerConfig | null {
    return this.config
  }

  static hasConfig(): boolean {
    return this.config !== null
  }

  static clearConfig(): void {
    this.config = null
  }
}
