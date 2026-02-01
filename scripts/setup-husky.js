#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Only setup husky in local development, not in CI
if (process.env.CI === 'true') {
  console.log('Skipping husky setup in CI environment');
  process.exit(0);
}

try {
  // Check if husky is installed
  const huskyPath = path.join(__dirname, '../node_modules/.bin/husky');
  if (!fs.existsSync(huskyPath)) {
    console.log('Husky not found - skipping setup');
    process.exit(0);
  }

  // Run husky install
  execSync('husky install', { stdio: 'inherit' });
  console.log('✓ Husky hooks installed');
} catch (err) {
  console.error('Failed to setup husky:', err.message);
  // Don't fail the install if husky setup fails
  process.exit(0);
}
