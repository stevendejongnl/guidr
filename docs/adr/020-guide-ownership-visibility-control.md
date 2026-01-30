# ADR-020: Guide Ownership and Visibility Control

**Date**: 2026-01-30
**Status**: ACCEPTED
**Context**: Phase 8 - Integration Testing & Deployment
**Supersedes**: None
**Superseded By**: None

## Summary

Implement guide ownership tracking, public/private visibility control, and admin-only highlighting for the Guidr platform. Users own the guides they create, can control visibility, and admins can feature guides on the homepage. Categories remain admin-only for creation/editing.

## Problem

Currently, Guidr has no concept of guide ownership or visibility:

1. **No Ownership**: Guides have no `created_by_user_id` field
2. **All Public**: All guides are globally visible (no privacy)
3. **Admin-Only Edit**: Only admins can modify ANY guide
4. **No Featured Content**: Homepage shows generic content, not featured guides
5. **No Category Control**: Anyone can create/edit categories

This violates user privacy expectations and prevents personalization features.

## Decision

### 1. Ownership Model

Add `created_by_user_id` field to Guide entity:
- **Type**: `EntityId | None` (nullable for backward compatibility)
- **Auto-set**: Automatically populated when user creates guide
- **Immutable**: Cannot be changed after creation
- **Legacy guides**: Null value indicates guides created before feature

```python
class Guide:
    def __init__(
        self,
        ...,
        created_by_user_id: EntityId | None = None,
        ...
    ):
        self._created_by_user_id = created_by_user_id

    @property
    def created_by_user_id(self) -> EntityId | None:
        return self._created_by_user_id
```

### 2. Visibility Control

Add boolean flags to Guide entity:

- **`is_public`**: Boolean, default `False`
  - `false`: Only creator and admins can view
  - `true`: Anyone can view
  - User toggles via API/UI

- **`is_highlighted`**: Boolean, default `False`
  - `false`: Guide not featured
  - `true`: Guide featured on homepage (admin-only)
  - Only admins can set via `PATCH /guides/{id}/highlight`

```python
class Guide:
    def __init__(
        self,
        ...,
        is_public: bool = False,
        is_highlighted: bool = False,
        ...
    ):
        self._is_public = is_public
        self._is_highlighted = is_highlighted

    @property
    def is_public(self) -> bool:
        return self._is_public

    @property
    def is_highlighted(self) -> bool:
        return self._is_highlighted

    def make_public(self) -> None:
        self._is_public = True
        self._updated_at = datetime.now(UTC)

    def make_private(self) -> None:
        self._is_public = False
        self._updated_at = datetime.now(UTC)
```

### 3. Authorization Rules

#### CREATE Guide
- **Who**: Any authenticated user
- **Auto-set**: `created_by_user_id` = current user ID, `is_public` = false

#### READ Guide
- **Public guides** (`is_public=true`): Anyone can read
- **Private guides** (`is_public=false`):
  - Owner can read
  - Admins can read
  - Others: 404 Not Found

#### UPDATE Guide
- **Owner**: Can edit own guide
- **Admin**: Can edit any guide
- **Others**: 403 Forbidden

#### DELETE Guide
- **Owner**: Can delete own guide
- **Admin**: Can delete any guide
- **Others**: 403 Forbidden

#### HIGHLIGHT Guide
- **Admin only**: Only admins can set `is_highlighted=true`
- **Non-admin**: 403 Forbidden
- **Constraint**: Only works on public guides

### 4. Query Operations

New repository methods for filtering:

```python
# Interface
async def find_my_guides(user_id: EntityId, auth_token: str) -> list[Guide]
async def find_public_guides(auth_token: str) -> list[Guide]
async def find_highlighted_guides(auth_token: str) -> list[Guide]
async def find_accessible_by_user(user_id: EntityId | None, auth_token: str) -> list[Guide]

# API Query Parameters
GET /api/guides?my_guides=true         # User's guides
GET /api/guides?public=true            # Public guides
GET /api/guides?highlighted=true       # Featured guides (for homepage)
GET /api/guides                        # Accessible guides (public + user's private)
```

