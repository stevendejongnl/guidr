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
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Test-Driven Development (TDD) with Jest
- **Development**: Arch Linux compatible

## Project Status

🚧 **In Development** - Core domain logic and architecture being built.

## Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run on Android
npx react-native run-android

# Build Android APK
cd android && ./gradlew assembleRelease
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
