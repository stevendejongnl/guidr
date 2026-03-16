---
name: guidr-api-test-patterns
description: Integration test conventions, domain value quirks, and DB field naming for Guidr API
type: project
---

## Integration test setup

- All HTTP tests use `@pytest.mark.asyncio` + `AsyncClient` from `httpx` via `conftest.py` fixtures
- `client` fixture provides an `AsyncClient` with `ASGITransport`; `auth_headers` and `admin_headers` are pre-built fixtures
- `db` fixture gives raw `AsyncIOMotorDatabase` for direct seeding/inspection
- Test DB is cleared per test: `users` and `guides` collections wiped in `app` fixture
- No `unittest.mock.patch` — tests hit the real MongoDB via testcontainers

## Domain status enums (PascalCase in wire format)

Session statuses are PascalCase strings from `SessionStatus` enum:
- `"NotStarted"` (not "pending")
- `"InProgress"` (not "active")
- `"Paused"`, `"Completed"`, `"Cancelled"`

## MongoDB document field naming

User mapper uses camelCase field names:
- `"isBeta"` (not `"is_beta"`) — needed when seeding beta users directly
- `"role"` — set to `"admin"` string to grant admin role

AuditLog mapper stores and reads these camelCase keys:
- `"_id"` must be a valid UUID string (EntityId validates UUID or MongoDB ObjectId)
- `"eventType"`, `"eventId"`, `"occurredAt"` (datetime object), `"userId"`, `"resourceType"`, `"resourceId"`, `"action"`, `"ipAddress"`, `"userAgent"`, `"createdAt"` (datetime)

## GetAuditLogs query routing

Default (no filter) → `find_admin_actions` (action in `["deleted", "updated"]`)
With `userId` → `find_by_user`
With both `resourceType` + `resourceId` → `find_by_resource`
With `startDate` + `endDate` → `find_by_date_range`

## AsyncClient.delete() limitation

`AsyncClient.delete()` does NOT accept a `json` kwarg. Use `client.request("DELETE", url, content=json.dumps(body), headers={..., "Content-Type": "application/json"})`.

## AdminUpdateUser returns 400 for unknown user

`AdminUpdateUser` use case raises `ValidationException("User not found")` → maps to HTTP 400 (not 404). The 404 path in the router only fires if the `find_by_id` after the use case returns None, which can't happen if the use case already raised.

## update_profile does not reflect updates immediately

`PATCH /auth/profile` router returns the `current_user` object (fetched before the use case ran). Updated fields won't appear in the response — only the original field values are returned. The update is persisted but the response reflects pre-update state.

## Beta user setup for /copy and /translate endpoints

`get_current_beta_user` dependency reads `is_beta` from the User entity, which is loaded from MongoDB field `"isBeta"`. To grant beta access in tests, update the DB directly: `{"$set": {"isBeta": True}}`.

## CopyGuide / TranslateGuide errors

- Invalid `targetLanguage` string → `ValueError` in `Language()` constructor → HTTP 400
- Non-existent source guide → `EntityNotFoundException` → HTTP 404
- Same-language copy does NOT raise — it succeeds and creates a duplicate guide

## Coverage baseline (post-sprint, 2026-03-16)

Total: 95% (771 tests). Key router coverage:
- `audit_logs.py`: 100%, `guide_favorites.py`: 100%
- `sessions.py`: 93%, `step_timers.py`: 94%, `guides.py`: 87%
- `generation.py`: 41% (LLM-heavy, hard to test without real API keys)