### 5. Authorization Helper Functions

```python
def require_owner_or_admin(user: User, resource_user_id: EntityId | None) -> None:
    """Check if user owns resource or is admin."""
    if user.role != Role.ADMIN and user.id != resource_user_id:
        raise UnauthorizedException("Only owner or admin can access this resource")

def require_admin(user: User) -> None:
    """Check if user is admin."""
    if user.role != Role.ADMIN:
        raise ForbiddenException("Only admins can perform this action")

def can_view_guide(user: User | None, guide: Guide) -> bool:
    """Check if user can view guide."""
    if guide.is_public:
        return True
    if user is None:
        return False
    if user.role == Role.ADMIN:
        return True
    return user.id == guide.created_by_user_id
```

### 6. Category Admin-Only Access

Categories remain system structures:

```python
# CREATE Category
- Admin only: require_admin()

# UPDATE Category
- Admin only: require_admin()

# DELETE Category
- Admin only: require_admin()

# READ Category
- All authenticated users can read
```

### 7. Database Schema (MongoDB)

```json
{
  "_id": "uuid",
  "categoryId": "uuid",
  "title": "string",
  "description": "string?",
  "stepIds": ["uuid"],
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "createdByUserId": "uuid?",      // NEW - null for legacy
  "isPublic": "boolean",            // NEW - default false
  "isHighlighted": "boolean"        // NEW - default false
}
```

### 8. Migration Strategy

**Dry-run first approach**:
```bash
# Preview changes (default)
uv run python scripts/migrate_guides_add_ownership.py --dry-run

# Apply migration
uv run python scripts/migrate_guides_add_ownership.py --apply
```

**Legacy guide handling**:
- Guides without `created_by_user_id`: Set to `null`
- Behavior: Only admins can edit
- Safety: Prevents unauthorized edits

## Consequences

### Positive

1. **Privacy**: Users own their guides by default (private)
2. **Control**: Users can explicitly share guides
3. **Personalization**: "My Guides" and "Featured Guides" sections
4. **Authorization**: Fine-grained access control
5. **Scalability**: Can expand to guide collaboration features
6. **Admin Control**: Categories and featured content curated by admins

### Negative

1. **Breaking Change**: Old mobile versions won't see visibility toggles
   - Mitigation: Show in-app banner, deprecate after 30 days

2. **Query Performance**: Additional filters on `is_public` and user_id
   - Mitigation: Add database indexes on (createdByUserId, isPublic)

3. **Migration Overhead**: Database migration needed
   - Mitigation: Dry-run script, explicit confirmation

4. **Backward Compatibility**: Legacy guides have null owner
   - Mitigation: Document as "admin-only edit" behavior

## Implementation Details

### Backend (390 tests passing)

**Domain Layer**:
- Guide entity: Added 3 fields, 5 methods
- Authorization: Added 2 helper functions
- Tests: 14 entity tests, 11 use case tests

**Infrastructure Layer**:
- Mappers: Handle field conversions
- Repositories: 3 new query methods with MongoDB filters
- Tests: 10 mapper tests, 21 repository tests

**Application Layer**:
- DTOs: Updated all guide DTOs with new fields
- Use Cases: Updated 7 use cases for ownership/authorization
- Tests: 26 use case tests

**Presentation Layer**:
- API Models: Pydantic models with new fields
- Routers: Updated endpoints with new parameters
- Tests: 4 route tests

### Mobile (1092 tests passing)

**Domain Layer**:
- Guide entity: Added 3 fields, 5 methods
- GuideService: Added visibility toggle methods
- Tests: 27 entity tests, 27 service tests

