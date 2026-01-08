export interface ServerConfig {
  url: string
  minAppVersion?: string
}

export interface AppConfig {
  server: ServerConfig
}

// Default configuration embedded in JavaScript bundle
// This acts as a fallback if the TOML file cannot be loaded
export const DEFAULT_CONFIG: AppConfig = {
  server: {
    url: 'https://guidr.madebysteven.nl',
    minAppVersion: '1.11.1',
  },
}
