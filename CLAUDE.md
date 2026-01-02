# CLAUDE.md

Project guidance for Claude Code when working with this repository.

## Project Overview

**Guidr** - Step-by-step guide execution app for Android/iOS. Multi-step processes with precise timing (recipes, workouts, lab protocols). Built with Domain-Driven Design (DDD) and Test-Driven Development (TDD) using bare React Native + TypeScript.

**Status**: Core domain logic complete (171 tests passing). Server URL configuration screen implemented. Android native directories initialized with Gradle 8.13. Ready for feature development.

**Tech Stack**: React Native 0.83.1 (bare workflow) | TypeScript (strict) | Jest + React Native Testing Library | AsyncStorage | React Navigation (planned)

## Prerequisites

- **Node.js**: 24.12.0+ LTS (use nvm: `nvm install 24 && nvm use 24` or `.nvmrc`)
- **npm**: 11.6.2+
- **Java**: 17 (Gradle 8.13 requirement, no Java 25+ support)
- **Android SDK**: Required for Android builds
- **Xcode**: 15+ (macOS only, for iOS)

## Quick Commands

### Development
```bash
npm start                    # Metro bundler
npm run android             # Android (set JAVA_HOME + ANDROID_HOME first)
./run-android.sh            # Android with auto-environment
npm run ios                 # iOS simulator (macOS only)
```

### Environment Setup (Required for Android)
```bash
# Option 1: direnv (recommended)
direnv allow

# Option 2: Manual export
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=~/Android/Sdk
```

### Testing & Quality
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run lint                # Lint TypeScript
npm run lint:fix            # Auto-fix lint issues
npm run typecheck           # Type check only
```

### API Server (FastAPI)
```bash
# Docker (recommended)
docker pull ghcr.io/stevendejongnl/guidr-api-server:latest
docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-api-server:latest

# Poetry (local dev)
cd api-server && poetry install && poetry run guidr-server

# Connection URLs
# Android emulator: http://10.0.2.2:8000
# iOS simulator: http://localhost:8000
# Physical device: http://<your-ip>:8000
```

### Build Commands
```bash
./build-android.sh          # Android APK (handles Java 17 setup)
./build-ios-simulator.sh    # iOS simulator .app (macOS only)
adb devices                 # Check connected Android devices
emulator -list-avds         # List Android emulators
```

## Architecture

### Project Structure
```
src/
├── common/                      # DI container, Signal (reactive state)
├── domain/
│   ├── entities/               # Category, Guide, Step, Session
│   ├── repositories/           # Data access interfaces (pending impl)
│   └── services/               # Business logic with DI
├── infrastructure/storage/      # AsyncStorage wrappers
└── presentation/
    ├── screens/                # UI screens
    ├── navigation/             # React Navigation
    └── App.tsx                 # Entry point
```

### Domain Entities
- **Category**: Hierarchical organization (parent-child)
- **Guide**: Ordered steps, belongs to category
- **Step**: Order, title, description, duration (seconds)
- **Session**: State machine (NotStarted → InProgress ⇄ Paused → Completed/Cancelled)

### TDD Workflow
1. **RED**: Write failing test
2. **GREEN**: Minimal code to pass
3. **REFACTOR**: Improve while tests stay green
4. **VERIFY**: `npm test && npm run lint && npm run typecheck`

## CI/CD Pipeline

### Workflow Chain

```
┌─────────────────────────────────────────────────────────────┐
│ Pull Request → main                                          │
│                                                              │
│ Triggers: .github/workflows/ci-cd.yml                       │
│ Runs: lint, test, typecheck, Android build, iOS sim build   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Push to main (PR merge or direct commit)                    │
│                                                              │
│ Triggers: .github/workflows/release.yml                     │
│ 1. Runs lint + test + typecheck                             │
│ 2. Semantic-release analyzes commits (dry-run)              │
│ 3. If release needed:                                       │
│    - Builds Android APK                                     │
│    - Creates GitHub release with APK                        │
│    - Updates version in package.json, iOS, Android          │
│    - Updates CHANGELOG.md                                   │
│    - Creates git tag (v1.2.3)                               │
│    - Commits changes with [skip ci]                         │
│ 4. If no release needed: Exits gracefully                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ TestFlight Deployment    │  │ Docker Publish           │
│                          │  │                          │
│ Workflow:                │  │ Workflow:                │
│ testflight-deploy.yml    │  │ docker-publish.yml       │
│                          │  │                          │
│ Triggers: After Release  │  │ Triggers: After Release  │
│ workflow completes       │  │ workflow completes       │
│                          │  │                          │
│ 1. Check if new tag      │  │ 1. Check if new tag      │
│ 2. Build signed iOS IPA  │  │ 2. Build Docker image    │
│ 3. Upload to TestFlight  │  │ 3. Push to GHCR          │
│ 4. Assign to "main" group│ │ 4. Tag: version + latest │
└──────────────────────────┘  └──────────────────────────┘
```

### Semantic Release Configuration

**Commit Message Format** (Conventional Commits):
```bash
feat: add new feature          # Minor version bump (1.0.0 → 1.1.0)
fix: fix bug                   # Patch version bump (1.0.0 → 1.0.1)
perf: performance improvement  # Patch version bump
refactor: code refactoring     # Patch version bump
BREAKING CHANGE: ...           # Major version bump (1.0.0 → 2.0.0)

