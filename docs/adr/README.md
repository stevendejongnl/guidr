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
- [ADR-006: Admin User Authorization and Role-Based Access Control](./006-admin-user-authorization.md) - Accepted
- [ADR-007: User-Based Admin Mode for Mobile App](./007-user-based-admin-mode-mobile.md) - Accepted

## Updating ADRs

When an ADR status changes:
- Update the status in the ADR file
- Update the index in this README
- If superseded, link to the superseding ADR
