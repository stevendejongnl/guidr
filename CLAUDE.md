# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Guidr** is a step-by-step guide execution app for Android and iOS. The app helps users execute multi-step processes with precise timing - from recipes to workout routines, lab protocols, and study sessions. Built with Domain-Driven Design principles and Test-Driven Development using bare React Native (not Expo) with TypeScript.

**Current Status**: Core domain logic complete (171 tests passing). Server URL configuration screen implemented. Android native directories initialized and build working with Gradle 8.13. Ready for feature development.

## Commands

### React Native Development

**Environment Setup (Required for npm run android)**:
React Native requires specific environment variables to run correctly:
- `JAVA_HOME`: Must point to Java 17 (Java 25+ not supported)
- `ANDROID_HOME`: Must point to Android SDK location

**Option 1 - Using direnv (recommended)**:
The `.envrc` file automatically sets these variables. Allow it with:
```bash
direnv allow
```

**Option 2 - Using the wrapper script**:
```bash
./run-android.sh  # Sets environment and runs npm run android
```

**Option 3 - Manual export**:
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=~/Android/Sdk
npm run android
```

```bash
# Start Metro bundler
npm start

# Run on Android (ensure environment is set, see above)
npm run android

# Run on iOS (macOS only)
npm run ios

# Build Android APK (use wrapper script to handle environment)
./build-android.sh

# Start Android emulator
emulator -avd Pixel_4  # or your AVD name
emulator -list-avds    # list available emulators

# Check connected devices
adb devices
```

**iOS Development Commands** (macOS only):
```bash
# Run on iOS simulator
npm run ios

# Install CocoaPods dependencies
cd ios && pod install

# Open Xcode workspace
open ios/guidr.xcworkspace

# List available simulators
xcrun simctl list devices available

# Boot specific simulator
xcrun simctl boot "iPhone 15"

# Build iOS simulator locally
./build-ios-simulator.sh
```

### Testing and Quality
```bash
# Run all tests (Jest)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint TypeScript/TSX files
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type check without emitting
npm run typecheck
```

## Architecture

### Tech Stack
- **Framework**: React Native (bare workflow) with TypeScript
- **State Management**: React hooks, AsyncStorage for persistence
- **Testing**: Jest + React Native Testing Library + ts-jest
- **Navigation**: React Navigation (planned)
- **Architecture**: Domain-Driven Design (DDD)
- **Development Approach**: Test-Driven Development (TDD)

### Domain-Driven Design Structure

```
src/
├── common/
│   ├── DependencyInjection.ts    # Simple DI container
│   └── Signal.ts                 # Reactive state with AsyncStorage persistence
├── domain/
│   ├── entities/                 # Core business objects
│   │   ├── Category.ts          # Hierarchical guide organization
│   │   ├── Guide.ts             # Guide metadata and step references
│   │   ├── Step.ts              # Individual timed actions
│   │   └── Session.ts           # State machine for guide execution
│   ├── repositories/            # Data access interfaces
│   │   ├── ICategoryRepository.ts
│   │   ├── IGuideRepository.ts
│   │   ├── IStepRepository.ts
│   │   └── ISessionRepository.ts
│   └── services/                # Business logic orchestration
│       ├── CategoryService.ts   # Category CRUD and hierarchy management
│       ├── GuideService.ts      # Guide CRUD and step association
│       └── SessionService.ts    # Session state machine and step validation
├── infrastructure/
│   └── storage/
│       └── ServerConfigStorage.ts  # AsyncStorage wrapper for server URL
└── presentation/
    ├── screens/
    │   ├── ServerSetupScreen.tsx   # One-time server configuration
    │   └── HomeScreen.tsx          # Placeholder home screen
    ├── navigation/
    │   └── AppNavigator.tsx        # Route logic (setup vs home)
    └── App.tsx                     # Main app entry point
```

### Domain Concepts

**Entities** (with comprehensive tests):
- **Category**: Hierarchical organization (parent-child relationships)
- **Guide**: Contains ordered steps, belongs to a category
- **Step**: Has order, title, description, duration in seconds
- **Session**: State machine (NotStarted → InProgress ⇄ Paused → Completed/Cancelled)

**Services** (with mocked repository tests):
- Use dependency injection
- Generate UUIDs for new entities
- Orchestrate entity operations and repository calls
- Enforce business rules (e.g., steps must belong to guide)

**Repository Interfaces**:
- Define contracts for data access
- Implementations pending (will use API client)

### Session State Machine

```
NotStarted ──start()──> InProgress
                          ├──pause()──> Paused
                          │             └──resume()──> InProgress
                          ├──complete()──> Completed
                          └──cancel()──> Cancelled

