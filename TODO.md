# Guidr - Development Roadmap

This document tracks ongoing development and future enhancements for the Guidr project. The core infrastructure and API server are complete and production-ready.

---

## 📊 Project Status

### ✅ Completed Core Infrastructure

**API Server**: FastAPI backend fully deployed with comprehensive features:
- 🏗️ Domain-Driven Design (DDD) architecture
- 🗄️ MongoDB persistence with repository pattern
- 🔐 Real authentication (Argon2 + JWT tokens)
- 🛒 Full CRUD for Categories, Guides, Steps, Sessions
- 📋 RBAC (Role-Based Access Control) with admin authorization
- 📝 Comprehensive audit logging system
- 🧪 Full test coverage (870 tests passing across monorepo)
- 🐳 Docker images published to GitHub Container Registry
- 🌐 Production deployment at https://guidr.madebysteven.nl/api

**Mobile App**: React Native core and Phase 1.4 Session Execution implemented with:
- Domain layer complete (entities, services, repositories)
- Authentication flow (login, logout, token management)
- Server configuration screen
- Admin mode with user-based authorization (ADR-007)
- Health check validation (ADR-009)
- **Session Execution** (Phase 1.4): Countdown timer, step navigation, pause/resume, auto-advance, cross-device timer persistence
- TestFlight deployment pipeline
- 893 tests passing (54 test suites)

**Web App**: React + Lit web application with:
- Vite build tooling
- TypeScript strict mode
- Component architecture ready

**Tests**: 870 tests passing across all packages:
- 49 test suites
- Domain, application, integration, and e2e tests
- Full coverage for core business logic

---

## 🚀 Phase 1: Mobile UI Enhancement

### 1.1 Category Management UI
- [ ] Display category list with hierarchy
- [ ] Create/edit/delete categories
- [ ] Category filtering and navigation
- [ ] Empty state messages

### 1.2 Guide Management UI
- [ ] Display guide list (filtered by category)
- [ ] Create/edit/delete guides
- [ ] Search and filtering
- [ ] Guide detail view

### 1.3 Step Management UI
- [ ] Display steps for a guide
- [ ] Create/edit/delete steps
- [ ] Reorder steps (drag-and-drop or buttons)
- [ ] Step editor with duration input

### 1.4 Session Execution (Core Feature) ✅ COMPLETE
- [x] Session execution screen with countdown timer
- [x] Step navigation (previous/next)
- [x] Pause/resume functionality
- [x] Session completion tracking
- [x] Auto-advance option (configurable)
- [ ] Step completion notifications (Phase 3 feature)

### 1.5 Session History
- [ ] List all sessions (active and completed)
- [ ] Filter by status
- [ ] Delete sessions
- [ ] View session details/statistics

---

## 🎯 Phase 2: UX Polish

### 2.1 Consistent UI/UX
- [ ] Add loading spinners across screens
- [ ] Add error messages with retry buttons
- [ ] Add empty state messages ("No guides yet")
- [ ] Add confirmation dialogs for destructive actions
- [ ] Disable buttons appropriately
- [ ] Add accessibility labels

### 2.2 Error Handling
- [ ] Network error handling with graceful fallbacks
- [ ] 401 error handling (redirect to login)
- [ ] Offline detection (show banner)
- [ ] Validation error display

### 2.3 Pull-to-Refresh
- [ ] Implement pull-to-refresh for list screens
- [ ] Add refresh indicators

---

## 🔄 Phase 3: Advanced Features

### 3.1 Offline Support
- [ ] Cache guides/categories locally
- [ ] Queue mutations for sync
- [ ] Show sync status indicator
- [ ] Offline mode detection

### 3.2 Notifications
- [ ] Local notifications for step completion
- [ ] Customizable notification sounds
- [ ] Do-not-disturb mode

### 3.3 Guide Sharing
- [ ] Export guides as JSON
- [ ] Import guides from JSON
- [ ] Deep linking for guide sharing

### 3.4 Analytics & Progress
- [ ] Session completion tracking
- [ ] Average duration statistics
- [ ] User progress dashboard

---

## 📱 Phase 4: Cross-Platform Testing

### 4.1 Device Testing
- [ ] Test on Android devices (multiple API levels)
- [ ] Test on iOS devices (multiple versions)
- [ ] Test on tablets (landscape mode)
- [ ] Test with slow network conditions

### 4.2 Manual Testing Checklist
- [ ] Category CRUD flows (create, read, update, delete, hierarchy)
- [ ] Guide CRUD flows
- [ ] Step CRUD flows and reordering
- [x] Full session execution cycle:
  - [x] Start guide
  - [x] Pause/resume session
  - [x] Navigate between steps
  - [x] Complete session
  - [x] Cancel session
- [ ] Authentication flows:
  - [ ] Login
  - [ ] Logout
  - [ ] Token expiration
- [ ] Edge cases:
  - [ ] Empty lists
  - [ ] Network errors
  - [ ] Offline mode
  - [ ] Large data sets

---

## 🏗️ Technical Debt & Improvements

### 4.1 Code Quality
- [ ] Increase test coverage to 90%+
- [ ] Add integration tests for repository implementations
- [ ] Add screen component tests
- [ ] Add E2E tests with Detox

