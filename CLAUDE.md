# CLAUDE.md

Project guidance for Claude Code working with the Guidr repository.

## Important: Claude Code Sandbox Behavior

**Issue**: Claude Code's sandbox (bubblewrap) creates empty placeholder files in the working directory:
- `.bashrc`, `.bash_profile`, `.zshrc`, `.zprofile`, `.profile`, `.ripgreprc`, `.vscode`
- `.gitconfig`, `.gitmodules`, `.claude/commands`, `.claude/settings.json`

**Root Cause**: Bubblewrap requires files to exist before mounting them with `--ro-bind` (read-only bind mount). These are security mounts that prevent the sandbox from writing to system config files.

**Solution**: Excluded from git status using `.git/info/exclude` (local-only, doesn't affect other developers).

**Proper Fix**: Pending upstream issue with Anthropic to create placeholder files in `/tmp/claude/` instead of PWD. See [Claude Code Issues](https://github.com/anthropics/claude-code/issues/).

## Important: Architectural Decision Records (ADRs)

**All architectural decisions must be documented in `docs/adr/` following the standard format.**

When planning significant features:
1. Create ADR files in `docs/adr/` directory
2. Format: `NNN-descriptive-name.md`
3. Follow standard ADR template: Status, Context, Decision, Consequences
4. Update index in `docs/adr/README.md`
5. Link related ADRs together

**Do not create temporary plans without corresponding ADRs.**

## Project Overview

**Guidr** - Monorepo: Mobile (React Native), API Server (FastAPI), Web (React)
Guide execution app with precise timing (recipes, workouts, lab protocols). Built with DDD/TDD.

**Status**: Core domain logic complete (171 tests). Admin authorization implemented (ADR-006, ADR-007). Android Gradle 8.13 configured.

**Tech Stack**:
- Mobile: React Native 0.83.1 (bare) | TypeScript strict | Jest | AsyncStorage
- API: FastAPI | Python 3.11+ | Poetry
- Web: React | TypeScript | Vite

## Monorepo Structure

```
guidr/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── common/        # DI, Signal (reactive state)
│   │   ├── domain/        # Entities, services, repositories
│   │   ├── infrastructure/# Storage, API, monitoring
│   │   └── presentation/  # Screens, navigation, theme
│   ├── android/           # Native code
│   ├── ios/               # Native code
│   └── package.json
├── api-server/            # FastAPI backend
├── web-app/               # React web app
├── docs/adr/              # Architectural decision records
└── scripts/               # Build scripts
```

## Domain Model

- **Category**: Hierarchical organization
- **Guide**: Ordered steps, belongs to category
- **Step**: Title, description, duration (seconds)
- **Session**: State machine (NotStarted → InProgress/Paused → Completed/Cancelled)

## Quick Start

**Mobile commands** (from `mobile/` directory):
```bash
npm start                      # Metro bundler
npm test && npm run lint       # Test + lint
npm run typecheck              # TypeScript check
npm run android                # Android (set JAVA_HOME first)
npm run ios                    # iOS simulator (macOS)
./build-android.sh             # Android APK (handles Java 17)
```

**Backend**:
```bash
docker pull ghcr.io/stevendejongnl/guidr-api-server:latest
docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-api-server:latest
# Connection: Android emulator http://10.0.2.2:8000 | iOS localhost:8000 | Device <your-ip>:8000
```

**Web app**:
```bash
cd web-app/
npm install && npm run dev     # Development
npm run build                  # Production
```

## Code Conventions

### Entity Pattern
```typescript
class Entity {
  readonly id: string
  private _name: string

  constructor(id: string, name: string) {
    if (!name.trim()) throw new Error('Name required')
    this.id = id
    this._name = name
  }

  get name(): string { return this._name }
  updateName(name: string): void {
    if (!name.trim()) throw new Error('Name required')
    this._name = name
  }
}
```

### Service Pattern
```typescript
class Service {
  constructor(private repository: IRepository) {}
  async create(params: Params): Promise<Entity> {
    const entity = new Entity(uuid.v4(), params)
    await this.repository.save(entity)
    return entity
  }
}
```

### Test Pattern
```typescript
describe('Service', () => {
  let service: Service
  let mockRepo: jest.Mocked<IRepository>

  beforeEach(() => {
    mockRepo = { save: jest.fn() }
    service = new Service(mockRepo)
  })

  it('should create entity', async () => {
    const entity = await service.create({ name: 'Test' })
    expect(mockRepo.save).toHaveBeenCalledWith(entity)
  })
})
```

### Rules
- **TypeScript**: Strict mode, no implicit any
- **DI**: Constructor injection, no service locator
- **TDD**: RED → GREEN → REFACTOR → VERIFY
- **Avoid over-engineering**: Simplicity > premature abstraction

## Build Configuration

**Android**: Gradle 8.13, Java 17 (NOT 25+), NDK 27.1, Target SDK 36, Package: com.guidr
**iOS**: Xcode 15+, auto-provisioning, target iOS 13+, Bundle ID: com.guidr, TestFlight (internal)

## CI/CD Pipeline

**PR/Push to main**:
1. Lint, test, typecheck (mobile/)
2. Android build (APK)
3. iOS simulator build

**Push to main (after merge)**:
1. Semantic-release analyzes commits (conventional commits)
2. If release needed: builds Android APK, creates GitHub release, updates versions, tags git
3. Triggers TestFlight deployment + Docker publish (automatic)

**Conventional Commits** (trigger releases):
- `feat: ...` → Minor version (1.0.0 → 1.1.0)
- `fix:/perf:/refactor: ...` → Patch version (1.0.0 → 1.0.1)
- `BREAKING CHANGE: ...` → Major version (1.0.0 → 2.0.0)
- `docs:/test:/chore:/style: ...` → No release

**GitHub Secrets** (App Store Connect/TestFlight):
- `APPLE_TEAM_ID`, `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_CONTENT`

## Git Workflow

**Commit format**: Use conventional commits (feat/fix/perf/refactor/BREAKING CHANGE)
**Message style**: Clear, imperative mood ("add feature" not "added"), <72 chars, explain WHY not WHAT
**Rules**:
- ✅ Clear, descriptive, conventional format
- ❌ No AI/tool attribution (no "Generated with Claude", "Co-Authored-By: Claude")
- ✅ Rebase before pushing

## Common Gotchas

**Android Build Fails**:
- Missing JAVA_HOME or ANDROID_HOME → Set `export JAVA_HOME=/usr/lib/jvm/java-17-openjdk`
- Java 25+ installed → Use Java 17 only (Gradle 8.13 incompatible)
- Diagnosis: `cd mobile/ && npx react-native doctor`

**TestFlight Upload Fails**:
- "Group 'main' not found" → Create TestFlight group in App Store Connect (Internal Testing)
- Invalid API key → Check GitHub Secrets are correct (format: API_KEY_ID 10 chars, ISSUER_ID UUID)
- Build succeeds but not visible → Wait 10-15 minutes for Apple processing

**Tests Fail After Changes**:
- React Native modules must be mocked in `mobile/__mocks__/`
- Use bracket notation `props['value']` instead of `props.value` for test props

## TDD Workflow (Mobile)

1. **RED**: Write failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve while tests stay green
4. **VERIFY**: `cd mobile/ && npm test && npm run lint && npm run typecheck`

## Related Decisions

- [ADR-006: Admin User Authorization](./docs/adr/006-admin-user-authorization.md)
- [ADR-007: User-Based Admin Mode for Mobile App](./docs/adr/007-user-based-admin-mode-mobile.md)
