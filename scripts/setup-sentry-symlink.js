#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const rootNodeModulesDir = path.join(rootDir, 'node_modules');
const mobileNodeModulesDir = path.join(rootDir, 'mobile/node_modules');

// Helper function to create symlinks
function createSymlink(srcPath, destPath, linkName) {
  // Only proceed if source exists
  if (!fs.existsSync(srcPath)) {
    console.log(`Skipping ${linkName} - source not found`);
    return false;
  }

  // Create destination directory if needed
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Remove existing symlink if it exists
  if (fs.existsSync(destPath)) {
    const stat = fs.lstatSync(destPath);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destPath);
    } else {
      console.log(`${linkName} directory exists - skipping symlink creation`);
      return false;
    }
  }

  // Create the symlink
  try {
    fs.symlinkSync(srcPath, destPath, 'dir');
    console.log(`✓ Created symlink for ${linkName}`);
    return true;
  } catch (err) {
    console.error(`✗ Failed to create ${linkName} symlink:`, err.message);
    return false;
  }
}

// 1. Create symlink for @sentry from mobile to root node_modules
// (iOS build scripts expect @sentry/react-native at root/node_modules/@sentry)
const mobileNodeModulesSentry = path.join(rootDir, 'mobile/node_modules/@sentry');
const rootNodeModulesSentry = path.join(rootNodeModulesDir, '@sentry');
if (fs.existsSync(mobileNodeModulesSentry)) {
  createSymlink(mobileNodeModulesSentry, rootNodeModulesSentry, '@sentry');
}

// 2. Create symlink for react-native from root to mobile node_modules
// (Android gradle plugin expects react-native in mobile/node_modules)
const rootNodeModulesReactNative = path.join(rootNodeModulesDir, 'react-native');
const mobileNodeModulesReactNative = path.join(mobileNodeModulesDir, 'react-native');
if (fs.existsSync(rootNodeModulesReactNative)) {
  createSymlink(rootNodeModulesReactNative, mobileNodeModulesReactNative, 'react-native');
}

// 3. Create symlink for @react-native/codegen from root to mobile node_modules
// (React Native gradle plugin needs this too)
const rootNodeModulesCodegen = path.join(rootNodeModulesDir, '@react-native/codegen');
const mobileNodeModulesCodegen = path.join(mobileNodeModulesDir, '@react-native/codegen');
if (fs.existsSync(rootNodeModulesCodegen)) {
  createSymlink(rootNodeModulesCodegen, mobileNodeModulesCodegen, '@react-native/codegen');
}

// 4. Create symlink for @react-native/metro-config from root to mobile node_modules
// (Metro bundler needs this when Gradle runs createBundleReleaseJsAndAssets)
const rootNodeModulesMetroConfig = path.join(rootNodeModulesDir, '@react-native/metro-config');
const mobileNodeModulesMetroConfig = path.join(mobileNodeModulesDir, '@react-native/metro-config');
if (fs.existsSync(rootNodeModulesMetroConfig)) {
  createSymlink(rootNodeModulesMetroConfig, mobileNodeModulesMetroConfig, '@react-native/metro-config');
}
