# ADR-008: RBAC and Comprehensive Audit Logging System

## Status

Accepted

## Context

ADR-006 introduced a simple boolean `is_admin` authorization model, which provided basic admin/user distinction. However, as the platform grows, several limitations emerge:

1. **Limited auditability**: No comprehensive trail of who performed what actions and when
2. **Compliance requirements**: Need to track authentication events, admin actions, and domain changes for accountability
3. **First-user bootstrap**: No automatic admin promotion mechanism; requires manual script execution
4. **Extensibility**: Boolean model makes future role expansion difficult

Current state:
- Simple boolean `is_admin` field on User entity
- Manual admin promotion via script
- No audit logging infrastructure
- All authentication/admin actions untracked

Requirements:
- **RBAC**: Transition from boolean to proper role-based system (two roles: USER, ADMIN)
- **Audit Logging**: Comprehensive trail of authentication, admin actions, domain events, and API requests
- **Auto-Promotion**: First registered user automatically becomes admin
- **Backward Compatibility**: Zero-downtime migration from boolean system
- **Query Capabilities**: Efficient filtering of audit logs by user, resource, time range, action type

## Decision

We will implement a comprehensive RBAC and audit logging system:

### 1. Role-Based Access Control

**Role Value Object**:
- Create `Role` immutable value object with `RoleType` enum (USER, ADMIN)
- Encapsulates role validation and `is_admin()` method for authorization checks
- Replaces boolean `is_admin` with proper type safety

**User Entity Updates**:
- Add `role: Role` field to User entity
- Keep `is_admin` as derived property: `return self._role.is_admin()`
- Migration logic in mappers: if role field missing, derive from `is_admin` (backward compatibility)

**First-User Auto-Promotion**:
- In `RegisterUser` use case, check if existing users: `len(find_all()) == 0`
- If first user, set role to ADMIN; otherwise USER
- Emit `UserRegistered` and optionally `UserPromotedToAdmin` events
- No configuration required; always enabled

### 2. Audit Logging Infrastructure

**AuditLog Entity**:
- Immutable `AuditLog` dataclass with comprehensive fields:
  - `event_type`: Type of event (UserLoggedIn, GuideDeleted, etc.)
  - `event_id`: Reference to domain event
  - `occurred_at`: When event happened
  - `user_id`: Who performed the action
  - `resource_type`: What was affected (Guide, Category, User, etc.)
  - `resource_id`: Which resource
  - `action`: What happened (CREATE, UPDATE, DELETE, LOGIN)
  - `details`: JSON details about the action
  - `ip_address`: Request origin IP
  - `user_agent`: Client type
  - `created_at`: When logged

**Event Persistence Service**:
- Core service mapping domain events → audit logs
- Pattern matching on event types (UserRegistered, GuideDeleted, etc.)
- Extracts user_id, resource info, action details from each event type
- Provides context for audit log enrichment (ip_address, user_agent)

**Domain Events**:
- Add `UserRoleChanged` event (user_id, old_role, new_role, changed_by_user_id)
- Add `UserPromotedToAdmin` event (user_id, email, promoted_by_user_id, reason)
- Update `GuideDeleted` to include title (for audit context)
- Update `CategoryDeleted` to include name (for audit context)

**MongoDB Persistence**:
- `MongoAuditLogRepository` implementing `IAuditLogRepository`
- Query methods: `find_by_user()`, `find_by_resource()`, `find_by_date_range()`, `find_admin_actions()`
- Indexes on userId, resourceType+resourceId, occurredAt, eventId (unique)
- Insert-only pattern (no updates) for immutability

### 3. Event-Driven Architecture

**Use Case Integration**:
- All domain-modifying use cases persist events via `EventPersistenceService`
- Pattern: Create event after operation, persist with user context
- Examples:
  - `RegisterUser`: Persists `UserRegistered` + optionally `UserPromotedToAdmin`
  - `LoginUser`: Persists `UserLoggedIn`
  - `DeleteGuide`: Persists `GuideDeleted`
  - `UpdateCategory`: Persists `CategoryUpdated`