# No release triggered by:
docs: documentation changes
test: test changes
chore: maintenance tasks
style: code style changes
```

**What Semantic-Release Does** (`.releaserc.json`):
1. **@semantic-release/commit-analyzer**: Analyzes commits since last release
2. **@semantic-release/release-notes-generator**: Generates CHANGELOG
3. **@semantic-release/changelog**: Updates CHANGELOG.md
4. **@semantic-release/exec**: Updates version in iOS/Android/api-server
5. **@semantic-release/github**: Creates GitHub release + uploads Android APK
6. **@semantic-release/git**: Commits version changes with `[skip ci]`

**Release Workflow Behavior**:
- Runs on every push to main (unless commit has `[skip ci]`)
- Dry-run first to determine if release needed
- Skips build/release if no relevant commits
- Only commits with release prefixes trigger releases

### Manual Triggers

All workflows support manual triggering via GitHub Actions UI:

```bash
# TestFlight deployment
Actions → TestFlight Deployment → Run workflow
Options: skip_testflight (true = build only, false = upload)

# Docker publish
Actions → Docker Publish → Run workflow
Options: version (optional, defaults to package.json)

# Release workflow
Actions → Release → Run workflow
(Forces release check on current branch)
```

### GitHub Secrets Required

**App Store Connect** (TestFlight):
- `APPLE_TEAM_ID`: 10-character Team ID
- `APP_STORE_CONNECT_API_KEY_ID`: API Key ID
- `APP_STORE_CONNECT_ISSUER_ID`: API Issuer ID (UUID)
- `APP_STORE_CONNECT_API_KEY_CONTENT`: Complete .p8 file content

**Auto-configured**:
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Code Conventions

### TypeScript
- **Strict mode**: All strict flags enabled, no implicit any
- **Path aliases**: `@domain/`, `@infrastructure/`, `@presentation/`, `@common/`
- **React Native JSX**: Configured in tsconfig.json

### Entity Design Pattern
```typescript
class Entity {
  readonly id: string              // Immutable identity
  private _name: string            // Private mutable fields
  private _updatedAt: Date

  constructor(id: string, name: string) {
    if (!name.trim()) throw new Error('Name required')
    this.id = id
    this._name = name
    this._updatedAt = new Date()
  }

  get name(): string { return this._name }

  updateName(name: string): void {
    if (!name.trim()) throw new Error('Name required')
    this._name = name
    this._updatedAt = new Date()
  }

  get stepIds(): string[] { return [...this._stepIds] } // Immutable copy
}
```

### Service Design Pattern
```typescript
class Service {
  constructor(
    private repository: IRepository,
    private otherRepo: IOtherRepository
  ) {}  // Dependency injection

