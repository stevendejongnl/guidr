const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const {
  withSentryConfig
} = require("@sentry/react-native/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const defaultConfig = getDefaultConfig(__dirname)

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  projectRoot: projectRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'toml'],
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
}

module.exports = withSentryConfig(mergeConfig(defaultConfig, config))