### 4.2 Performance Optimization
- [ ] Analyze bundle size
- [ ] Optimize image loading
- [ ] Add lazy loading for lists
- [ ] Profile memory usage

### 4.3 Documentation
- [ ] Add component storybook
- [ ] Document API integration patterns
- [ ] Add ADRs for UI decisions
- [ ] Update mobile development guide

---

## 🔐 Security

### 5.1 Security Hardening
- [ ] Add certificate pinning for API calls
- [ ] Secure local storage (token encryption)
- [ ] Add rate limiting for login attempts
- [ ] Implement refresh token rotation
- [ ] Security audit of mobile app

### 5.2 Compliance
- [ ] GDPR compliance review
- [ ] Data deletion mechanisms
- [ ] Privacy policy implementation

---

## 📋 Known Issues & Limitations

### Current Limitations
1. **No offline data persistence** - Guides/categories not cached locally
2. **Limited notifications** - No background timer notifications
3. **No guide sharing** - Can't export/import guides
4. **No analytics** - No session statistics/dashboard
5. **No dark mode** - Light theme only

### Known Bugs
*None currently reported - system is stable in production*

---

## 🎓 Learning & Architecture

### ADRs (Architectural Decision Records)
- [ADR-006](./docs/adr/006-admin-user-authorization.md): Admin User Authorization (Superseded by ADR-008)
- [ADR-007](./docs/adr/007-user-based-admin-mode-mobile.md): User-Based Admin Mode
- [ADR-008](./docs/adr/008-rbac-and-audit-logging.md): RBAC and Audit Logging
- [ADR-009](./docs/adr/009-server-health-validation.md): Server Health Validation
- [ADR-010](./docs/adr/010-strict-type-safety-rules.md): Strict Type Safety and Imports

---

## 📊 Development Effort Estimates

| Phase | Tasks | Effort | Status |
|-------|-------|--------|--------|
| API Server (Complete) | All API endpoints, DDD, RBAC | ✅ Done | Production |
| Phase 1.4: Session Execution | Countdown timer, step nav, pause/resume, auto-advance | ✅ Done (3-4 days) | Complete |
| Phase 1.1-1.3, 1.5: Remaining Mobile UI | Category/Guide/Step/History screens | 1-2 weeks | Pending |
| Phase 2: UX Polish | Error handling, loading states | 1 week | Pending |
| Phase 3: Advanced | Offline, notifications, sharing | 2-3 weeks | Pending |
| Phase 4: Testing | Device testing, manual QA | 1-2 weeks | Pending |
| Phase 5: Production | Deployment, monitoring, performance | 1 week | Pending |

**Total Estimate**: ~7-9 weeks for complete MVP with all mobile screens (Phase 1.4 now complete)

---

## 🏁 Completion Checklist

### Before MVP Release
- [ ] All CRUD screens implemented and tested
- [ ] Session execution working with real timer
- [ ] Navigation flows tested end-to-end
- [ ] Error handling consistent across all screens
- [ ] App tested on Android devices (3+ different API levels)
- [ ] App tested on iOS devices (2+ versions)
- [ ] No crashes or critical bugs
- [ ] User can complete full workflow: create guide → add steps → execute session

### Before Production Release
- [ ] Security audit completed
- [ ] Performance optimization completed
- [ ] Battery usage optimized
- [ ] Network usage optimized
- [ ] App Store/Play Store submission ready
- [ ] Release notes prepared
- [ ] User documentation complete

---

## 📚 Resources & References

### Development
- **Domain Architecture**: See `CLAUDE.md` for DDD principles
- **Testing Patterns**: See tests in `mobile/src/domain/__tests__/`
- **API Client Pattern**: See `src/infrastructure/api/AuthClient.ts`
- **Screen Pattern**: See `src/presentation/screens/LoginScreen.tsx`
- **Navigation**: See `src/presentation/navigation/AppNavigator.tsx`

### External
- [React Native Docs](https://reactnative.dev)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Lit Docs](https://lit.dev)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)

---

## 🔄 Release Process

### Versioning
- Uses semantic versioning (MAJOR.MINOR.PATCH)
- `feat:` commits trigger minor version bump
- `fix:`/`refactor:`/`perf:` commits trigger patch bump
- `BREAKING CHANGE:` triggers major version bump

### Deployment
1. Commit changes using conventional commits
2. Push to `main` branch
3. Semantic-release automatically:
   - Determines new version
   - Updates version numbers across monorepo
   - Creates git tags and GitHub releases
   - Builds and publishes Docker images
   - Deploys to TestFlight (iOS) and internal testing (Android)

---

## 🤝 Contributing

### Guidelines
- Follow DDD principles (domain → application → infrastructure → presentation)
- Write tests first (TDD)
- Use conventional commits
- Keep functions small and focused
- Document complex behavior
- No `any` types in production code (see ADR-010)
- All imports at module level (see ADR-010)

### Code Review Checklist
- [ ] Tests included and passing
- [ ] Type safety enforced (no `any`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Code follows patterns in codebase
- [ ] Documentation updated if needed
- [ ] ADR created for architectural decisions

---

**Last Updated**: 2026-01-15
**Maintainer**: Steven de Jong
