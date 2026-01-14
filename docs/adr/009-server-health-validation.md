# ADR-009: Server Health Validation and URL Normalization

**Date**: 2026-01-14

**Status**: Accepted

## Context

The mobile app currently has several issues related to server configuration:

1. **Duplicate health check code**: Both `AdminScreen.tsx` and `DebugScreen.tsx` contain identical health check implementations (~34 lines of duplication)
2. **No automatic validation**: When users manually change the server URL in settings, there's no validation that the new URL is valid and healthy
3. **No URL normalization**: Users can enter URLs with `/api/v1` suffix (e.g., `https://guidr.madebysteven.nl/api/v1`), leading to potential issues when the repositories append `/api/v1` again
4. **No startup validation**: The app doesn't check if the configured server is healthy on app launch
5. **Inconsistent health endpoint**: Current health checks call `/health` but should call `/api/v1/health` to match the API structure

This leads to poor UX: users might save invalid server URLs without knowing, and the app doesn't provide early feedback about connectivity issues.

## Decision

Implement a comprehensive server health validation system following Domain-Driven Design principles:

### 1. **Domain Layer - HealthCheckService**
   - Create `IHealthCheckService` interface defining the health check contract
   - Implement `HealthCheckService` that:
     - Validates server URLs by calling `/api/v1/health` endpoint
     - Normalizes URLs (strips `/api/v1` suffix and trailing slashes)
     - Measures response time (100-500ms typical)
     - Handles timeouts (10-second limit) via AbortController
     - Returns `HealthCheckResult` with health status and error details

### 2. **Infrastructure Layer - URL Normalization**
   - Update `ServerConfigStorage.setServerUrl()` to normalize URLs before persistence
   - Strip `/api/v1` and `/api/v1/` suffixes using regex: `/\/api\/v1\/?$/`
   - Remove trailing slashes
   - Ensures all stored URLs are clean and consistent

### 3. **Infrastructure Layer - Validated Storage Wrapper**
   - Create `ValidatedServerStorage` that wraps `ServerConfigStorage` + `HealthCheckService`
   - Validates health before saving via `setServerUrlWithValidation(url)`
   - Delegates all other operations to underlying storage
   - Returns `HealthCheckResult` for UI feedback

### 4. **Presentation Layer - ServerSetupScreen Integration**
   - Add blocking validation when user saves server URL
   - Show loading state: "Validating server..."
   - Success: Display "✓ Connected (127ms)"
   - Error: Display "Server validation failed: {error}" without saving
   - Prevents invalid server URLs from being persisted

