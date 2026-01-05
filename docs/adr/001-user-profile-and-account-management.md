# ADR-001: User Profile and Account Management System

## Status

Proposed

## Context

Guidr is a step-by-step guide execution app designed for various use cases (recipes, workouts, lab protocols, etc.). Currently, the app has basic user authentication (login/registration) but lacks:

1. **User personalization**: No way to customize the app experience based on user interests or preferences
2. **Account self-service**: Users cannot manage their own account details (email, password) without developer intervention
3. **Profile information**: No display name or user-facing profile data beyond email address
4. **Account lifecycle**: No way for users to delete their own accounts

These limitations reduce user autonomy and make it difficult to personalize the guide experience. Users have expressed interest in categorizing their use cases (baking vs. sports) to help organize guides and potentially receive recommendations.

## Decision

We will implement a comprehensive user profile and account management system with the following components:

### User Profile
- **Name field** (optional): Display name for personalization
- **Interest categories** (multiple selection): Predefined categories users can select to indicate their primary use cases
  - Initial categories: Baking, Cooking, Sports & Fitness, Workouts, Lab Protocols, Arts & Crafts, DIY & Home Improvement, Beauty & Skincare
  - Stored as a list of strings in the User entity
  - Future enhancement: Make categories dynamic/server-driven

### Account Management
- **Password change**: Secure password updates with old password verification
- **Email change**: Email updates with password confirmation and uniqueness validation
- **Account deletion**: Self-service account deletion with password confirmation

### Password Recovery
- **Password reset flow**: Time-limited reset tokens (1 hour expiration) with email delivery
- **Email service**: SMTP integration for sending reset instructions

### Architecture Approach
- **Domain-Driven Design**: Follow existing DDD patterns in the codebase
- **Test-Driven Development**: Write tests first for all new functionality
- **Backend-first**: Build and test API endpoints before frontend integration
- **JWT authentication**: Protect all account management endpoints with JWT middleware
- **Domain events**: Emit events for all profile/account changes for audit trail

## Consequences

### Positive
- **User autonomy**: Users can fully manage their own accounts without developer help
- **Personalization foundation**: Interest categories enable future guide recommendations and filtering
- **Better UX**: Users can update email/password without creating new accounts
- **Security**: Password changes require old password; email/account changes require password confirmation
- **Audit trail**: Domain events provide visibility into all account changes
- **Scalable**: ProfileScreen provides dedicated space for future account features

### Negative
- **Development time**: ~21.5 hours of development effort (12 hours backend, 9.5 hours frontend)
- **Infrastructure requirements**: Requires SMTP configuration for email delivery (password reset)
- **Complexity**: Adds 6 new use cases, authentication middleware, email service, and token management
- **MongoDB schema migration**: Existing users will need backward-compatible handling for new fields (name, interests)
- **Maintenance**: Email templates, token expiration handling, and SMTP configuration require ongoing maintenance

### Neutral
- **Interest categories start hardcoded**: Initially defined in code, can be made dynamic later based on usage patterns
- **Password reset UI deferred**: Backend ready, but frontend may use "contact support" placeholder initially
- **No email verification**: Email changes don't require email confirmation in MVP (can add later for enhanced security)

## Alternatives Considered

### 1. Minimal Profile (Password Change Only)
**Rejected**: Doesn't address personalization needs or provide complete account management.

### 2. Add to SettingsScreen Instead of Dedicated ProfileScreen
**Rejected**: User preference was for a dedicated screen, which provides better organization and room for growth.

### 3. Third-Party Auth (OAuth, Social Login)
**Rejected**: Adds external dependencies and doesn't eliminate need for profile management. Can be added later alongside email/password auth.

### 4. Magic Link Instead of Password Reset
**Considered**: Simpler than password reset (no token storage), but password reset is more familiar to users and supports "forgot password" UX pattern.

## Implementation Notes

- Follow TDD throughout (write tests before implementation)
- Backend implementation before frontend to ensure API contracts are solid
- Use existing User entity patterns (immutable ID, validation in entity methods)
- Reuse PasswordHasher (Argon2) for password verification
- Follow existing form validation patterns from LoginScreen and RegistrationScreen
- Keep user logged in after password/email changes (show success message only)

## Related Decisions

- [ADR-002: JWT Authentication Middleware](./002-jwt-authentication-middleware.md) - Required for protecting endpoints
- [ADR-003: Password Reset with Email Delivery](./003-password-reset-with-email.md) - Email infrastructure for password recovery
- [ADR-004: Interest Categories for Personalization](./004-interest-categories-personalization.md) - Profile personalization approach
- [ADR-005: Profile Screen Navigation Structure](./005-profile-screen-navigation.md) - UI placement decision

## Date

2026-01-05
