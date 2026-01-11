# ADR-007: User-Based Admin Mode for Mobile App

## Status

Accepted

## Context

Currently, the React Native mobile app uses a server-wide `debugMode` configuration to control visibility of debug tools:

**Previous Architecture**:
```
/config endpoint returns debugMode: true/false
    ↓
Mobile app reads debugMode
    ↓
Shows/hides debug tools to ALL users
```

**Problems with Server-Wide Approach**:

1. **Not tied to user authentication**: Debug tools visible/hidden globally, regardless of user role
2. **No security**: Anyone with access to the app sees debug tools if server enables them
3. **Inconsistent with backend**: Backend now has admin authorization (ADR-006) with `isAdmin` field per user, but mobile ignores it
4. **Device-specific security**: A device's debug access doesn't reflect the logged-in user's actual permissions
5. **All-or-nothing**: Cannot have different users with different admin capabilities on same device

This creates a mismatch: The backend provides per-user admin status via `isAdmin` field, but the mobile app doesn't use it.

## Decision

We will **migrate from server-wide `debugMode` to user-based admin mode** aligned with backend authorization:

### Architectural Changes

**Remove Server-Side Configuration**:
- ❌ Remove `debug_mode` setting from FastAPI `settings.py`
- ❌ Remove `debugMode` field from `/config` API response
- ✅ `/config` endpoint returns only version constraints (minAppVersion, maxAppVersion)

**Add User-Based Admin Status**:
- ✅ Backend already provides `isAdmin` boolean in login/register responses (from ADR-006)
- ✅ Mobile app reads `isAdmin` from authentication responses
- ✅ Mobile app persists `isAdmin` in AsyncStorage alongside auth token
- ✅ Mobile app manages `isAdmin` state across login/logout lifecycle

### Implementation Details

**Mobile Storage Layer** (`AuthStorage`):
```typescript
async getUserIsAdmin(): Promise<boolean>      // Read admin status
async setUserIsAdmin(isAdmin: boolean): void  // Persist admin status
async clearUserIsAdmin(): void                // Clear on logout
```

**Mobile API Layer** (`UserDto`):
```typescript
export interface UserDto {
  id: string
  email: string
  isAdmin?: boolean  // ← Read from backend responses
}
```

**Mobile State Management** (`AppNavigator`):
```typescript
const [isAdmin, setIsAdmin] = useState(false)

// Load admin status on app startup
if (hasToken) {
  const isAdminUser = await authStorage.getUserIsAdmin()
  setIsAdmin(isAdminUser)
}

// Update admin status on login/register
await authStorage.setUserIsAdmin(userData.isAdmin)
setIsAdmin(userData.isAdmin)

// Clear admin status on logout
await authStorage.clearUserIsAdmin()
setIsAdmin(false)
```

**Mobile UI Components**:
- `HomeScreen`: Shows "⚙ Admin Tools" button only when `adminMode={true}`
- `SettingsScreen`: Shows "Admin" section only when `adminMode={true}`
- `AdminScreen` (renamed from DebugScreen): Accessed only by authenticated admin users

### Data Flow

```
User Login
    ↓
API returns { isAdmin: true/false }
    ↓
AppNavigator stores in AsyncStorage
    ↓
AppNavigator state: setIsAdmin(true/false)
    ↓
Pass adminMode prop to screens
    ↓
HomeScreen/SettingsScreen show/hide admin tools
```

### Breaking Changes

**API Breaking Change**:
- Old mobile clients expecting `debugMode` in `/config` response will fail validation
- **Mitigation**: Graceful degradation
  - New mobile app: Works with version constraints only
  - Old mobile app: Can check `debugMode` existence before using
  - Temporary mitigation: Return `debugMode: false` for 1-2 releases

### Renamed Components

All "Debug" terminology replaced with "Admin":
- `DebugScreen` → `AdminScreen`
- Button text: "⚙ Debug Tools" → "⚙ Admin Tools"
- Section title: "Developer" → "Admin"
- Handler: `onOpenDebug` → `onOpenAdmin`
- Props: `debugMode` → `adminMode`

## Consequences

### Positive

✅ **Security**: Admin tools only visible to authenticated users with backend-verified `isAdmin=true` status

✅ **Consistent with backend**: Mobile app now respects the same authorization model as backend (ADR-006)

✅ **User-based, not device-based**: Different users on same device see appropriate features for their role

✅ **Persistent across restarts**: Admin status survives app termination via AsyncStorage

✅ **Single source of truth**: `isAdmin` comes from backend authentication, not from configuration

✅ **Foundation for future**: Ready for admin-only management screens (user management, moderation tools, etc.)

✅ **Clean separation of concerns**:
- Version constraints (`minAppVersion`, `maxAppVersion`) stay in `/config` (device-level)
- Admin features gated by `isAdmin` (user-level)

✅ **Backward compatible**: API gracefully handles old clients via version constraints only

### Negative

