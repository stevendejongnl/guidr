# ADR-016: iOS Password AutoFill Support for Authentication Screens

## Status
Accepted

## Context
iOS users on the Guidr app could not access 1Password or iCloud Keychain password suggestions on the LoginScreen and RegistrationScreen. While React Native TextInput components had `textContentType` props set, the `autoComplete` prop was missing. iOS Password AutoFill requires **both** props to function correctly.

Additionally, email fields were incorrectly using `textContentType="username"` instead of `textContentType="emailAddress"`, which prevented email-specific AutoFill suggestions.

## Decision
Add `autoComplete` props to all TextInput components in LoginScreen and RegistrationScreen, and correct the `textContentType` for email fields:

### LoginScreen Changes
- Email field: Change `textContentType="username"` → `textContentType="emailAddress"`, add `autoComplete="email"`
- Password field: Add `autoComplete="current-password"`

### RegistrationScreen Changes
- Email field: Change `textContentType="username"` → `textContentType="emailAddress"`, add `autoComplete="email"`
- Password field: Add `autoComplete="new-password"`
- Confirm password field: Add `autoComplete="new-password"`

## Consequences

### Benefits
- Users with 1Password, iCloud Keychain, or other iOS password managers can now see password suggestions
- Improved UX for login and registration flows
- Better security by encouraging password manager usage
- No Android regressions (Android ignores iOS-specific props)

### Implementation Details
- `autoComplete` prop is specific to iOS; Android does not recognize it
- `textContentType` values remain unchanged on Android and don't affect functionality
- All changes are backward-compatible with existing code

## Verification
- Unit tests verify `autoComplete` and `textContentType` props are correctly set
- iOS simulator testing confirms 1Password and Keychain suggestions appear
- Android regression testing confirms no behavior changes

## Related ADRs
- ADR-006: Admin User Authorization
- ADR-007: User-Based Admin Mode (Mobile)
