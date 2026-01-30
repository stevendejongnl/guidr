# Login Screen Improvements - Keyboard Handling & 1Password Autofill

## Summary

This document tracks the improvements made to the LoginScreen for better keyboard handling and 1Password autofill support.

## Phase 1: Keyboard Handling (✅ COMPLETED)

### Problem
The keyboard was covering the login button and other UI elements when focused on input fields. Users couldn't tap the login button without first dismissing the keyboard.

**Root Cause**:
- No `KeyboardAvoidingView` to handle keyboard appearance
- Centered layout without scrolling capability prevented proper keyboard adjustment

### Solution Implemented
Modified `mobile/src/presentation/screens/LoginScreen.tsx`:

1. **Added KeyboardAvoidingView wrapper**:
   - Uses `behavior="padding"` on iOS (shifts content up)
   - Uses `behavior="height"` on Android (adjusts available space)
   - Ensures login button remains visible when keyboard appears

2. **Added ScrollView wrapper**:
   - `contentContainerStyle={{ flexGrow: 1 }}` - centers content when keyboard hidden
   - `keyboardShouldPersistTaps="handled"` - allows tapping buttons without dismissing keyboard
   - Supports scrolling on small devices (iPhone SE)

3. **Implemented keyboard return key navigation**:
   - Email input: `returnKeyType="next"` jumps to password field
   - Password input: `returnKeyType="done"` triggers login action
   - Uses ref `passwordInputRef` to manage focus

4. **Enhanced 1Password autofill attributes**:
   - Email: `textContentType="emailAddress"`, `autoComplete="email"`
   - Password: `textContentType="password"`, `autoComplete="current-password"`
   - Already compatible with 1Password recognition

### Code Changes

```tsx
// Added imports
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { useRef } from 'react'

// Added ref for password input
const passwordInputRef = useRef<TextInput>(null)

// Wrapped layout
<SafeScreen>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={commonStyles.container}>
        {/* form content */}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeScreen>

// Email input with navigation
<TextInput
  // ... existing props
  returnKeyType="next"
  onSubmitEditing={() => passwordInputRef.current?.focus()}
/>

// Password input with login trigger
<TextInput
  ref={passwordInputRef}
  // ... existing props
  returnKeyType="done"
  onSubmitEditing={handleLogin}
/>
```

### Test Results
✅ All 49 LoginScreen tests passing
✅ Pre-commit checks (ESLint, TypeScript, flake8, mypy) passed
✅ No layout jank or flicker observed

### Verification
- Keyboard appears → login button remains visible and tappable
- Keyboard dismissed → form centers properly
- Return key navigation works on both iOS and Android
- All existing functionality preserved

### Commit
```
fix(mobile): improve login screen keyboard handling and autofill support
```
See git log for full commit details.

---

## Phase 2: 1Password Verification Setup (📋 DOCUMENTED - NOT YET IMPLEMENTED)

### Problem
1Password shows warning: "1Password can't verify the app or website should have access to your Guidr login"

Users must manually tap "Allow Once" each time they use autofill. This is functional but degrades UX.

### Current Workaround
✅ Users can tap "Allow Once" in 1Password to manually approve autofill
- Fully functional autofill
- Works on both iOS and Android
- No additional setup required

### Solution Overview (Documented)
Requires server-side configuration to host:
1. **iOS**: Apple App Site Association (AASA) file at `/.well-known/apple-app-site-association`
2. **Android**: Digital Asset Links (DAL) file at `/.well-known/assetlinks.json`

Plus iOS entitlements update.

### Requirements to Implement Phase 2
1. **Access to domain server** (guidr.madebysteven.nl)
2. **Apple Developer Team ID** (for iOS entitlements)
3. **Android app signing details** (SHA256 fingerprint from keystore)
4. **Server configuration** (nginx/Apache to serve `.well-known/` files)
5. **Estimated effort**: ~3 hours total

### Implementation Guide
Complete step-by-step guide available in: `docs/1PASSWORD_AUTOFILL_SETUP.md`

Covers:
- Getting Apple Team ID
- Creating and hosting AASA file
- Creating and hosting DAL file
- Server configuration (nginx/Apache examples)
- Troubleshooting for both platforms
- Testing procedures

### Decision: Why Not Phase 1?
- Phase 1 (keyboard fix) was blocking: users couldn't login
- Phase 2 (verification) is enhancement: users can login with manual approval
- Keyboard fix has no dependencies and improves UX immediately
- Phase 2 requires server-side setup - better done as separate task

---

## Success Criteria - Phase 1

