#!/usr/bin/env node
/**
 * Watch mode for Android builds
 * Watches for file changes and triggers a rebuild
 */

const { spawn } = require('child_process')
const { watch } = require('fs')
const path = require('path')

// Directories and files to watch (relative to mobile/ directory)
const watchPaths = [
  'mobile/src',
  'mobile/android/app/src',
  'mobile/android/app/build.gradle',
  'mobile/android/build.gradle',
]

// Debounce timer
let debounceTimer = null
let isBuilding = false

const DEBOUNCE_MS = 1000

function runBuild() {
  if (isBuilding) {
    console.log('\n⏳ Build already in progress, queuing...')
    return
  }

  isBuilding = true
  console.log('\n🔨 Building Android...\n')

  const buildProcess = spawn('npm', ['run', 'android'], {
    cwd: path.resolve(__dirname, '..', 'mobile'),
    stdio: 'inherit',
    shell: true,
  })

  buildProcess.on('close', code => {
    isBuilding = false
    if (code === 0) {
      console.log('\n✅ Build completed successfully')
    } else {
      console.log(`\n❌ Build failed with code ${code}`)
    }
    console.log('\n👀 Watching for changes...\n')
  })
}

function onFileChange(eventType, filename) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    console.log(`\n📝 Change detected: ${filename || 'unknown file'}`)
    runBuild()
  }, DEBOUNCE_MS)
}

function watchDirectory(dir) {
  const fullPath = path.resolve(__dirname, '..', dir)
  try {
    watch(fullPath, { recursive: true }, onFileChange)
    console.log(`  📂 ${dir}`)
  } catch (err) {
    console.warn(`  ⚠️  Could not watch ${dir}: ${err.message}`)
  }
}

console.log('🚀 Starting Android watch mode...\n')
console.log('Watching directories:')
watchPaths.forEach(watchDirectory)
console.log('')

// Run initial build
runBuild()

