const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const {
  withSentryConfig
} = require("@sentry/react-native/metro");

const defaultConfig = getDefaultConfig(__dirname)

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'toml'],
  },
}

module.exports = withSentryConfig(mergeConfig(defaultConfig, config))