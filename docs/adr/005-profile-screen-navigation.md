# ADR-005: Profile Screen Navigation Structure

## Status

Proposed

## Context

We are adding user profile and account management features (name, interests, password change, email change, account deletion). We need to decide where to place these features in the app's navigation structure.

### Current Navigation Structure

```
HomeScreen
  ├── Menu (⋮ button, top-right)
  │   └── Settings
  │
  └── SettingsScreen
      ├── App Information (version, build)
      ├── Server (URL, change server button)
      └── Developer (debug tools, conditional)
```

### Requirements

1. **Discoverability**: Users should easily find profile/account features
2. **Logical grouping**: Related features should be grouped together
3. **Scalability**: Room to add more account features in future
4. **Separation of concerns**: App settings vs. user account settings
5. **Mobile-first**: Navigation should work well on small screens

### Options Considered

**Option A: Add to SettingsScreen**
- Add "Account" section to existing SettingsScreen
- Forms expand inline when buttons clicked
- All settings in one screen

**Option B: Dedicated ProfileScreen** ⭐ (User preferred)
- Create new ProfileScreen accessed from SettingsScreen
- "My Profile & Account" button in SettingsScreen
- Dedicated screen for all profile/account features

**Option C: Tab Bar Navigation**
- Add "Profile" tab to bottom tab bar
- Top-level navigation alongside Home

## Decision

We will implement **Option B: Dedicated ProfileScreen** accessed from SettingsScreen.

### Navigation Flow

```
HomeScreen
  ├── Menu (⋮ button)
  │   └── Settings
  │
  └── SettingsScreen
      ├── App Information
      ├── Server
      ├── Account (NEW)
      │   └── [My Profile & Account] button
      │       ↓
      │   ProfileScreen (NEW)
      │   ├── Profile Section (name, interests)
      │   ├── Account Section (email, password)
      │   └── Danger Zone (delete account)
      │
      └── Developer
```

### ProfileScreen Structure

```
┌─────────────────────────────────┐
│ ← Back        Profile            │  Header
├─────────────────────────────────┤
│                                  │
│  [Profile]                       │  Section 1
│  Name: [Input]                   │
│  Interests: [Checkboxes]         │
│  [Update Profile]                │
│                                  │
│  [Account]                       │  Section 2
│  Email: user@example.com         │
│  [Change Email] → inline form    │
│  Password: ••••••••              │
│  [Change Password] → inline form │
│                                  │
│  [⚠️ Danger Zone]                 │  Section 3
│  [Delete My Account]             │
│                                  │
└─────────────────────────────────┘
```

### Implementation Details

**SettingsScreen** (`src/presentation/screens/SettingsScreen.tsx`):
- Add new "Account" section
- Add `onOpenProfile: () => void` prop
- Button labeled "My Profile & Account"

**AppNavigator** (`src/presentation/navigation/AppNavigator.tsx`):
- Add `showProfileScreen` state
- Render ProfileScreen when state is true
- Pass props: `onBack`, `authClient`, `authStorage`, `userEmail`

**ProfileScreen** (`src/presentation/screens/ProfileScreen.tsx` - NEW):
- Full-screen modal-style screen
- Three sections with clear visual separation
- Inline forms that expand when buttons clicked
- ScrollView to handle all content on small screens

## Consequences

### Positive

- **Clear separation**: App settings (SettingsScreen) vs. user account (ProfileScreen)
- **Scalable**: ProfileScreen provides dedicated space for future account features
  - Future: Profile photo, notification preferences, privacy settings, linked accounts
- **Better UX**: Dedicated screen avoids cluttering SettingsScreen
- **Focused interactions**: Each section has specific purpose (profile, account, danger zone)
- **Room to grow**: Can add more sections without overwhelming the UI
- **User expectation**: Separate profile screen is a familiar pattern in mobile apps
- **Clear hierarchy**: Settings → Account → Profile provides logical drill-down

### Negative

- **Extra navigation step**: Users must go Settings → My Profile & Account (vs. all in Settings)
  - **Mitigation**: Still only 2 taps from HomeScreen (acceptable depth)
- **More screen files**: New ProfileScreen file and tests to maintain
- **Prop drilling**: Must pass `authClient` and `authStorage` through navigation
  - **Mitigation**: Consider React Context in future to reduce prop drilling
- **No direct access**: Can't deep-link to profile features without going through Settings first
  - **Future**: Add deep links if needed (e.g., `guidr://profile`)

### Design Rationale

**Why not add to SettingsScreen (Option A)?**
- SettingsScreen would become too long and cluttered (3 sections → 6+ sections)
- Mixing app settings with account management reduces clarity
- Inline forms would make the screen difficult to scroll on small screens
- User explicitly preferred dedicated screen

**Why not tab bar (Option C)?**
- Profile features are secondary, not primary navigation
- Tab bar would take permanent screen space for infrequent actions
- Home screen is the primary interface; profile is settings/configuration
- Can add tab bar later if usage patterns suggest it's needed

**Why "My Profile & Account" label?**
- Clear that it contains both profile info (name, interests) and account management (password, email)
- Avoids ambiguity of just "Profile" or just "Account"
- Sets user expectation for what's inside

## Alternatives Considered

### Add to HomeScreen
**Rejected**: Home screen is for primary task (viewing/executing guides). Profile is secondary.

### Settings Hamburger Menu
**Rejected**: Hamburger menus are less discoverable on mobile. Current menu (⋮ button) is more visible.

### Profile Icon in Header
**Considered**: Could add profile icon next to menu in HomeScreen. Acceptable addition in future if we add profile photos.

## Implementation Notes

- Follow existing navigation patterns (modal overlays, state-based rendering)
- Reuse existing theme components (`commonStyles.section`, `commonStyles.button`, etc.)
- Maintain consistent back navigation (← Back button in header)
- Test navigation flow: HomeScreen → Settings → Profile → Back → Back → HomeScreen
- Consider adding profile/account tests to navigation integration tests

## Future Enhancements

⏭ **Profile photo**: Add avatar image at top of ProfileScreen
⏭ **Activity log**: Show recent account changes (password changes, logins)
⏭ **Notification preferences**: Email/push notification settings
⏭ **Privacy settings**: Data export, account visibility
⏭ **Linked accounts**: OAuth social logins (Google, Apple)
⏭ **Deep links**: Direct links to specific profile sections
⏭ **Shortcuts**: Long-press app icon → Profile

## Related Decisions

- [ADR-001: User Profile and Account Management System](./001-user-profile-and-account-management.md) - Defines features shown in ProfileScreen
- Navigation pattern follows existing DebugScreen and ServerSetupScreen approach (modal overlays)

## Date

2026-01-05