Active states (can moveToStep): InProgress, Paused
Terminal states: Completed, Cancelled
```

## Testing

### Testing Stack
- **Test Runner**: Jest with ts-jest preset
- **React Native Testing**: @testing-library/react-native
- **Mocking**: jest.mock(), React Native components mocked in `__mocks__/`
- **Coverage**: 171 tests passing (entities, services, storage, screens)

### TDD Workflow (RED-GREEN-REFACTOR)
1. **RED**: Write failing test first
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve code while keeping tests green
4. **Verify**: `npm test && npm run lint && npm run typecheck`

### Test Categories
- **Entity Tests**: Business logic, validation, state management
- **Service Tests**: Mocked repositories, business rules, error handling
- **Storage Tests**: Mocked AsyncStorage, validation
- **Screen Tests**: Mocked dependencies, user interactions, loading states

### Example Test Pattern (Service with Mocked Repository)
```typescript
describe('GuideService', () => {
  let guideService: GuideService
  let mockGuideRepository: jest.Mocked<IGuideRepository>
  let mockStepRepository: jest.Mocked<IStepRepository>

  beforeEach(() => {
    mockGuideRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      // ...
    }
    mockStepRepository = { /* ... */ }
    guideService = new GuideService(mockGuideRepository, mockStepRepository)
  })

  it('should create guide with generated ID', async () => {
    const guide = await guideService.createGuide('cat-1', 'Title')
    expect(guide.id).toBeDefined()
    expect(mockGuideRepository.save).toHaveBeenCalledWith(guide)
  })
})
```

## First-Time Setup

### Server URL Configuration
On first launch, users see **ServerSetupScreen** to enter their Guidr server URL:
- Validates URL format (HTTP/HTTPS only)
- Stores in AsyncStorage via ServerConfigStorage
- Shows errors for invalid URLs
- Redirects to HomeScreen after successful save

AppNavigator checks for server URL on mount and routes accordingly.

## Code Style and Conventions

### TypeScript
- **Strict mode**: All strict flags enabled
- **No implicit any**: All types must be explicit
- **Path aliases**: Use `@domain/`, `@infrastructure/`, `@presentation/`, `@common/`
- **React Native JSX**: Configured in tsconfig.json

### React Native Components
- **Functional components**: Always use `React.FC`
- **Hooks**: useState, useEffect (follow rules of hooks)
- **StyleSheet**: Use StyleSheet.create() for all styles
- **Accessibility**: Always set accessibilityState for buttons

### Entity Design
- **Readonly identity fields**: `readonly id: string`
- **Private mutable fields**: `private _name: string` with getters
- **Validation in constructor**: Throw errors for invalid state
- **Update methods**: Validate input, update _updatedAt timestamp
- **Immutable getters**: Return copies for arrays (e.g., `get stepIds()` returns `[...this._stepIds]`)

### Service Design
- **Dependency injection**: Accept repositories in constructor
- **UUID generation**: Use `react-native-uuid` for IDs
- **Error messages**: Clear, actionable (e.g., "Category with id cat-1 not found")
- **Async operations**: All repository calls are async

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
- **Lint**: ESLint on all TypeScript/TSX files
- **Test**: Run full Jest suite
- **Typecheck**: Verify TypeScript compilation
- **Android Build**: Builds debug APK and uploads as artifact
- **iOS Build**: Builds simulator .app and uploads as artifact (requires ios/ directory)

All checks must pass before merging.

## Development Guidelines

### Before Implementing Features
1. Read relevant entity/service files to understand existing patterns
2. Write tests first (TDD)
3. Implement minimal code to pass tests
4. Verify: `npm test && npm run lint && npm run typecheck`

### When Adding New Entities
1. Create entity class with validation
2. Write comprehensive entity tests
3. Create repository interface
4. Create service with dependency injection
5. Write service tests with mocked repository
6. Follow existing patterns (Category, Guide, Step, Session)

### When Adding New Screens
1. Create screen component with TypeScript
2. Write screen tests using React Native Testing Library
3. Mock dependencies (services, storage)
4. Test user interactions, loading states, error handling
5. Add to AppNavigator

### Avoid Over-Engineering
- Don't add features not explicitly requested
- Don't add error handling for impossible scenarios
- Don't create abstractions for one-time operations
- Keep it simple: three similar lines > premature abstraction

## Common Issues and Solutions

### Jest + React Native Testing
- React Native modules must be mocked (`__mocks__/react-native.js`)
- Use ts-jest preset, not react-native preset (Babel issues)
- JSX transform: `jsx: 'react'` in jest.config.js
- AsyncStorage must be mocked in tests

### TypeScript Strict Mode
- Use bracket notation for test props: `props['value']` instead of `props.value`
- All entity constructor params must be validated
- No optional params without explicit `undefined` type

### npm run android Hangs or Fails
If `npm run android` hangs without output or fails:
- **Cause**: React Native CLI requires Java 17-20 (not Java 25+) and `ANDROID_HOME` set
- **Solution**: Use direnv (`.envrc`), the wrapper script (`./run-android.sh`), or manually export environment variables
- **Diagnosis**: Run `npx react-native doctor` to check environment issues

### Git Workflow
- Commits: Clear, descriptive messages
- No mention of Claude/AI assistants in commits
- Push after completing each phase

### Android Build Configuration

**Build Setup**:
- **Gradle**: 8.13 (stable, tested with React Native 0.83.1)
- **Android Gradle Plugin**: Managed by React Native 0.83.1
- **Build Tools**: 36.0.0
- **NDK**: 27.1.12297006
- **Kotlin**: 2.1.20
- **Target SDK**: 36
- **Package**: com.guidr
- **Java Version**: 17 (required for Gradle 8.13)

**Why Gradle 8.13?**:
The project uses Gradle 8.13 instead of Gradle 9.0 (which ships with React Native 0.83.1) because Gradle 9.0 introduced breaking changes with CMake native builds that prevent successful APK compilation. Gradle 8.13 is stable, fully compatible with React Native's build system, and widely tested.

**Java Version Note**:
The build script (`build-android.sh`) sets `JAVA_HOME=/usr/lib/jvm/java-17-openjdk` because Gradle 8.13 requires Java 17 and does not support Java 25+. On systems with Java 25 as the default, the build will automatically use Java 17.

### iOS Build Configuration

**Build Setup**:
- **Xcode**: 15+ (tested with GitHub Actions macos-15 runner)
- **CocoaPods**: Latest stable (managed by React Native)
- **Target**: iOS 13+ minimum (React Native 0.83.1 requirement)
- **Bundle Identifier**: com.guidr
- **Build Type**: Simulator build (Debug configuration)
- **Signing**: None required (CODE_SIGNING_ALLOWED=NO)

**Why Simulator Build?**
The project uses iOS simulator builds in CI/CD to avoid requiring an Apple Developer account ($99/year). Simulator builds are sufficient for:
- Verifying code compiles successfully
- Running automated tests
- Type checking and lint validation
- Local development and testing

**Local iOS Development**:
```bash
# Run on iOS simulator (macOS only)
npm run ios