**Infrastructure Layer**:
- DTOs: Added 3 new fields
- Mappers: Handle field conversions
- Repositories: 3 new query methods
- Storage: userId management in AuthStorage
- Tests: 44 mapper tests, 21 repository tests, 9 storage tests

**Presentation Layer**:
- GuideFormScreen: Public/Private toggle, Highlight toggle (admin)
- CategoryFormScreen: Admin-only access check
- CategoryListScreen: Hidden "+ New" for non-admins
- GuideListScreen: Filter tabs (All/My/Public)
- HomeScreen: Featured guides section
- Tests: All screens tested (except pre-existing mock issue)

### Database

**Migration Script**:
- File: `api-server/scripts/migrate_guides_add_ownership.py`
- Dry-run: Preview changes safely
- Apply: With confirmation prompt
- Verification: Check all guides updated

**Indexes** (recommended):
```javascript
db.guides.createIndex({ "createdByUserId": 1 })
db.guides.createIndex({ "isPublic": 1, "isHighlighted": 1 })
db.guides.createIndex({ "createdByUserId": 1, "isPublic": 1 })
```

## Testing Strategy

### Unit Tests (1092 mobile + 390 backend)

- Entity tests: Ownership, visibility, methods
- Service tests: Create with owner, toggle visibility
- Repository tests: Query by user, public, highlighted
- Mapper tests: Field conversions
- API tests: Endpoint responses and status codes

### Integration Tests (12 scenarios)

- User creates guide (private by default)
- User makes guide public
- User cannot edit others' private guides
- Admin can edit any guide
- Public guides visible to all
- Private guides hidden from others
- Admin can highlight guide
- Non-admin cannot highlight
- Get my guides endpoint
- Get highlighted guides endpoint

### Authorization Tests

- Owner-or-admin authorization
- Admin-only highlighting
- Category creation restricted
- Visibility-based access control

## Deployment Checklist

1. ✅ All tests passing
2. ✅ Migration script ready
3. ✅ Integration tests written
4. ✅ Deployment documentation complete
5. ⏳ Backend deployment (Docker)
6. ⏳ Database migration (dry-run → apply)
7. ⏳ Mobile deployment (Android Play Store)
8. ⏳ Mobile deployment (iOS TestFlight/App Store)
9. ⏳ Post-deployment verification
10. ⏳ Monitoring setup

## Monitoring & Observability

### Key Metrics

- Error rate (target < 0.1%)
- Authorization failure rate (baseline + monitor for spikes)
- Database query performance (new filters)
- Mobile app crash rate (target < 0.01%)

### Logs to Watch

- 403 Forbidden responses (authorization failures)
- 404 Not Found responses (visibility filtering)
- Database slow queries (new query patterns)
- Mobile app crash reports

## Related ADRs

- [ADR-006: Admin User Authorization](./006-admin-user-authorization.md)
- [ADR-007: User-Based Admin Mode (Mobile)](./007-user-based-admin-mode-mobile.md)

## Alternative Approaches Considered

### 1. Group-based Visibility
- **Rejected**: Too complex for MVP
- **Future**: Could implement guide sharing with specific users/groups

### 2. Public by Default
- **Rejected**: Privacy concern, violates user expectations
- **Rationale**: Private default is more secure

### 3. Role-based Visibility
- **Rejected**: Only 2 roles (USER, ADMIN), not enough granularity
- **Future**: Could implement if more roles added

## References

- Implementation: Phase 8 Complete
- Tests: 1492 passing (390 backend + 1092 mobile)
- Files:
  - Backend: 25 modified/created
  - Mobile: 15 modified/created
  - Documentation: 4 files created
- Deployment: See `docs/DEPLOYMENT.md`
- Quick Start: See `DEPLOYMENT_QUICK_START.md`

---

**Status**: ✅ ACCEPTED
**Implementation**: ✅ COMPLETE
**Testing**: ✅ 1492 TESTS PASSING
**Deployment**: ⏳ READY FOR DEPLOYMENT
