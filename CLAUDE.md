# CLAUDE.md

Guidr monorepo: Mobile (React Native) + API (FastAPI) + Web (React). DDD/TDD architecture.

## Critical
**Sandbox**: Placeholder files in `.git/info/exclude` (local-only, not committed)
**ADRs**: All architectural decisions in `docs/adr/NNN-name.md` with Status, Context, Decision, Consequences

## Project Tracking
**Board**: https://github.com/users/stevendejongnl/projects/3
**Statuses**: Todo → In Progress → Done
**Workflow**:
- Assign yourself: `gh issue edit <number> --add-assignee @me`
- Update status: `gh issue edit <number> --add-project "Guidr" --project-field "Status" --project-value "In Progress"`
- Link commits/PRs to tickets (use issue number in commit messages)

## Project Overview
**Status**: 1369 mobile tests (86 suites) + 659 API tests passing, Admin auth (ADR-006, ADR-007, ADR-008)
**Stack**: Mobile RN 0.83.1 | API FastAPI 3.12+ | Web React | TypeScript strict | Jest
**Domain**: GuideType (cooking/workout/general) → Guide → Steps (duration) → Session (state machine)

## Structure
```
guidr/
├── shared/        # Design system package: tokens + React Native component styles
├── mobile/        # React Native: src/{common,domain,infrastructure,presentation}
├── api-server/    # FastAPI backend
├── web-app/       # React Vite app
├── docs/adr/      # Architectural decisions
└── scripts/       # Build scripts
```

## Design System (@guidr/shared)
**Package**: `shared/` (npm workspace)

**Architecture**: Platform-agnostic definitions with platform-specific adapters
```
shared/src/
├── tokens/                 # Design tokens (colors, spacing, typography, etc.)
├── styles/
│   ├── definitions/        # Platform-agnostic style objects
│   │   ├── buttons, cards, badges, forms, inputs, typography, layout, common
│   │   └── Can be imported to build adapters for new platforms
│   ├── adapters/react-native/  # Convert definitions → React Native StyleSheets
│   └── react-native/       # Backwards compatibility re-exports
```

**Exports**:
- `@guidr/shared/tokens` - Design tokens (colors, spacing, typography, borderRadius, etc.)
- `@guidr/shared/styles/react-native` - React Native StyleSheets + helpers (buttonStyles, formStyles, commonStyles, etc.)
- `@guidr/shared/styles/definitions` - Platform-agnostic style definitions (for building adapters)

**Key Helpers**:
- `getButtonStyle(variant, disabled, size)` - Returns button style array
- `getStatusBadgeStyle(status, variant, size)` - Returns badge styles
- `getFormGroupStyle(compact)` - Returns form group style
- `getInputStyle(options)` - Returns input style array

**Usage**:
- Mobile: `import { colors, spacing, formStyles, getFormGroupStyle } from '@guidr/shared/styles/react-native'`
- Web: `import { colors, spacingWeb, typography } from '@guidr/shared/tokens'` (manage Lit CSS separately)
- New platforms: `import { buttonDefinitions, formDefinitions } from '@guidr/shared/styles/definitions'` → create adapter

