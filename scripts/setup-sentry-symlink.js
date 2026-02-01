#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create symlink for @sentry from mobile/node_modules to root node_modules
// This is needed because iOS build scripts expect @sentry/react-native to be
// at root/node_modules/@sentry, but it's installed in mobile/node_modules

const rootDir = path.join(__dirname, '..');
const mobileNodeModulesSrc = path.join(rootDir, 'mobile/node_modules/@sentry');
const rootNodeModulesSentryDir = path.join(rootDir, 'node_modules/@sentry');
const rootNodeModulesDir = path.join(rootDir, 'node_modules');

// Only proceed if source exists
if (!fs.existsSync(mobileNodeModulesSrc)) {
  console.log('Skipping sentry symlink setup - mobile/@sentry not found yet');
  process.exit(0);
}

// Create node_modules directory if it doesn't exist
if (!fs.existsSync(rootNodeModulesDir)) {
  fs.mkdirSync(rootNodeModulesDir, { recursive: true });
}

// Remove existing symlink or directory if it exists
if (fs.existsSync(rootNodeModulesSentryDir)) {
  const stat = fs.lstatSync(rootNodeModulesSentryDir);
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(rootNodeModulesSentryDir);
  } else if (stat.isDirectory()) {
    console.log('@sentry directory exists at root node_modules - skipping symlink creation');
    process.exit(0);
  }
}

// Create symlink
try {
  fs.symlinkSync(mobileNodeModulesSrc, rootNodeModulesSentryDir, 'dir');
  console.log('Successfully created symlink for @sentry in root node_modules');
} catch (err) {
  console.error('Failed to create sentry symlink:', err.message);
  // Don't fail the entire install if symlink creation fails
  process.exit(0);
}
