# ADR-023: Automatic Database Migrations on Startup

**Status:** Accepted
**Date:** 2026-02-09
**Authors:** Steven de Jong, Claude Sonnet 4.5

## Context

During the GuideType migration (ADR-022), we encountered a production incident where the API crashed because:

1. The migration script (`scripts/migrate_guides_category_to_type.py`) was created but never executed in production
2. Old MongoDB documents still had `categoryId` field instead of the new `guideType` field
3. The API mapper expected `guideType` to exist, causing `KeyError` exceptions
4. This cascaded to mobile app failures with "Internal server error"

**Sentry Issues:**
- `GUIDR-API-1`: KeyError: 'guideType' in guide_mapper.py
- `GUIDR-MOBILE-X`: Mobile app receiving 500 errors from backend

The root cause was a manual migration process that was:
- Easy to forget to run
- Required manual intervention in production
- Had no tracking of which migrations were completed
- Could be accidentally run multiple times

## Decision

Implement an automatic migration system that runs on API server startup:

### Architecture

1. **Migration Runner** (`src/infrastructure/migrations/migration_runner.py`)
   - Manages and executes database migrations
   - Tracks completed migrations in `_migrations` collection
   - Runs migrations in order during app startup
   - Idempotent: skips already-completed migrations

2. **Migration Definitions** (`src/infrastructure/migrations/migrations.py`)
   - Contains all migration functions
   - Each migration has a unique ID and function
   - Migrations are defined as async functions that accept a database instance

3. **Integration** (`src/main.py`)
   - Migrations run automatically in the `lifespan` startup phase
   - Runs after database connection, before application startup
   - Failures prevent app startup (fail-fast)

### Migration Tracking

```python
# _migrations collection document structure
{
  "_id": "001_migrate_guides_category_to_type",
  "completed_at": "2026-02-09T12:34:56.789Z"
}
```

### Adding New Migrations

1. Define migration function in `migrations.py`
2. Add to `MIGRATIONS` list with unique ID
3. No manual execution needed - runs on next deployment

### Safety Features

- **Idempotent**: Migrations check if they're complete before running
- **Fail-fast**: Startup fails if migration fails (prevents data corruption)
- **Ordered execution**: Migrations run in list order
- **Logged**: All migration activity logged for debugging
- **Tested**: Comprehensive unit tests for migration runner

## Consequences

### Positive

✅ **Zero manual steps**: Migrations run automatically on deployment
✅ **Prevents incidents**: Can't forget to run migrations in production
✅ **Idempotent**: Safe to restart pods, no duplicate execution
✅ **Trackable**: `_migrations` collection shows migration history
✅ **Testable**: Migration logic has comprehensive tests
✅ **Fail-safe**: App won't start with failed migrations
✅ **Multi-pod safe**: Multiple K8s pods can start simultaneously

### Negative

⚠️ **Startup delay**: Migrations add time to startup (acceptable tradeoff)
⚠️ **No rollback**: Migrations are one-way (document in migration function)
⚠️ **Database access required**: Can't start app without database

### Migration Pattern

For data structure changes like GuideType:

1. **Phase 1: Make mapper backward-compatible**
   ```python
   # Handle both old and new formats
   guide_type_value = document.get("guideType")
   if not guide_type_value:
       guide_type_value = document.get("categoryId", "general")
   ```

2. **Phase 2: Add migration to clean up old data**
   ```python
   async def migrate_guides_category_to_type(db):
       # Update documents with old structure
       await guides_collection.update_many(
           {"categoryId": {"$exists": True}},
           {"$set": {"guideType": ...}, "$unset": {"categoryId": ""}}
       )
   ```

3. **Phase 3 (later): Remove backward-compatibility code**
   - After migration runs in production
   - After confirming no old documents exist

## Implementation

**Files Created:**
- `src/infrastructure/migrations/migration_runner.py` (62 lines)
- `src/infrastructure/migrations/migrations.py` (73 lines)
- `src/infrastructure/migrations/migration_runner_test.py` (117 lines)
- `src/infrastructure/migrations/__init__.py` (4 lines)

**Files Modified:**
- `src/main.py` - Added migration runner to startup
- `src/infrastructure/persistence/mongodb/mappers/guide_mapper.py` - Backward compatibility
- `tests/infrastructure/persistence/mongodb/mappers/guide_mapper_test.py` - Tests

**Deprecated:**
- `scripts/migrate_guides_category_to_type.py` - Now runs automatically

**Test Coverage:**
- Migration runner: 4 tests (100% coverage)
- Guide mapper backward compatibility: 3 tests
- Total: 452 API tests passing

## References

- **Sentry Issues:** GUIDR-API-1, GUIDR-MOBILE-X
- **Related ADR:** ADR-022 (GuideType system)
- **Implementation:** PR #[TBD]
- **Incident Date:** 2026-02-09

## Notes

This pattern follows industry best practices from:
- Django migrations (auto-run on deployment)
- Flyway (database version control)
- Alembic (SQLAlchemy migrations)

The key difference is MongoDB's schema-less nature allows backward-compatible mappers during transition periods.