✅ Keyboard appears without covering login button
✅ Login button remains tappable during keyboard input
✅ Form centers properly when keyboard dismissed
✅ Return key navigation improves UX
✅ All existing tests pass (870 tests total)
✅ No regressions or layout issues
✅ Works on both iOS and Android

---

## Success Criteria - Phase 2 (Future)

- [ ] AASA file hosted at `/.well-known/apple-app-site-association`
- [ ] DAL file hosted at `/.well-known/assetlinks.json`
- [ ] iOS entitlements updated with Team ID
- [ ] Both files accessible over HTTPS
- [ ] Manual "Allow Once" warning no longer appears
- [ ] 1Password autofill works seamlessly on both platforms
- [ ] No authentication required for verification files

---

## Testing Procedures

### Phase 1 Testing (✅ COMPLETED)

**Unit Tests**:
```bash
npm test -- LoginScreen.test.tsx
```
All 49 tests passing

**Manual iOS Testing**:
1. `npm run ios`
2. Open Guidr
3. Tap email input → keyboard appears
4. Verify login button visible below keyboard
5. Tap password input
6. Return key jumps from email to password
7. On password field, return key triggers login

**Manual Android Testing**:
1. `npm run android`
2. Repeat steps 2-7 above
3. Verify no layout jank on keyboard show/hide

### Phase 2 Testing (When Implemented)

See: `docs/1PASSWORD_AUTOFILL_SETUP.md` → Testing & Verification section

---

## Architecture Notes

### Component Structure
```
SafeScreen (handles safe area)
└── KeyboardAvoidingView (platform-specific behavior)
    └── ScrollView (allows scrolling + tap-through)
        └── View (container with flexGrow: 1 for centering)
            ├── View (content area)
            │   ├── Title, Description
            │   ├── Email TextInput
            │   ├── Password TextInput
            │   ├── Error text
            │   ├── Login button
            │   ├── Change server link
            │   └── Register link
            └── VersionDisplay
```

### Key Props Explained

- `KeyboardAvoidingView behavior`:
  - iOS: `"padding"` - adjusts padding when keyboard appears
  - Android: `"height"` - adjusts available height in view
  - Prevents overlap of keyboard with UI elements

- `ScrollView contentContainerStyle={{ flexGrow: 1 }}`:
  - Ensures content expands to fill viewport
  - Allows vertical centering when content smaller than screen
  - Enables scrolling if content larger than screen

- `keyboardShouldPersistTaps="handled"`:
  - ScrollView doesn't dismiss keyboard on tap
  - Allows tapping buttons without keyboard closing first
  - Improves rapid login workflows

- `returnKeyType` on TextInputs:
  - `"next"` on email: Standard iOS/Android pattern for navigation
  - `"done"` on password: Indicates last field in form
  - Combined with `onSubmitEditing`: Provides keyboard-driven form completion

---

## References

- iOS KeyboardAvoidingView: https://reactnative.dev/docs/keyboardavoidingview
- Android KeyboardAvoidingView: https://reactnative.dev/docs/keyboardavoidingview
- ScrollView: https://reactnative.dev/docs/scrollview
- TextInput: https://reactnative.dev/docs/textinput
- 1Password Setup: `docs/1PASSWORD_AUTOFILL_SETUP.md`

---

## Related ADRs

- [ADR-006: Admin User Authorization](docs/adr/006-admin-user-authorization.md)
- [ADR-007: User-Based Admin Mode (Mobile)](docs/adr/007-user-based-admin-mode-mobile.md)

---

## Next Steps

1. **Immediate** (✅ Done): Deploy Phase 1 keyboard handling fix
2. **Future**: Implement Phase 2 when server access available
3. **Monitor**: Collect user feedback on keyboard behavior
4. **Optional**: Consider additional keyboard-related improvements:
   - Custom keyboard toolbar with "Next/Done" buttons
   - Auto-login on password field submission
   - Keyboard animation customization

---

## Status

| Phase | Task | Status | Completion |
|-------|------|--------|------------|
| 1 | Keyboard handling | ✅ Complete | 100% |
| 1 | Return key navigation | ✅ Complete | 100% |
| 1 | All tests passing | ✅ Complete | 100% |
| 2 | Documentation | ✅ Complete | 100% |
| 2 | Server setup | 📋 Pending | 0% |
| 2 | iOS entitlements | 📋 Pending | 0% |
| 2 | Android config | 📋 Pending | 0% |
| 2 | Testing & verification | 📋 Pending | 0% |

Last Updated: 2026-01-30