## Commands
**Mobile** (`mobile/`): `npm start`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run android`, `npm run ios`, `./build-android.sh`
**API**: `docker pull ghcr.io/stevendejongnl/guidr-api-server:latest && docker run -p 8000:8000 ...`
**Web** (`web-app/`): `npm install && npm run dev`, `npm run build`
**API Docs**: https://guidr.madebysteven.nl/api/docs (FastAPI Swagger UI)

## Claude Skills (.claude/skills/)
Custom Claude Code skills for workflow acceleration:
- **build.md**: Mobile build/run commands (Metro, Android, iOS, APK generation)
- **test.md**: Test running (Jest, coverage, watch mode, patterns)
- **tdd.md**: Test-Driven Development workflow (RED-GREEN-REFACTOR-VERIFY)
- **monorepo-commands**: Comprehensive npm script reference
  - **Global**: `npm run test`, `npm run lint`, `npm run typecheck` (all packages)
  - **API**: `npm run api:test`, `npm run api:lint`, `npm run api:typecheck` (FastAPI)
  - **Mobile**: `npm run mobile:test`, `npm run mobile:lint`, `npm run mobile:typecheck`, `npm run mobile:ios`, `npm run mobile:android` (React Native)
  - **Web**: `npm run web:dev`, `npm run web:build` (React Vite)
  - Use when: working with monorepo npm scripts across packages

## Handoff Config
<!-- handoff:file=HANDOFF.md -->
<!-- handoff:project=Guidr monorepo -->

## Scout Rule
**Always leave the codebase cleaner than you found it.** If tests are failing — even if unrelated to the current task — investigate and fix them before pushing. Never push with known test failures. This applies to all test suites: mobile (Jest), API (pytest), iOS widget (XCTest), and security scans.

## Code Patterns
**Entities**: Private fields with getters (`private _name`, `get name()`)
**Services**: Constructor injection, async, repository pattern
**Dependency Injection**: Components receive services via props (not mocking in tests) | Example: `CategoryPickerButton` accepts `categoryService: CategoryService`
**Tests**: Jest + mocks for storage/API | Props passed with actual services (no mocking) | Bracket notation (`props['value']` not `props.value`)
**TDD**: RED → GREEN → REFACTOR → VERIFY
**Type Safety**: No `any`/`Any` types (except MongoDB `dict[str, Any]`, test mocks with warnings)
**Imports**: Always top-level (no conditional/lazy imports inside functions)
**Styling (Mobile)**: Use `@guidr/shared` instead of local theme. No component-level `StyleSheet.create` (only shared libraries). Dynamic styles use helper functions from shared package

## Build & Deploy
**Android**: Gradle 8.13, Java 17 (NOT 25+), NDK 27.1, SDK 36, Package: com.guidr
**iOS**: Xcode 16.2, minimum deployment target iOS 16.2, Bundle ID: com.guidr, TestFlight internal testing
**CI**: Lint/test/typecheck → Android APK → iOS simulator | Semantic-release on merge

## Conventional Commits
- `feat:` → Minor | `fix:/perf:/refactor:` → Patch | `BREAKING CHANGE:` → Major | `docs:/test:/chore:/style:` → No release
- **Rules**: No AI attribution, rebase before push, **ALWAYS validate pre-push before pushing**

## Pre-Push Validation ⚠️
**CRITICAL**: Three-step validation workflow (no exceptions):

**1. Create Commit** (auto-runs pre-commit checks):
- Stage files: `git add <files>`
- Commit: `git commit -m "..."`
- Pre-commit hook runs: TypeScript + ESLint (mobile/web) + Ruff/Mypy (API)
- If pre-commit fails: fix issues and amend: `git add . && git commit --amend --no-edit`

**2. Run Pre-Push Checks** (ALWAYS after successful commit):
- `npm run mobile:test` - All Jest tests (1000+)
- `npm run api:test` - All pytest tests (400+)
- `npm run security:all` - Security scanning (mobile/web/api)
- If pre-push fails: fix issues and amend commit, repeat this step

**3. Ask for Permission** (only after pre-push passes):
- Never run `git push` without explicit user instruction
- After pre-push validation succeeds, ask: "All checks passed. Ready to push?"
- Wait for user confirmation before pushing to remote

**Manual verification** (if pushing later):
- Run steps 2-3 again before pushing
- Never force push to main (`git push --force`)
- See `.husky/pre-commit` and `.husky/pre-push` for exact checks

## Common Issues
**Android**: JAVA_HOME=/usr/lib/jvm/java-17-openjdk | `npx react-native doctor`
**TestFlight**: Create group in App Store Connect, check secrets format, wait 10-15min
**Tests**: Mock RN modules in `mobile/__mocks__/`, use bracket notation for props

## Security
**Scanning**: `npm run security:all` (pre-push runs automatically) | See [SECURITY.md](./SECURITY.md)
**Known Issues**:
- CVE-2024-23342 (ecdsa timing attack) - API, accepted with mitigation
- See [ADR-015](./docs/adr/015-ecdsa-timing-attack-mitigation.md) for details & monitoring plan

**References**: [ADR-006](./docs/adr/006-admin-user-authorization.md), [ADR-007](./docs/adr/007-user-based-admin-mode-mobile.md), [ADR-015](./docs/adr/015-ecdsa-timing-attack-mitigation.md)

---
**Condensed from 919 to 489 tokens**