  async create(params: Params): Promise<Entity> {
    const id = uuid.v4()  // Generate UUID
    const entity = new Entity(id, params)
    await this.repository.save(entity)
    return entity
  }
}
```

### Test Pattern (Mocked Repositories)
```typescript
describe('Service', () => {
  let service: Service
  let mockRepo: jest.Mocked<IRepository>

  beforeEach(() => {
    mockRepo = { save: jest.fn(), findById: jest.fn() }
    service = new Service(mockRepo)
  })

  it('should create entity', async () => {
    const entity = await service.create({ name: 'Test' })
    expect(entity.id).toBeDefined()
    expect(mockRepo.save).toHaveBeenCalledWith(entity)
  })
})
```

### Avoid Over-Engineering
- ❌ Don't add unrequested features
- ❌ Don't add error handling for impossible scenarios
- ❌ Don't create abstractions for one-time operations
- ❌ Don't add docstrings/comments to unchanged code
- ✅ Keep it simple: three similar lines > premature abstraction

## Build Configuration

### Android
- **Gradle**: 8.13 (not 9.0 - CMake incompatibility)
- **Java**: 17 (required, no 25+ support)
- **Build Tools**: 36.0.0
- **NDK**: 27.1.12297006
- **Kotlin**: 2.1.20
- **Target SDK**: 36
- **Package**: com.guidr

### iOS
- **Xcode**: 15+
- **CocoaPods**: Latest (managed by React Native)
- **Target**: iOS 13+ minimum
- **Bundle ID**: com.guidr
- **Signing**: Automatic with xcodebuild `-allowProvisioningUpdates`
- **Distribution**: TestFlight (internal testing)

### TestFlight Distribution
- **Trigger**: Automatic after release, or manual
- **Build**: Signed IPA with automatic provisioning
- **Upload**: Fastlane pilot with App Store Connect API
- **Group**: "main" (internal testers)
- **Processing**: 10-15 minutes typical
- **Export Compliance**: `ITSAppUsesNonExemptEncryption = false` (HTTPS only)

**Certificate Management**:
- Certificates created automatically using xcodebuild `-allowProvisioningUpdates`
- No git repository needed - certificates managed by Apple
- xcodebuild authenticates with App Store Connect API key
- Provisioning profiles downloaded/created automatically during build
- Recommended approach for CI/CD by Apple

## Git Workflow

### Commit Messages
```bash
# Use conventional commit prefixes (semantic-release)
feat: add feature        # Triggers minor release
fix: fix bug            # Triggers patch release
perf: optimize          # Triggers patch release
refactor: refactor      # Triggers patch release
BREAKING CHANGE: ...    # Triggers major release

# No release (still good to use)
test: add tests
chore: update deps
docs: update docs
style: format code
```

**IMPORTANT - Commit Message Format:**
- Use clear, descriptive commit messages that explain WHY, not just WHAT
- Follow conventional commit format (type: description)
- Keep subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- **NEVER include AI/tool attribution** (no "Generated with Claude Code", "Co-Authored-By: Claude", etc.)
- **NEVER include generated footers or signatures** - commits should only contain your changes and rationale

### Before Pushing
```bash
git pull --rebase origin main  # Check if behind
npm test && npm run lint && npm run typecheck  # Verify quality
git push origin main
```

### Rules
- ✅ Clear, descriptive commit messages
- ❌ Never mention Claude/AI assistants in commits or commit messages
- ❌ Never add generated footers, signatures, or attribution
- ✅ Always rebase before pushing to avoid conflicts

## Common Issues

### Android Build Hangs
**Problem**: `npm run android` hangs or fails
**Cause**: Missing JAVA_HOME or ANDROID_HOME, or Java 25+ installed
**Solution**: Use direnv, wrapper script, or manual export (see Commands section)
**Diagnosis**: `npx react-native doctor`

### TestFlight Upload Fails
**Problem**: "Invalid credentials" during pilot upload
**Solution**: Verify GitHub Secrets are correct:
- API_KEY_ID: 10 chars
- ISSUER_ID: UUID format
- API_KEY_CONTENT: Must include BEGIN/END lines
- Check API key hasn't been revoked in App Store Connect

**Problem**: "Group 'main' not found"
**Solution**: Create TestFlight group in App Store Connect:
- App Store Connect → Apps → Guidr → TestFlight → Internal Testing
- Click "+" → Create Group → Name: "main" (exact, case-sensitive)
- Add team members, re-run workflow

**Problem**: Build succeeds but not in TestFlight
**Solution**: Wait 10-15 minutes for Apple processing. Check App Store Connect → Activity tab.

### Test Failures
**Problem**: Tests fail after changes
**Solution**: Ensure mocks are up to date in `__mocks__/`. React Native modules must be mocked.

**Problem**: Type errors in tests
**Solution**: Use bracket notation `props['value']` instead of `props.value` for test props

## Next Steps

**Planned Features** (not yet implemented):
- Repository implementations (API client)
- Category/Guide/Step CRUD screens
- Session execution screen with timer
- Notifications for step completion
- Offline sync with backend

**Backend Requirements** (api-server provides backend implementation):
- REST API for CRUD operations
- Guide/Step/Session persistence
- User authentication (optional)