### 5. **Presentation Layer - Startup Validation**
   - Add non-blocking health check in `AppNavigator.useEffect()`
   - On app startup, validate the configured server URL
   - Log warnings if validation fails: "Server health check failed on startup: {error}"
   - Continue app flow regardless (don't block launch)
   - Gives early feedback if server is down

### 6. **Presentation Layer - Duplication Removal**
   - Refactor `AdminScreen.handleConnectionTest()` to use `HealthCheckService`
   - Refactor `DebugScreen.handleConnectionTest()` to use `HealthCheckService`
   - Remove ~34 lines of duplicated code

## Consequences

### Positive
- **Reusable service**: Health check logic centralized in one service, used across multiple screens
- **Better UX**: Users get immediate feedback when saving server URL
- **Early detection**: Startup validation catches connectivity issues early
- **Prevents errors**: URL normalization prevents user input errors (trailing slashes, `/api/v1` duplication)
- **Consistent implementation**: All screens use the same health check logic
- **Clear error messages**: Users know exactly why a server URL didn't work
- **Testable**: Service is thoroughly tested (22 test cases)

### Negative
- **Blocking validation on save**: Users wait ~100-500ms during server URL save (acceptable trade-off for data integrity)
- **Additional network call**: Startup validation adds one extra HTTP request on app launch (non-blocking, so acceptable)

### Neutral
- **Validation is non-blocking on startup**: App continues to load even if server is unreachable, preventing boot failures

## Alternatives Considered

### 1. Non-Blocking Validation
   - Allow users to save URLs without validation, show warning badge
   - **Rejected**: User requested blocking validation to prevent invalid URLs

### 2. Validation Only on Manual Change
   - Skip startup validation, validate only when user changes server
   - **Rejected**: User requested startup validation for early detection of connectivity issues

### 3. Validate on Every API Error
   - Auto-validate server whenever any API call fails
   - **Rejected**: Too aggressive, would validate on auth errors and 404s that aren't server issues
   - **Deferred**: Can be implemented as optional enhancement in future iteration

## Implementation Notes

### File Structure
```
mobile/src/
  ├── domain/services/
  │   ├── IHealthCheckService.ts
  │   ├── HealthCheckService.ts
  │   └── HealthCheckService.test.ts (22 tests)
  ├── infrastructure/storage/
  │   ├── ServerConfigStorage.ts (updated with normalization)
  │   ├── ServerConfigStorage.test.ts (updated with 5 new tests)
  │   ├── ValidatedServerStorage.ts
  │   └── ValidatedServerStorage.test.ts (11 tests)
  └── presentation/
      ├── screens/
      │   ├── ServerSetupScreen.tsx (updated with validation)
      │   ├── AdminScreen.tsx (refactored)
      │   ├── DebugScreen.tsx (refactored)
      └── navigation/
          └── AppNavigator.tsx (startup validation added)
```

### Test Coverage
- **HealthCheckService.test.ts**: 22 test cases covering URL normalization, timeout handling, error scenarios
- **ServerConfigStorage.test.ts**: 5 new test cases for URL normalization
- **ValidatedServerStorage.test.ts**: 11 test cases for validation logic and delegation
- **Total new tests**: 38 test cases
- **Expected outcome**: All existing tests remain passing (171+) + 38 new tests

### TDD Approach
All implementations followed RED → GREEN → REFACTOR pattern:
1. Write failing tests first (RED)
2. Implement to make tests pass (GREEN)
3. Refactor for clarity (REFACTOR)

### Error Handling Matrix
| Error Type | User Message | Allow Save? |
|------------|--------------|-------------|
| Invalid URL format | "Invalid server URL format" | No |
| Network timeout | "Server validation failed: Request timeout" | No |
| Connection refused | "Server validation failed: Connection refused" | No |
| HTTP 404 | "Server validation failed: Health endpoint not found" | No |
| HTTP 500 | "Server validation failed: Server error (500)" | No |
| Invalid health status | "Server validation failed: Invalid health status" | No |
| Empty URL | "Please enter a server URL" | No |

### Backwards Compatibility
- No breaking changes to existing APIs
- `ServerConfigStorage` maintains same interface
- URL normalization is transparent to consumers
- All existing functionality preserved

### Migration Path
- Existing stored URLs will be normalized on next app load (in `ServerSetupScreen`)
- No data loss or corruption
- Gradual migration as users change servers

## Verification

### Manual Testing
1. **Test URL normalization**: Save URL with `/api/v1` → verify it's stripped
2. **Test blocking validation**: Try saving invalid URL → should show error and not save
3. **Test successful save**: Save valid URL → should show response time and navigate
4. **Test startup validation**: Launch app with valid/invalid server → should log appropriately
5. **Test connection test**: Click "Test Connection" in Admin/Debug screens → should use service

### Automated Testing
- Run full test suite: `npm test`
- Expected: 171+ existing tests + 38 new tests all passing
- TypeScript compilation: `npm run typecheck` (no errors)
- Linting: `npm run lint` (no errors)

### Success Criteria
- ✅ All 22 HealthCheckService tests passing
- ✅ All 20 ServerConfigStorage tests passing (including 5 new)
- ✅ All 11 ValidatedServerStorage tests passing
- ✅ ServerSetupScreen shows validation UI correctly
- ✅ AdminScreen uses HealthCheckService
- ✅ DebugScreen uses HealthCheckService
- ✅ AppNavigator performs startup validation
- ✅ No duplicate health check code remaining
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ ADR-009 documented

## References

- **Code pattern**: Domain-Driven Design (DDD) with service layer
- **Testing approach**: Test-Driven Development (TDD)
- **Related ADRs**: ADR-006 (Admin authorization), ADR-007 (User-based admin mode)
- **Health endpoint**: `/api/v1/health` returns `{status: "healthy"}`
- **Default server**: `https://guidr.madebysteven.nl`

## Future Enhancements

### Phase 7 (Optional): Error Handler Utility
- Create `ErrorHandler.shouldValidateServer()` to classify errors
- Automatically suggest server validation when appropriate errors occur
- Show alert: "Server may be unavailable. Test connection?" on network errors

### Phase 8 (Future): Auto-Retry Logic
- Implement exponential backoff for transient failures
- Retry health checks up to 3 times before failing

### Phase 9 (Future): Server List/Bookmarks
- Allow users to save multiple server URLs
- Quick-switch between configured servers
- Show server status for each bookmark
