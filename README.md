# Guidr

Step-by-step guide execution app for Android/iOS with timed procedures, automatic notifications, and progress tracking.

## What is Guidr?

Multi-step process execution with precise timing: cooking recipes, workout routines, lab protocols, study sessions, maintenance tasks, beauty routines.

**Features**: Hierarchical organization | Step-by-step execution with timers | Smart notifications | Pause/resume | Offline-first | Cross-platform (Android/iOS, no store deployment)

## Tech Stack

- **Frontend**: React Native + TypeScript
- **Backend**: FastAPI + Python
- **Web**: React + TypeScript
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Test-Driven Development (TDD) with Jest
- **Dev**: Arch Linux compatible

**Status**: 🚧 In Development

## Project Structure

```
guidr/
├── mobile/              # React Native (Android/iOS)
├── api-server/         # FastAPI backend
├── web-app/            # React web app
├── docs/adr/           # Architectural decisions
└── scripts/            # Build scripts
```

## Prerequisites

- **Node.js**: 24.11.0+ LTS | **npm**: 11.6.0+
- **Android**: Java 17, Android SDK
- **iOS**: macOS + Xcode 15+
- **API**: Python 3.12+, Poetry

## Quick Start

**Mobile** (from `mobile/`):
```bash
npm install && npm test           # Install and test
npm start                         # Start Metro
npm run android                   # Run on Android
npm run ios                       # Run on iOS
./build-android.sh               # Build APK
```

**API** (Docker recommended):
```bash
docker pull ghcr.io/stevendejongnl/guidr-api-server:latest
docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-api-server:latest
```

Or locally:
```bash
cd api-server/ && poetry install && poetry run guidr-server
```

**Web** (from `web-app/`):
```bash
npm install && npm run dev
```

## Domain Model

```
Category → Guide → Step (timed action) → Session (active execution)
```

Clean architecture: domain entities, repositories, services, presentation layers strictly separated.

## License

Personal use only.
