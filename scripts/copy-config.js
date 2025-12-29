#!/usr/bin/env node

/**
 * Copy configuration file to platform-specific locations
 * This script ensures the config file is available for both Android and iOS builds
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const configFile = 'default-configuration.toml'
const sourcePath = path.join(projectRoot, configFile)

// Target locations
const androidAssetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets')
const iosGuidrDir = path.join(projectRoot, 'ios', 'guidr')

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
}

function copyFile(source, destDir, filename) {
  const destPath = path.join(destDir, filename)
  try {
    fs.copyFileSync(source, destPath)
    console.log(`Copied ${filename} to ${destDir}`)
  } catch (error) {
    console.error(`Failed to copy ${filename} to ${destDir}:`, error.message)
    process.exit(1)
  }
}

// Check if source config file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`Configuration file not found: ${sourcePath}`)
  process.exit(1)
}

console.log('Copying configuration file to platform directories...')

// Copy to Android assets
ensureDirectoryExists(androidAssetsDir)
copyFile(sourcePath, androidAssetsDir, configFile)

// Copy to iOS guidr directory
ensureDirectoryExists(iosGuidrDir)
copyFile(sourcePath, iosGuidrDir, configFile)

console.log('Configuration file copied successfully!')

