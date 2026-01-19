# ADR-006: Admin User Authorization and Role-Based Access Control

## Status

Accepted

## Context

Currently, Guidr has JWT authentication for user login and account management, but lacks authorization controls. Any authenticated user can perform administrative operations:

1. **No content moderation**: All authenticated users can modify or delete guides and categories created by any user
2. **No destruction control**: No way to prevent accidental or malicious deletion of important content
3. **No admin functions**: No distinction between regular users and administrators
4. **Production risk**: Lack of authorization creates security and data integrity concerns

As Guidr scales, we need:
- Content management capabilities (admins can delete/edit any guide)
- Prevention of unauthorized content modifications
- A foundation for future role-based permissions
- Bootstrap mechanism to create initial admin users

## Decision

We will implement **admin-only authorization** using a simple boolean `is_admin` field on the User entity:

### Core Approach

1. **User Entity**: Add immutable `is_admin: bool` field (defaults to `False`)
   - Immutable after user creation (requires migration script to change)
   - Prevents accidental promotion/demotion

2. **Authorization Helper**: Create `require_admin(user: User)` function
   - Raises `AuthorizationException` if user is not admin
   - Used by use cases requiring admin privileges

3. **Protected Operations**:
   - DELETE guides (admin only)
   - PATCH guides (admin only)
   - DELETE categories (admin only)
   - PATCH categories (admin only)
   - All read and create operations remain open to all authenticated users

4. **API Dependency**: Add `get_current_admin_user()` FastAPI dependency
   - Wraps `get_current_user()` with admin check
   - Returns 403 Forbidden for non-admin users
   - Enables easy protection of future admin endpoints

5. **Bootstrap Script**: `promote_admin.py` migration script
   - Promotes existing user to admin by email
   - Enables initial admin creation without code changes
   - Usage: `uv run python scripts/promote_admin.py admin@example.com`

### Implementation

**File Structure**:
- `src/domain/entities/user.py` - Add `is_admin` field with property getter
- `src/domain/exceptions/authorization_error.py` - New `AuthorizationException`
- `src/application/authorization/__init__.py` - `require_admin()` helper
- `src/presentation/api/dependencies/auth.py` - `get_current_admin_user()` dependency
- `scripts/promote_admin.py` - Bootstrap script
- MongoDB mapper updated for `isAdmin` field persistence with backward compatibility

**Use Case Pattern**:
```python
class DeleteGuide:
    async def execute(self, guide_id: str, current_user: User) -> None:
        require_admin(current_user)  # Raises AuthorizationException if not admin
        await self._repository.delete(EntityId(guide_id))
```

**API Endpoint Pattern**:
```python
@router.delete("/{guide_id}")
async def delete_guide(
    guide_id: str,
    current_user: User = Depends(get_current_admin_user),  # 403 if not admin
    use_case: DeleteGuide = Depends(get_delete_guide_use_case),
) -> None:
    await use_case.execute(guide_id, current_user)
```

### Backward Compatibility

- **MongoDB**: Missing `isAdmin` field in existing documents defaults to `False`
- **API**: New `isAdmin` field in responses is backward compatible (mobile ignores unknown fields)
- **Existing Users**: All current users remain non-admin by default
- **No data migration**: Zero downtime deployment possible

## Consequences

### Positive

✅ **Production-safe**: Prevents non-admins from destructive operations
✅ **Simple model**: Binary admin/user distinction, easy to understand
✅ **Bootstrap-friendly**: Migration script enables initial admin creation
✅ **Immutable status**: Prevents accidental promotion/demotion bugs
✅ **FastAPI native**: Uses existing dependency injection pattern
✅ **Extensible**: Foundation for future role-based permissions (roles, scopes)
✅ **DRY principle**: Authorization logic in helpers, reused across use cases
✅ **Zero-downtime**: Backward compatible with existing data and clients
✅ **Well-tested**: Comprehensive tests for admin and non-admin paths

