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
- **iOS**: macOS + Xcode 26+, minimum iOS 26.0
- **API**: Python 3.12+, uv

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
cd api-server/ && uv sync && uv run guidr-server
```

**Web** (from `web-app/`):
```bash
npm install && npm run dev
```

## Security

### Dependency Scanning

Automated security scanning runs on every push via pre-push hooks:
- **npm packages** (mobile, web): Fails on HIGH/CRITICAL vulnerabilities
- **Python packages** (API): Uses pip-audit with suppression list

### Manual Scans

Run security audits on-demand:

```bash
npm run security:all           # Scan all packages
npm run security:mobile        # Scan mobile only (npm audit)
npm run security:web           # Scan web only (npm audit)
npm run security:api           # Scan API only (pip-audit)
npm run security:fix:mobile    # Auto-fix npm vulnerabilities (mobile)
npm run security:fix:web       # Auto-fix npm vulnerabilities (web)
```

### Known Issues

**CVE-2024-23342** (ecdsa timing attack on P-256):
- **Status**: Accepted with documented mitigation
- **Severity**: HIGH (CVSS 7.5)
- **Risk**: Low (API rate limiting, short-lived tokens)
- **Location**: API server → python-jose[cryptography] → ecdsa
- **Details**: See [ADR-015](./docs/adr/015-ecdsa-timing-attack-mitigation.md)
- **Mitigation**: Rate limiting, short-lived tokens (1 hour), quarterly reviews, key rotation

**Note**: For complete security policy including resolved vulnerabilities, see [SECURITY.md](./SECURITY.md).

## Domain Model

```
Category → Guide → Step (timed action) → Session (active execution)
```

Clean architecture: domain entities, repositories, services, presentation layers strictly separated.

## License

Personal use only.
