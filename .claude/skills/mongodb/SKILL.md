---
name: mongodb
description: Query, analyze, and fix data in the Guidr MongoDB database. Use when investigating data issues, checking integrity, or applying corrections. Supports local and production environments. Runs scripts from scripts/mongodb/.
---

# MongoDB Skill

Query, analyze, improve, and fix data in the Guidr MongoDB database.

## Prerequisites

Ensure `.envrc` is loaded (`direnv allow`). For local: MongoDB running on localhost. For production: set `MONGODB_PRODUCTION_URL` in `.envrc`.

## Run Commands

All scripts use `uv run` from the api-server directory:

```bash
UV="uv run --directory api-server python"
```

## Environment Switching

```bash
# Local (default) — uses MONGODB_URL / MONGODB_DATABASE from .envrc
$UV ../scripts/mongodb/query.py collections

# Production — uses MONGODB_PRODUCTION_URL, database "guidr_production"
$UV ../scripts/mongodb/query.py collections --env production
```

All three scripts (`query.py`, `analyze.py`, `fix.py`) accept `--env local|production`.

## Query Data

```bash
$UV ../scripts/mongodb/query.py collections
$UV ../scripts/mongodb/query.py find guides --filter '{"userId": "abc-123"}'
$UV ../scripts/mongodb/query.py find steps --filter '{"guideId": "x"}' --sort '{"order": 1}'
$UV ../scripts/mongodb/query.py find users --project '{"email": 1, "role": 1}'
$UV ../scripts/mongodb/query.py count sessions --filter '{"status": "completed"}'
$UV ../scripts/mongodb/query.py distinct users role
$UV ../scripts/mongodb/query.py aggregate guides --pipeline '[{"$group": {"_id": "$guideTypeId", "count": {"$sum": 1}}}]'
$UV ../scripts/mongodb/query.py indexes guides
```

## Analyze Data

```bash
$UV ../scripts/mongodb/analyze.py stats
$UV ../scripts/mongodb/analyze.py schema guides
$UV ../scripts/mongodb/analyze.py orphans
$UV ../scripts/mongodb/analyze.py integrity
$UV ../scripts/mongodb/analyze.py duplicates users email
```

## Fix Data

All fix commands run in **dry-run mode** by default. Add `--apply` to execute.

```bash
$UV ../scripts/mongodb/fix.py remove-orphans
$UV ../scripts/mongodb/fix.py remove-orphans --apply
$UV ../scripts/mongodb/fix.py set-field users verified true
$UV ../scripts/mongodb/fix.py unset-field guides legacyField
$UV ../scripts/mongodb/fix.py rename-field guides old_name new_name
$UV ../scripts/mongodb/fix.py update sessions --filter '{"status": "stuck"}' --update '{"$set": {"status": "completed"}}'
$UV ../scripts/mongodb/fix.py delete audit_logs --filter '{"occurredAt": {"$lt": "2024-01-01"}}'
```

## Collections

| Collection | Description |
|---|---|
| `users` | User accounts (id, email, role) |
| `guides` | Guide documents (id, userId, title, guideTypeId, metadata) |
| `steps` | Steps within guides (id, guideId, title, order, duration) |
| `sessions` | User sessions (id, guideId, userId, status: not_started/in_progress/paused/completed) |
| `step_timers` | Active timer states per step |
| `guide_favorites` | User favorited guides |
| `categories` | Guide categories |
| `audit_logs` | Admin action audit trail |
| `_migrations` | Schema migration tracking |

## Workflow

1. **Investigate**: Use `query.py` to find and explore data
2. **Analyze**: Use `analyze.py` to check integrity and find issues
3. **Preview**: Use `fix.py` in dry-run to see what would change
4. **Apply**: Use `fix.py --apply` after confirming the fix is correct