### Negative

❌ **No user ownership**: Users cannot edit their own guides (all-or-nothing authorization)
  - Mitigation: Add `created_by_user_id` to guides/categories for ownership-based access

❌ **Manual admin promotion**: Requires script execution (no UI for admin management)
  - Mitigation: Not needed for MVP; future admin management UI can handle this

❌ **Immutable admin status**: Cannot change admin status without database access
  - Mitigation: Acceptable for MVP; rare operation
  - Future: Add admin-only endpoint to promote/demote users

❌ **No fine-grained permissions**: Binary admin/user only (no partial permissions)
  - Mitigation: Sufficient for MVP; future ADR can design RBAC
  - Upgrade path: Replace with role-based system if needed

### Neutral

- **Admin field in API responses**: Mobile app receives `isAdmin` field, can use for future admin UI
- **Bootstrap dependency**: Requires operator access to run promotion script
  - Acceptable for production deployments (part of deployment process)

## Alternatives Considered

### 1. Role-Based Access Control (RBAC) with Multiple Roles
**Rejected for MVP**: Too complex for current needs
- Requires role hierarchy, permission matrix, scope definitions
- Excessive for simple binary admin/user distinction
- Can implement as future enhancement

### 2. Attribute-Based Access Control (ABAC)
**Rejected for MVP**: Over-engineered
- Would add significant complexity with limited benefit
- Policy evaluation overhead
- Overkill for initial authorization needs

### 3. User Ownership of Content
**Rejected for Phase 1**: Requires additional schema changes
- Need to add `created_by_user_id` to all content entities
- Would require separate ADR for ownership tracking
- Can implement alongside future role-based permissions

### 4. Access Control Lists (ACLs)
**Rejected for MVP**: Unnecessary complexity
- Requires per-resource permission management
- High operational overhead
- Simple boolean admin flag sufficient for MVP

## Implementation Notes

### Testing Strategy
- Domain layer: User entity with `is_admin` property
- Infrastructure layer: UserMapper serialization/deserialization with backward compatibility
- Application layer: `require_admin()` rejects non-admins, allows admins
- Presentation layer: `get_current_admin_user()` dependency returns 403 for non-admins
- End-to-end: Admin can delete/edit, non-admin gets 403

### API Changes
- UserResponse model includes `isAdmin` field
- Login/register endpoints return `isAdmin` in response
- Change email/password endpoints return `isAdmin` in updated user data
- No breaking changes (new field with default)

### Database Changes
- MongoDB: Add `isAdmin` field to user documents (optional, defaults to false)
- No migration script needed (application handles missing field)
- Can backfill `isAdmin: false` in existing documents if needed

### Mobile App Changes
- User entity updated with `isAdmin` field
- No UI changes (API-only for now)
- Foundation for future admin screens if needed

## Related Decisions

- [ADR-002: JWT Authentication Middleware](./002-jwt-authentication-middleware.md) - Provides authenticated user context
- [ADR-001: User Profile and Account Management](./001-user-profile-and-account-management.md) - Requires authorization for account operations

## Future Enhancements

1. **User Ownership** (Phase 2):
   - Add `created_by_user_id` to guides/categories
   - Allow owners OR admins to modify content
   - ADR for ownership-based access control

2. **Admin Management UI** (Phase 2+):
   - Endpoint to promote/demote users (admin-only)
   - Admin screen in mobile app to manage other admins
   - Audit trail for admin actions

3. **Role-Based Permissions** (Phase 3+):
   - Replace boolean with role field (`admin`, `moderator`, `user`)
   - Define permissions per role (create, read, update, delete)
   - ADR for complete RBAC system

4. **Audit Logging** (Phase 3+):
   - Track all admin actions
   - Log who deleted/modified what and when
   - Compliance and accountability

## Date

2026-01-10

## Author

Claude Code Implementation
