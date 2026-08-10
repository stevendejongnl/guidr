export interface ServerConfig {
  url: string
  minAppVersion?: string
}

export interface AppConfig {
  server: ServerConfig
}