**API Request Tracking**:
- `RequestLoggingMiddleware` intercepts HTTP requests
- Extracts IP address (from X-Forwarded-For or client IP)
- Extracts user agent
- Measures request duration
- Fire-and-forget async logging for authenticated requests (non-blocking)

### 4. Query and Access

**GetAuditLogs Use Case**:
- Admin-only endpoint `/api/v1/audit-logs`
- Flexible query parameters: userId, resourceType, resourceId, startDate, endDate, limit, offset
- Returns paginated audit log entries with human-readable details

### 5. Backward Compatibility

**Data Migration**:
- MongoDB stores both fields during transition: `role` and `isAdmin`
- UserMapper `to_entity()`: Prefers `role`, falls back to `is_admin` for old documents
- UserMapper `to_document()`: Writes both fields

**Client Updates**:
- Mobile/Web apps prefer `role` field, fall back to `isAdmin`
- No breaking changes to API (new optional fields)

**Implementation**:
```python
# Domain
Role(RoleType.ADMIN) or Role(RoleType.USER)

# Use case
require_admin(current_user)  # Same authorization helper

# API (backward compatible)
class UserResponseDTO:
    is_admin: bool  # Derived: user.role.is_admin()
    role: str      # "admin" or "user"
```

## Consequences

### Positive

✅ **Comprehensive audit trail**: Complete record of authentication, admin actions, domain changes, API requests
✅ **Compliance-ready**: Timestamps, user tracking, action details for accountability
✅ **First-user automation**: No manual script required; auto-promotion on first registration
✅ **Type-safe RBAC**: Role as value object prevents invalid states
✅ **Event-driven**: Domain events are source of truth; audit logs derived from events
✅ **Query flexibility**: Filter audit logs by user, resource, time range, action type
✅ **Extensible foundation**: Role value object can expand to 3+ roles (moderator, etc.)
✅ **Zero-downtime migration**: Backward compatible with boolean `is_admin` field
✅ **Non-blocking logging**: Async fire-and-forget middleware doesn't slow requests
✅ **Immutable audit logs**: Insert-only pattern ensures integrity and non-repudiation

### Negative

❌ **Storage overhead**: New `audit_logs` collection grows with every action
  - Mitigation: Add TTL index for retention (e.g., 90 days)

❌ **Event schema coupling**: Adding new events requires EventPersistenceService updates
  - Mitigation: Pattern matching handles new events; well-documented pattern

❌ **IP address unreliability**: Behind load balancers, X-Forwarded-For may be missing/spoofed
  - Mitigation: Prefer X-Forwarded-For over client IP; document assumptions

❌ **Async logging latency**: Fire-and-forget means audit log may appear after request completes
  - Mitigation: Acceptable for non-critical tracking; local buffering if stricter ordering needed

### Neutral

- **Dual field storage** during transition: Some `user` documents have both `role` and `isAdmin`
  - Resolution: After migration period, remove `isAdmin` in cleanup script
  - No impact: Application handles either field

## Alternatives Considered

### 1. Synchronous Audit Logging
**Rejected**: Impacts request latency
- Storing audit logs synchronously would block API responses
- Fire-and-forget async approach better for user experience

### 2. Event Sourcing (All Events Immutable)
**Rejected**: Over-engineered for current needs
- Full event sourcing adds complexity for event rebuilding
- Current domain events + event persistence service sufficient
- Can upgrade to full event sourcing later if needed

### 3. Separate Audit Service (Microservice)
**Rejected**: Monorepo adds unnecessary complexity
- Audit logging co-located in FastAPI app is simpler
- Future: Can extract to separate service if needed

### 4. Per-User Event Log vs. Global Audit Log
**Chosen**: Global audit log with filtering
- Simplifies admin queries (all actions in one place)
- Efficient indexes for common queries (by resource, date)
- Better for compliance/forensics

### 5. Simple Boolean Role vs. Role Value Object
**Chosen**: Role value object
- Type-safe, prevents invalid values
- Encapsulates business logic (is_admin() method)
- Easier to extend to 3+ roles later

