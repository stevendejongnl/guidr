# CLAUDE.md

Guidr monorepo: Mobile (React Native) + API (FastAPI) + Web (React). DDD/TDD architecture.

## Critical
**Sandbox**: Placeholder files in `.git/info/exclude` (local-only, not committed)
**ADRs**: All architectural decisions in `docs/adr/NNN-name.md` with Status, Context, Decision, Consequences

## Project Overview
**Status**: 870 tests passing (49 test suites), Admin auth (ADR-006, ADR-007, ADR-008), Android Gradle 8.13
**Stack**: Mobile RN 0.83.1 | API FastAPI 3.12+ | Web React | TypeScript strict | Jest
**Domain**: Category → Guide → Steps (duration) → Session (state machine)

## Structure
```
guidr/
├── mobile/        # React Native: src/{common,domain,infrastructure,presentation}
├── api-server/    # FastAPI backend
├── web-app/       # React Vite app
├── docs/adr/      # Architectural decisions
└── scripts/       # Build scripts
```

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

## Code Patterns
**Entities**: Private fields with getters (`private _name`, `get name()`)
**Services**: Constructor injection, async, repository pattern
**Tests**: Jest + mocks | Bracket notation (`props['value']` not `props.value`)
**TDD**: RED → GREEN → REFACTOR → VERIFY
**Type Safety**: No `any`/`Any` types (except MongoDB `dict[str, Any]`, test mocks with warnings)
**Imports**: Always top-level (no conditional/lazy imports inside functions)

## Build & Deploy
**Android**: Gradle 8.13, Java 17 (NOT 25+), NDK 27.1, SDK 36, Package: com.guidr
**iOS**: Xcode 15+, Bundle ID: com.guidr, TestFlight internal testing
**CI**: Lint/test/typecheck → Android APK → iOS simulator | Semantic-release on merge

## Conventional Commits
- `feat:` → Minor | `fix:/perf:/refactor:` → Patch | `BREAKING CHANGE:` → Major | `docs:/test:/chore:/style:` → No release
- **Rules**: No AI attribution, rebase before push

## Common Issues
**Android**: JAVA_HOME=/usr/lib/jvm/java-17-openjdk | `npx react-native doctor`
**TestFlight**: Create group in App Store Connect, check secrets format, wait 10-15min
**Tests**: Mock RN modules in `mobile/__mocks__/`, use bracket notation for props

**References**: [ADR-006](./docs/adr/006-admin-user-authorization.md), [ADR-007](./docs/adr/007-user-based-admin-mode-mobile.md)

---
**Condensed from 919 to 489 tokens**