# Install/update CocoaPods dependencies
cd ios && pod install

# Open Xcode workspace for development
open ios/guidr.xcworkspace
```

**CI/CD iOS Build**:
- Uses macos-15 runner (GitHub Actions)
- Direct xcodebuild commands (no signing)
- Builds for iOS Simulator (iPhone 15)
- Produces .app artifact (7-day retention)

**Upgrading to Device Builds** (Future):
When you're ready to distribute to physical devices:
1. Enroll in Apple Developer Program ($99/year)
2. Create development certificates and provisioning profiles
3. Update CI/CD workflow to build for device (`-sdk iphoneos`)
4. Add certificate/profile management to workflow
5. Change output from .app to .ipa

**Cost Considerations**:
- iOS builds use macOS runners: ~$0.96 per build (12 minutes @ $0.08/min)
- Android builds use ubuntu runners: ~$0.04 per build (5 minutes @ $0.008/min)
- Consider using path filters to skip unnecessary builds

## Next Steps

**Planned Features** (not yet implemented):
- Repository implementations (API client)
- Category/Guide/Step CRUD screens
- Session execution screen with timer
- Notifications for step completion
- Offline sync with backend

**Backend Requirements** (not yet implemented):
- REST API for CRUD operations
- Guide/Step/Session persistence
- User authentication (optional)
