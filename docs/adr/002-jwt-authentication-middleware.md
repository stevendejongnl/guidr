# ADR-002: JWT Authentication Middleware for Protected Endpoints

## Status

Proposed

## Context

The Guidr API currently has authentication endpoints for login and registration that return JWT tokens. However, there is no mechanism to:

1. **Extract the authenticated user from JWT tokens** on subsequent requests
2. **Protect endpoints** that should only be accessible to authenticated users
3. **Validate JWT token expiration** and handle expired tokens consistently
4. **Provide user context** to use cases that need to know which user is making the request

As we add account management endpoints (password change, email change, account deletion), we need to ensure:
- Only the authenticated user can modify their own account
- Token validation happens consistently across all protected endpoints
- Expired or invalid tokens return appropriate 401 responses
- Use cases receive the authenticated User entity, not just a user ID

Without authentication middleware, we would need to manually validate tokens and fetch users in every endpoint handler, leading to code duplication and inconsistent security checks.

## Decision

We will implement **JWT authentication middleware** using FastAPI's dependency injection system to extract and validate the authenticated user from Bearer tokens.

### Implementation Approach

**File**: `api-server/src/presentation/api/dependencies/auth.py` (NEW)

```python
async def get_current_user(
    authorization: str = Header(...),
    jwt_service: JWTService = Depends(get_jwt_service),
    user_repository: IUserRepository = Depends(get_user_repository)
) -> User:
    """Extract authenticated user from JWT Bearer token.

    Args:
        authorization: Authorization header (format: "Bearer <token>")
        jwt_service: Service for JWT token validation
        user_repository: Repository to fetch user entity

    Returns:
        User entity for the authenticated user

    Raises:
        HTTPException(401): If token is missing, invalid, expired, or user not found
    """
```

### Usage in Protected Endpoints

```python
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),  # ← Middleware
    use_case: ChangePassword = Depends(get_change_password_use_case),
) -> dict:
    # current_user is already validated and populated
    await use_case.execute(ChangePasswordDTO(
        user_id=current_user.id.value,
        old_password=request.old_password,
        new_password=request.new_password
    ))
    return {"message": "Password changed successfully"}
```

### Error Handling

All authentication failures return HTTP 401 Unauthorized:
- Missing `Authorization` header → 401
- Malformed header (not "Bearer <token>") → 401
- Invalid JWT token → 401
- Expired JWT token → 401
- Valid token but user no longer exists (deleted) → 401

### Security Properties

✅ **Token validation**: JWT signature and expiration checked automatically
✅ **User existence check**: Validates user hasn't been deleted since token issued
✅ **Consistent error responses**: All auth failures return 401 with clear messages
✅ **No password in User entity**: User entity contains only ID, email, timestamps (no password hash)
✅ **Reusable**: Single implementation used across all protected endpoints via `Depends()`

## Consequences

### Positive

- **DRY principle**: Token validation logic written once, reused everywhere via dependency injection
- **Type safety**: Endpoints receive fully typed User entity, not just a string ID
- **Consistent security**: All protected endpoints automatically validate tokens the same way
- **Clear separation**: Authentication logic separated from business logic in use cases
- **Easy to extend**: Can add role-based access control (RBAC) by checking user properties
- **FastAPI native**: Uses FastAPI dependency injection, no custom middleware required
- **Testable**: Easy to mock in tests by providing a fake user or overriding the dependency

### Negative

- **Database call per request**: Fetches user from MongoDB on every authenticated request
  - Mitigation: User repository already has caching (5-minute TTL)
  - Mitigation: MongoDB query by ID is fast (indexed primary key)
- **Token revocation not supported**: Can't revoke tokens before expiration (JWT limitation)
  - Mitigation: Keep token expiration short (7 days currently)
  - Future: Add token blacklist or refresh token rotation if needed
- **No rate limiting**: Middleware doesn't prevent brute-force token guessing
  - Mitigation: Add rate limiting middleware separately if needed

### Neutral

- **Requires Authorization header**: Frontend must include `Authorization: Bearer <token>` on all protected requests
  - AuthClient already handles this for authenticated endpoints
- **User deletion requires token expiration**: Deleted user's tokens remain valid until expiration
  - Acceptable tradeoff for MVP; can add token blacklist later if needed

## Alternatives Considered

### 1. Manual Token Validation in Each Endpoint
**Rejected**: Leads to code duplication, inconsistent error handling, and higher risk of security bugs.

### 2. Session-Based Authentication with Cookies
**Rejected**: Adds state management complexity, doesn't work well with mobile apps, conflicts with JWT tokens already issued.

### 3. API Key Authentication
**Rejected**: Less secure than JWT for user authentication, no expiration mechanism, harder to rotate.

### 4. FastAPI Security Utilities (OAuth2PasswordBearer)
**Partially adopted**: We use FastAPI's `Depends()` and `Header()` but implement our own JWT validation since we already have a custom JWTService. OAuth2PasswordBearer provides similar functionality but would require refactoring existing JWT handling.

## Implementation Notes

- JWTService already exists and handles token creation/verification (Argon2)
- UserRepository already exists with caching (5-minute TTL reduces database load)
- Dependency injection container already configured (can wire up new dependency)
- Tests should cover: valid token, missing header, invalid token, expired token, deleted user
- Error messages should be vague ("Unauthorized") to avoid leaking information about valid vs invalid tokens

## Related Decisions

- [ADR-001: User Profile and Account Management System](./001-user-profile-and-account-management.md) - Requires protected endpoints
- Used by all account management use cases (change password, change email, update profile, delete account)

## Date

2026-01-05
