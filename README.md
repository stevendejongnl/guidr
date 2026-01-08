# Guidr

A step-by-step guide execution app for Android and iOS. Follow timed procedures with automatic notifications and progress tracking.

## What is Guidr?

Guidr helps you execute multi-step processes with precise timing. Create guides for anything from recipes to workout routines, then run them with active timers and notifications for each step.

**Example use cases:**
- Cooking recipes with timed steps
- Workout routines with rest periods
- Lab protocols and procedures
- Study sessions (Pomodoro technique)
- Maintenance tasks
- Beauty/skincare routines

## Features

- **Hierarchical organization**: Organize guides in nested categories
- **Step-by-step execution**: Run guides with automatic timers
- **Smart notifications**: Get alerts when each step completes
- **Pause/resume**: Interrupt and continue sessions without losing progress
- **Offline-first**: Works without internet, syncs when connected
- **Cross-platform**: Android and iOS (personal use, no store deployment)

## Tech Stack

- **Frontend**: React Native with TypeScript
- **Backend**: FastAPI with Python
- **Web**: React with TypeScript
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Test-Driven Development (TDD) with Jest
- **Development**: Arch Linux compatible

## Project Status

🚧 **In Development** - Core domain logic and architecture being built.

## Project Structure

This is a monorepo containing three main projects:

```
guidr/
├── mobile/              # React Native app (Android/iOS)
│   ├── src/            # App source code
│   ├── android/        # Android native code
│   ├── ios/            # iOS native code
│   └── package.json    # Mobile dependencies
├── api-server/         # FastAPI backend
│   ├── guidr_server/   # Server source code
│   └── pyproject.toml  # Python dependencies
├── web-app/            # React web app
│   ├── src/            # Web source code
│   └── package.json    # Web dependencies
└── scripts/            # Shared build/utility scripts
```

## Development

### Prerequisites
- **Node.js**: 24.12.0 LTS or newer (required)
- **npm**: 11.6.2 or newer (bundled with Node.js)
- **For Android**: Java 17, Android SDK
- **For iOS**: macOS with Xcode 15+
- **For API Server**: Python 3.11+, Poetry

### Quick Start

#### Mobile App
```bash
# Check Node.js version
node --version  # Should be 24.12.0 or newer

# Install dependencies (from root)
cd mobile/
npm install

# Run tests
npm test

# Start Metro bundler
npm start

# Run on Android (in another terminal)
npm run android

# Run on iOS (macOS only)
npm run ios

# Build Android APK
cd android && ./gradlew assembleRelease
```

#### API Server
```bash
# Using Docker (recommended)
docker pull ghcr.io/stevendejongnl/guidr-api-server:latest
docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-api-server:latest

# Or with Poetry (local development)
cd api-server/
poetry install
poetry run guidr-server
```

#### Web App
```bash
cd web-app/
npm install
npm run dev  # Start development server
```

## Architecture
```
Category
  └─> Guide (procedure/recipe)
       └─> Step (timed action)

Session (active guide execution)
```

Built with clean architecture principles: domain entities, repositories, services, and presentation layers are strictly separated.

## License

Personal use only.