## Implementation Notes

### File Structure

**Domain Layer** (6 files):
- `src/domain/value_objects/role.py` - Role value object
- `src/domain/entities/user.py` - Updated with role field
- `src/domain/entities/audit_log.py` - Audit log entity
- `src/domain/repositories/audit_log_repository.py` - Repository interface
- `src/domain/services/event_persistence_service.py` - Event → audit log mapping
- `src/domain/events/user_events.py` - UserRoleChanged, UserPromotedToAdmin events

**Infrastructure Layer** (5 files):
- `src/infrastructure/persistence/mongodb/repositories/audit_log_repository.py` - MongoDB implementation
- `src/infrastructure/persistence/mongodb/mappers/audit_log_mapper.py` - Entity ↔ document mapping
- `src/infrastructure/persistence/mongodb/mappers/user_mapper.py` - Updated for role field + backward compatibility
- `src/infrastructure/persistence/mongodb/indexes.py` - Create MongoDB indexes
- `src/infrastructure/persistence/mongodb/database.py` - Call create_indexes() on connect

**Application Layer** (7 files):
- `src/application/use_cases/user/register_user.py` - First-user auto-promotion + event persistence
- `src/application/use_cases/user/login_user.py` - Event persistence
- `src/application/use_cases/guide/delete_guide.py` - Event persistence with title
- `src/application/use_cases/guide/update_guide.py` - Event persistence
- `src/application/use_cases/category/delete_category.py` - Event persistence with name
- `src/application/use_cases/category/update_category.py` - Event persistence
- `src/application/use_cases/audit_log/get_audit_logs.py` - Query use case

**Presentation Layer** (5 files):
- `src/presentation/api/middleware/request_logging.py` - Request tracking middleware
- `src/presentation/api/routers/audit_logs.py` - GET /audit-logs endpoint
- `src/presentation/api/models/audit_log_models.py` - Pydantic models
- `src/presentation/api/models/user_models.py` - Updated UserResponse with role
- `src/presentation/api/app.py` - Register middleware + router

**DI Container**:
- `src/container.py` - Add audit_log_repository, event_persistence_service, get_audit_logs_use_case

**Mobile & Web** (5 files):
- Update User entity, DTOs, mappers with role field
- Backward compatible with `isAdmin` fallback

### Testing Strategy
- Unit tests for Role value object (enum validation, is_admin() method)
- Integration tests for EventPersistenceService (all event types → audit logs)
- Use case tests verify event persistence (mocks check persist_event calls)
- API tests verify audit log querying (admin-only, filtering)
- End-to-end: First user promoted to admin, login logged, admin action tracked

### Deployment
1. Deploy code (backward compatible, reads both fields)
2. MongoDB indexes created automatically on first connect
3. Audit logs collection created on first write
4. Existing users continue working (mapper handles migration)
5. Optional: Backfill role field for existing users after monitoring

## Related Decisions

- [ADR-006: Admin User Authorization](./006-admin-user-authorization.md) - Superseded by this ADR
- [ADR-007: User-Based Admin Mode for Mobile App](./007-user-based-admin-mode-mobile.md) - Compatible with RBAC

## Future Enhancements

1. **Additional Roles** (Phase 4+):
   - Expand RoleType enum: MODERATOR, VIEWER, etc.
   - Define permissions per role
   - No code changes needed (role value object already extensible)

2. **Audit Log Retention Policy** (Phase 4+):
   - Add TTL index for 90-day retention
   - Implement archive/delete policy for compliance

3. **Audit Log Analytics** (Phase 5+):
   - Dashboard for admin activity
   - Alerts for suspicious patterns
   - Export to compliance systems

4. **User Ownership of Content** (Phase 5+):
   - Add `created_by_user_id` to guides/categories
   - Allow owners to edit/delete own content
   - ADR for ownership-based access control

5. **Full Event Sourcing** (Future):
   - Event store for complete history
   - Event replay for state reconstruction
   - Separate from current audit log approach

## Date

2026-01-12

## Author

Claude Code Implementation