❌ **Requires authentication**: Cannot access admin tools when logged out
- Previously: Logged-out users could see debug tools if server enabled them
- Now: Must be logged in as admin user
- Trade-off: Acceptable security improvement

❌ **Breaking API change**: Old mobile clients expecting `debugMode` will fail
- Impact: Users on old app versions get validation error when fetching config
- Mitigation: Graceful degradation for 1-2 releases, then deprecate

❌ **Network dependency**: Admin status must come from backend via login/register
- Previously: Could enable debug mode locally without network
- Now: Requires network call to get admin status
- Trade-off: Acceptable for production security model

### Neutral

- Admin section in UI now labeled "Admin Tools" instead of "Debug Tools" (semantic change, no functional impact)
- Debug features still available (connection test, cache clearing) but only for authenticated admins
- Terminology change throughout codebase (more professional naming)

## Alternatives Considered

### 1. Keep Both Server-Wide and User-Based Modes
**Rejected**: Confusing, two sources of truth
- Server says debug=true, user says isAdmin=false → Show or hide?
- Adds complexity with minimal benefit
- Violates single source of truth principle

### 2. Server-Side Feature Flags (e.g., LaunchDarkly)
**Rejected**: Doesn't solve user authorization problem
- Feature flags are for gradual rollouts, not user permissions
- Still wouldn't align with backend's per-user admin model
- Adds external dependency for MVP

### 3. Local Environment Variable
**Rejected**: Not dynamic
- Requires app rebuild to change
- Works for development only, not production

### 4. Keep debugMode, Ignore isAdmin
**Rejected**: Perpetuates security gap
- Backend has admin authorization, mobile ignores it
- Doesn't align architectures
- Blocks future admin management features

## Implementation Notes

### Files Changed

**Backend** (3 files):
- `src/infrastructure/config/settings.py` - Removed `debug_mode` field
- `src/presentation/api/models/config_models.py` - Removed `debugMode` from ConfigResponse
- `src/presentation/api/routers/config.py` - Updated `/config` endpoint

**Mobile Storage** (2 files):
- `src/infrastructure/storage/AuthStorage.ts` - Added admin methods
- `src/infrastructure/storage/AuthStorage.test.ts` - Added admin tests

**Mobile API** (3 files):
- `src/infrastructure/api/dtos/UserDto.ts` - Added `isAdmin` field
- `src/infrastructure/api/ServerConfigClient.ts` - Removed `debugMode` validation
- `src/infrastructure/api/ServerConfigClient.test.ts` - Updated tests

**Mobile Cache** (2 files):
- `src/infrastructure/storage/ServerConfigCache.ts` - Removed `debugMode` field
- `src/infrastructure/storage/ServerConfigCache.test.ts` - Updated tests

**Mobile Navigation** (1 file):
- `src/presentation/navigation/AppNavigator.tsx` - State management for admin mode

**Mobile UI** (4 files):
- `src/presentation/screens/HomeScreen.tsx` - Renamed props/buttons
- `src/presentation/screens/HomeScreen.test.tsx` - Updated tests
- `src/presentation/screens/SettingsScreen.tsx` - Renamed props/buttons
- `src/presentation/screens/SettingsScreen.test.tsx` - Updated tests

**Mobile Admin Screen** (2 files):
- `src/presentation/screens/AdminScreen.tsx` - Renamed from DebugScreen
- `src/presentation/screens/AdminScreen.test.tsx` - Created comprehensive tests

### Testing

- Backend: 301 tests passing (includes admin authorization tests)
- Mobile: 791 tests passing (includes admin mode tests)
- Total test coverage maintained at 100%

### Migration Path for Users

1. **Old app version** (using `debugMode` from `/config`):
   - Validation fails when reading config (missing `debugMode` field)
   - Falls back to `debugMode: false`
   - Debug tools hidden

2. **New app version** (using `isAdmin` from login):
   - Validation passes with version constraints only
   - Admin tools shown only for authenticated admin users
   - Better security model

3. **Recommended upgrade**: Users should update to new version for admin features

### Graceful Degradation

**For 1-2 releases**, API can return:
```json
{
  "minAppVersion": "1.20.0",
  "maxAppVersion": null,
  "debugMode": false  // ← Temporary, for backward compatibility
}
```

This allows old and new apps to coexist during transition period.

## Related Decisions

- [ADR-006: Admin User Authorization and Role-Based Access Control](./006-admin-user-authorization.md) - Provides the `isAdmin` field this decision uses

## Future Enhancements

1. **Admin Management UI** (Phase 2+):
   - Mobile screen for admins to manage other admins
   - Promotion/demotion without database access
   - Admin action audit trail

2. **Extended Admin Features** (Phase 2+):
   - User management screen (view, edit, delete users)
   - Content moderation tools
   - System statistics and monitoring

3. **Role-Based Mobile UI** (Phase 3+):
   - Different admin roles (superadmin, moderator, user)
   - Fine-grained feature visibility per role
   - Extensible admin screen layout

## Date

2026-01-11

## Author

Claude Code Implementation
