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

// 1. Create symlink for react-native from root to mobile node_modules
// (Android gradle plugin expects react-native in mobile/node_modules)
const rootNodeModulesReactNative = path.join(rootNodeModulesDir, 'react-native');
const mobileNodeModulesReactNative = path.join(mobileNodeModulesDir, 'react-native');
if (fs.existsSync(rootNodeModulesReactNative)) {
  createSymlink(rootNodeModulesReactNative, mobileNodeModulesReactNative, 'react-native');
}

// 2. Create symlink for @sentry from root to mobile node_modules
// (Android build.gradle references mobile/node_modules/@sentry/react-native/sentry.gradle)
// Only needed when npm hoists @sentry to root (no --workspaces); skipped when it's already
// a real directory in mobile/node_modules (the --workspaces case).
const rootNodeModulesSentryScope = path.join(rootNodeModulesDir, '@sentry');
const mobileNodeModulesSentryScope = path.join(mobileNodeModulesDir, '@sentry');
if (fs.existsSync(rootNodeModulesSentryScope)) {
  createSymlink(rootNodeModulesSentryScope, mobileNodeModulesSentryScope, '@sentry');
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

// 5. Create symlink for @guidr/shared from root to mobile node_modules
// (Mobile app imports @guidr/shared from multiple files, Metro needs this in mobile/node_modules)
const mobileNodeModulesGuidr = path.join(mobileNodeModulesDir, '@guidr');
const rootGuidrShared = path.join(rootNodeModulesDir, '@guidr', 'shared');
const mobileGuidrShared = path.join(mobileNodeModulesGuidr, 'shared');

console.log('\n5. Setting up @guidr/shared symlink...');

if (fs.existsSync(rootGuidrShared)) {
  // Create @guidr directory if needed
  if (!fs.existsSync(mobileNodeModulesGuidr)) {
    fs.mkdirSync(mobileNodeModulesGuidr, { recursive: true });
    console.log('Created @guidr directory in mobile/node_modules');
  }

  createSymlink(rootGuidrShared, mobileGuidrShared, '@guidr/shared');
} else {
  console.log('⚠ @guidr/shared not found in root node_modules');
  console.log('This is expected if installing for the first time');
}

// 6. Create symlink for @react-native-community/cli from mobile to root node_modules
// (Gradle needs this when running from monorepo root to execute React Native CLI)
const mobileCliDir = path.join(mobileNodeModulesDir, '@react-native-community');
const rootCliDir = path.join(rootNodeModulesDir, '@react-native-community');

console.log('\n6. Setting up React Native CLI symlinks...');
if (fs.existsSync(mobileCliDir)) {
  // Create root @react-native-community directory if needed
  if (!fs.existsSync(rootCliDir)) {
    fs.mkdirSync(rootCliDir, { recursive: true });
  }

  // Symlink individual CLI packages
  const cliPackages = ['cli', 'cli-platform-android', 'cli-config-android', 'cli-doctor'];
  for (const pkg of cliPackages) {
    const srcPath = path.join(mobileCliDir, pkg);
    const destPath = path.join(rootCliDir, pkg);
    if (fs.existsSync(srcPath)) {
      createSymlink(srcPath, destPath, `@react-native-community/${pkg}`);
    }
  }
} else {
  console.log('⚠ @react-native-community CLI not found in mobile/node_modules');
}

console.log('\n✓ Workspace symlink setup complete');
