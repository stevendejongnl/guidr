# ADR-022: Replace Category with Predefined GuideType System

## Status

Accepted

## Context

Categories were user-created, hierarchical entities managed via CRUD screens (list, create, edit, delete). This introduced unnecessary complexity:

- Categories required a full entity lifecycle (domain entity, repository, service, API endpoints, mobile screens)
- Users rarely created custom categories — the same types appeared across all installations
- The hierarchical parent-child model was never used meaningfully
- Six API endpoints and four mobile screens existed solely for category management

In practice, guides have a **type** (cooking, workout, general) that determines their structure and available metadata. Types should be predefined in code, not user-managed.

## Decision

Replace the dynamic Category system with a predefined `GuideType` enum:

- **GuideType values**: `cooking`, `workout`, `general` (extensible via code changes)
- **Metadata**: Type-specific schema validated at domain layer (`dict[str, Any] | None` on Guide entity)
  - Cooking: `{ "ingredients": [...] }`
  - Workout: `{ "target_muscles": [...], "equipment": [...] }`
  - General: no metadata
- **guide_type is immutable** after creation (same as category_id was)
- **No shared package** for type schemas — duplicated in API/mobile with test verification

### Removed

- Category entity, repository, service (domain layer)
- Category events (event system)
- Category API endpoints (6 routes)
- Category mobile screens (4 screens) and components (4 components + tests)
- CategoryMapper, CategoryDto (infrastructure layer)

### Added

- `GuideType` value object with validation and metadata schemas (API)
- `GuideTypes` constants module (mobile)
- `GuideTypeSelector` component (mobile)
- `guide_type` + `metadata` fields on Guide entity (replacing `category_id`)
- Database migration script for existing data

## Consequences

### Positive

- Reduced codebase by ~40 files (entities, services, repositories, screens, tests)
- Simplified guide creation flow (select type vs. browse/create categories)
- Type-specific metadata enables richer guide content
- No API calls needed to load available types

### Negative

- Adding new guide types requires a code deployment (not user-configurable)
- Existing guides need data migration (`category_id` -> `guide_type: "general"`)
- Breaking API change: category endpoints removed, guide endpoints use `guideType` instead of `categoryId`

### Risks

- Migration must handle guides with category IDs that don't map to known types (defaulting to "general")
