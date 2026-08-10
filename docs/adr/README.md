# Architectural Decision Records (ADRs)

This directory contains Architectural Decision Records for the Guidr project.

## What is an ADR?

An Architectural Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows this structure:

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue we're seeing that motivates this decision?

## Decision
What is the change we're proposing/doing?

## Consequences
What becomes easier or harder as a result of this change?
```

## Index

- [ADR-001: User Profile and Account Management System](./001-user-profile-and-account-management.md) - Proposed
- [ADR-002: JWT Authentication Middleware for Protected Endpoints](./002-jwt-authentication-middleware.md) - Proposed
- [ADR-003: Password Reset with Email Delivery](./003-password-reset-with-email.md) - Proposed
- [ADR-004: Interest Categories for User Personalization](./004-interest-categories-personalization.md) - Proposed
- [ADR-005: Profile Screen Navigation Structure](./005-profile-screen-navigation.md) - Proposed
- [ADR-006: Admin User Authorization and Role-Based Access Control](./006-admin-user-authorization.md) - Superseded by ADR-008
- [ADR-007: User-Based Admin Mode for Mobile App](./007-user-based-admin-mode-mobile.md) - Accepted
- [ADR-008: RBAC and Comprehensive Audit Logging System](./008-rbac-and-audit-logging.md) - Accepted
- [ADR-009: Server Health Validation and URL Normalization](./009-server-health-validation.md) - Accepted
- [ADR-010: Strict Type Safety and Import Rules](./010-strict-type-safety-rules.md) - Accepted
- [ADR-011: Fastlane Match Certificate Management](./011-fastlane-match-certificate-management.md) - Accepted
- [ADR-012: API Server Crash Notifications](./012-api-server-crash-notifications.md) - Accepted
- [ADR-013: iOS TestFlight Build Optimization](./013-ios-testflight-build-optimization.md) - Accepted
- [ADR-014: iOS 26 SDK Upgrade](./014-ios-26-sdk-upgrade.md) - Accepted
- [ADR-015: ECDSA Timing Attack Mitigation](./015-ecdsa-timing-attack-mitigation.md) - Accepted
- [ADR-016: iOS Password AutoFill Support for Authentication Screens](./016-ios-password-autofill-support.md) - Accepted
- [ADR-029: Remove iOS Platform Support](./029-remove-ios-platform-support.md) - Accepted

## Updating ADRs

When an ADR status changes:
- Update the status in the ADR file
- Update the index in this README
- If superseded, link to the superseding ADR
