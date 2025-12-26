# Guidr - Application Completion Roadmap

This document tracks the remaining work to complete the Guidr application. The core domain logic and deployment infrastructure are complete. This roadmap focuses on implementing the remaining features to create a fully functional guide execution app.

## Current Status

✅ **Completed:**
- Domain layer (Category, Guide, Step, Session entities + services) - 172 tests passing
- Authentication flow (login screen, token storage, logout)
- Server configuration screen
- TestFlight deployment pipeline
- Android and iOS builds working

❌ **Missing:**
- Backend API server
- Repository implementations (API integration)
- All core feature screens (Category/Guide/Step CRUD, Session execution)

---

## Prerequisites: Backend API Server

**IMPORTANT**: The backend API must be implemented before the frontend features can work. The app expects a REST API with the following endpoints:

### Authentication Endpoints
- ✅ `POST /login` - Already supported by AuthClient
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string, email: string }`

### Category Endpoints
- [ ] `GET /categories` - List all categories
- [ ] `GET /categories/:id` - Get category by ID
- [ ] `POST /categories` - Create category
  - Request: `{ name: string, description: string, parentId?: string }`
- [ ] `PUT /categories/:id` - Update category
  - Request: `{ name?: string, description?: string }`
- [ ] `DELETE /categories/:id` - Delete category

### Guide Endpoints
- [ ] `GET /guides` - List all guides
- [ ] `GET /guides/:id` - Get guide by ID (include steps)
- [ ] `GET /categories/:categoryId/guides` - List guides in category
- [ ] `POST /guides` - Create guide
  - Request: `{ categoryId: string, title: string, description: string }`
- [ ] `PUT /guides/:id` - Update guide
  - Request: `{ title?: string, description?: string }`
- [ ] `DELETE /guides/:id` - Delete guide

### Step Endpoints
- [ ] `GET /guides/:guideId/steps` - List steps for a guide
- [ ] `GET /steps/:id` - Get step by ID
- [ ] `POST /steps` - Create step
  - Request: `{ guideId: string, order: number, title: string, description: string, durationSeconds: number }`
- [ ] `PUT /steps/:id` - Update step
  - Request: `{ order?: number, title?: string, description?: string, durationSeconds?: number }`
- [ ] `DELETE /steps/:id` - Delete step

### Session Endpoints
- [ ] `GET /sessions` - List all sessions
- [ ] `GET /sessions/:id` - Get session by ID
- [ ] `POST /sessions` - Create session
  - Request: `{ guideId: string }`
- [ ] `PUT /sessions/:id` - Update session state
  - Request: `{ state?: string, currentStepId?: string, completedStepIds?: string[] }`
- [ ] `DELETE /sessions/:id` - Delete session

**All endpoints (except `/login`) must accept `Authorization: Bearer <token>` header.**

---

## Phase 1: API Integration

### 1.1 Base HTTP Client
- [ ] Create `src/infrastructure/api/BaseHttpClient.ts`
  - Fetch-based HTTP client with auth token injection
  - Read token from AuthStorage
  - Add `Authorization: Bearer <token>` header to all requests
  - Handle 401 (redirect to login)
  - Timeout handling (30s default)
  - Follow pattern from AuthClient.ts

### 1.2 API Clients
- [ ] Create `src/infrastructure/api/CategoryClient.ts`
  - CRUD methods: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
  - Follow AuthClient pattern
- [ ] Create `src/infrastructure/api/GuideClient.ts`
  - CRUD methods + `getByCategory()`
- [ ] Create `src/infrastructure/api/StepClient.ts`
  - CRUD methods + `getByGuide()`
- [ ] Create `src/infrastructure/api/SessionClient.ts`
  - CRUD methods + `updateState()`

### 1.3 Repository Implementations
- [ ] Create `src/infrastructure/repositories/CategoryRepository.ts`
  - Implement ICategoryRepository interface
  - Use CategoryClient for API calls
  - Map API responses to domain entities
- [ ] Create `src/infrastructure/repositories/GuideRepository.ts`
  - Implement IGuideRepository interface
- [ ] Create `src/infrastructure/repositories/StepRepository.ts`
  - Implement IStepRepository interface
- [ ] Create `src/infrastructure/repositories/SessionRepository.ts`
  - Implement ISessionRepository interface

### 1.4 Dependency Injection Setup
- [ ] Update `src/common/DependencyInjection.ts`
  - Register repository implementations
  - Register services with real repositories (not mocks)
  - Provide global access pattern for screens

---

## Phase 2: CRUD Screens

### 2.1 Category Management
- [ ] Create `src/presentation/screens/CategoryListScreen.tsx`
  - Display list of categories
  - Show category hierarchy (parent-child)
  - Add "Create Category" button
  - Tap category → navigate to CategoryDetailScreen
  - Pull-to-refresh
  - Loading/error states
- [ ] Create `src/presentation/screens/CategoryDetailScreen.tsx`
  - Display category name and description
  - List guides in this category
  - "Edit Category" button
  - "Delete Category" button (with confirmation)
  - Tap guide → navigate to GuideDetailScreen
- [ ] Create `src/presentation/screens/CategoryFormScreen.tsx`
  - Form for create/edit category
  - Fields: name, description, parent category (optional)
  - Validation (name required, description required)
  - Save button

### 2.2 Guide Management
- [ ] Create `src/presentation/screens/GuideListScreen.tsx`
  - Display all guides (across all categories)
  - Filter by category dropdown
  - Search by title
  - "Create Guide" button
  - Tap guide → navigate to GuideDetailScreen
  - Pull-to-refresh
- [ ] Create `src/presentation/screens/GuideDetailScreen.tsx`
  - Display guide title, description
  - Display category name
  - List all steps (ordered)
  - Show step: order, title, duration
  - "Edit Guide" button
  - "Delete Guide" button
  - "Start Guide" button → create session → navigate to SessionExecutionScreen
  - "Manage Steps" button → navigate to StepListScreen
- [ ] Create `src/presentation/screens/GuideFormScreen.tsx`
  - Form for create/edit guide
  - Fields: title, description, category (dropdown)
  - Validation

### 2.3 Step Management
- [ ] Create `src/presentation/screens/StepListScreen.tsx`
  - Display steps for a guide (editable list)
  - Reorder steps (drag-and-drop or up/down buttons)
  - Edit step inline or navigate to form
  - Delete step button
  - "Add Step" button
- [ ] Create `src/presentation/screens/StepFormScreen.tsx`
  - Form for create/edit step
  - Fields: title, description, duration (seconds or minutes:seconds)
  - Validation (title required, duration > 0)

### 2.4 Navigation Updates
- [ ] Update `src/presentation/navigation/AppNavigator.tsx`
  - Add all new screens to stack navigator
  - Configure navigation params (IDs, edit mode, etc.)
  - Update HomeScreen to navigate to CategoryListScreen

---

## Phase 3: Session Execution (Core Feature)

### 3.1 Session Execution Screen
- [ ] Create `src/presentation/screens/SessionExecutionScreen.tsx`
  - **Layout:**
    - Current step title (large, prominent)
    - Current step description
    - Countdown timer (MM:SS format, large font)
    - Progress indicator (e.g., "Step 3 of 10")
  - **Controls:**
    - Start button (when NotStarted)
    - Pause button (when InProgress)
    - Resume button (when Paused)
    - Previous Step button (if not first step)
    - Next Step button (if not last step)
    - Complete button (when on last step)
    - Cancel button (with confirmation)
  - **Timer Logic:**
    - Use React hooks (useState, useEffect) for countdown
    - Update every second
    - Visual/audio alert when step completes
    - Auto-advance to next step option (configurable)
  - **State Management:**
    - Use SessionService for state transitions
    - Update session state in backend (PUT /sessions/:id)
    - Handle errors gracefully

### 3.2 Session History
- [ ] Create `src/presentation/screens/SessionHistoryScreen.tsx`
  - List all sessions (past and active)
  - Show: guide title, state, start time, end time
  - Filter by state (InProgress, Completed, Cancelled)
  - Tap session → navigate to SessionDetailScreen or SessionExecutionScreen (if in progress)
  - Delete session button

### 3.3 Session Detail Screen (Optional)
- [ ] Create `src/presentation/screens/SessionDetailScreen.tsx`
  - View completed session details
  - Show all steps with completion times
  - Total duration
  - Completion percentage

---

## Phase 4: Polish & Testing

### 4.1 Consistent UI/UX
- [ ] Add consistent loading spinners across all screens
- [ ] Add consistent error messages (e.g., "Failed to load categories. Try again.")
- [ ] Add empty state messages (e.g., "No guides yet. Create one!")
- [ ] Add confirmation dialogs for destructive actions (delete, cancel)
- [ ] Ensure all buttons have proper disabled states
- [ ] Add accessibility labels (accessibilityLabel, accessibilityHint)

### 4.2 Error Handling
- [ ] Handle network errors gracefully (show retry button)
- [ ] Handle 401 errors (redirect to login, clear token)
- [ ] Handle 404 errors (show "Not found" message)
- [ ] Handle validation errors from backend (display field-specific errors)
- [ ] Add offline detection (show banner when offline)

### 4.3 Manual Testing Checklist
- [ ] Test full category CRUD flow (create, edit, delete, hierarchy)
- [ ] Test full guide CRUD flow (create, edit, delete, category assignment)
- [ ] Test full step CRUD flow (create, edit, delete, reordering)
- [ ] Test session execution flow:
  - [ ] Start guide
  - [ ] Pause and resume
  - [ ] Move to previous/next step
  - [ ] Complete session
  - [ ] Cancel session
- [ ] Test authentication flow:
  - [ ] Login
  - [ ] Logout
  - [ ] Token expiration (401 handling)
- [ ] Test edge cases:
  - [ ] Empty lists (no categories, guides, steps)
  - [ ] Network errors
  - [ ] Offline mode
- [ ] Test on both Android and iOS

### 4.4 Automated Testing
- [ ] Write integration tests for repository implementations
- [ ] Write screen tests for new components (React Native Testing Library)
- [ ] Update existing tests if needed

---

## Phase 5: Optional Future Enhancements

These are not required for a functional MVP but would improve the user experience:

### 5.1 Notifications
- [ ] Add push notifications for step completion
- [ ] Add local notifications (iOS/Android background timers)
- [ ] Allow users to customize notification sounds

### 5.2 Offline Support
- [ ] Cache guides and categories locally (AsyncStorage or SQLite)
- [ ] Queue mutations for sync when online
- [ ] Show sync status indicator

### 5.3 Guide Sharing
- [ ] Export guide as JSON
- [ ] Import guide from JSON
- [ ] Share guide link (deep linking)

### 5.4 Analytics & Progress Tracking
- [ ] Track session completion rate
- [ ] Track average session duration
- [ ] Show user statistics screen

### 5.5 Advanced Features
- [ ] Guide templates (pre-built guides)
- [ ] Step notes/comments during execution
- [ ] Custom step durations (user can adjust during session)
- [ ] Multi-user support (teams, shared guides)

---

## Completion Checklist

Before considering the app complete:
- [ ] Backend API fully implemented and tested
- [ ] All repository implementations working
- [ ] All CRUD screens implemented and tested
- [ ] Session execution screen working with real-time timer
- [ ] Navigation flows tested end-to-end
- [ ] Error handling consistent across all screens
- [ ] App tested on both Android and iOS devices
- [ ] No critical bugs or crashes
- [ ] User can create guides, add steps, and execute sessions successfully

---

## Estimated Effort

**Phase 1 (API Integration)**: 1-2 days
**Phase 2 (CRUD Screens)**: 2-3 days
**Phase 3 (Session Execution)**: 2-3 days
**Phase 4 (Polish & Testing)**: 1-2 days

**Total**: ~1-2 weeks for a fully functional application

**Backend Development**: 2-3 days (if starting from scratch)

---

## Resources

- **Domain Architecture**: See `CLAUDE.md` sections on Domain-Driven Design
- **Testing Patterns**: See existing tests in `src/domain/__tests__/`
- **API Client Pattern**: See `src/infrastructure/api/AuthClient.ts`
- **Screen Pattern**: See `src/presentation/screens/LoginScreen.tsx`
- **Navigation**: See `src/presentation/navigation/AppNavigator.tsx`
