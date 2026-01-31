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
**Dependency Injection**: Components receive services via props (not mocking in tests) | Example: `CategoryPickerButton` accepts `categoryService: CategoryService`
**Tests**: Jest + mocks for storage/API | Props passed with actual services (no mocking) | Bracket notation (`props['value']` not `props.value`)
**TDD**: RED → GREEN → REFACTOR → VERIFY
**Type Safety**: No `any`/`Any` types (except MongoDB `dict[str, Any]`, test mocks with warnings)
**Imports**: Always top-level (no conditional/lazy imports inside functions)

## Build & Deploy
**Android**: Gradle 8.13, Java 17 (NOT 25+), NDK 27.1, SDK 36, Package: com.guidr
**iOS**: Xcode 15+, Bundle ID: com.guidr, TestFlight internal testing
**CI**: Lint/test/typecheck → Android APK → iOS simulator | Semantic-release on merge

## Conventional Commits
- `feat:` → Minor | `fix:/perf:/refactor:` → Patch | `BREAKING CHANGE:` → Major | `docs:/test:/chore:/style:` → No release
- **Rules**: No AI attribution, rebase before push, **ALWAYS validate pre-push before pushing**

## Pre-Push Validation ⚠️
**CRITICAL**: After successful `git commit`, ALWAYS run pre-push checks locally to validate:
1. Pre-commit runs: TypeScript + ESLint (mobile/web) + Ruff/Mypy (API)
2. Pre-push runs: Security scanning + Mobile tests + API tests
3. If pre-push fails, fix issues and amend commit: `git add . && git commit --amend --no-edit`
4. **WAIT for explicit user instruction before running `git push`** - NEVER push without being asked
5. If pushing later, verify conflicts resolved properly - never force push to main
6. See `.husky/pre-commit` and `.husky/pre-push` for exact checks

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
