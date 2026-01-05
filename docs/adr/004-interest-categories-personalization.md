# ADR-004: Interest Categories for User Personalization

## Status

Proposed

## Context

Guidr is designed for executing guides across many different domains:
- Baking and cooking (recipes)
- Sports and workouts (exercise routines)
- Lab protocols (scientific procedures)
- DIY and crafts (project instructions)
- Beauty and skincare (routines)

Currently, all guides are treated equally with no way to:
1. **Filter guides by user interests**: Users see all guides regardless of relevance
2. **Personalize recommendations**: No way to suggest guides based on user preferences
3. **Organize user's content**: Users can't easily find guides relevant to their interests
4. **Customize app experience**: No way to tailor UI/UX based on primary use case

User feedback indicates that many users focus on 1-3 primary use cases (e.g., a user primarily interested in baking and fitness doesn't want to see lab protocol guides).

## Decision

We will implement an **interest categories system** for user personalization:

### User Profile Integration

**User Entity** (`api-server/src/domain/entities/user.py`):
- Add `interests: list[str]` field to User entity
- Store as array of category IDs (e.g., `["baking", "sports"]`)
- Allow multiple interests per user (not mutually exclusive)
- Empty list by default (optional for existing users)

**Example**:
```python
user = User(
    id=EntityId("uuid"),
    email=Email("user@example.com"),
    password_hash="...",
    name="John Doe",
    interests=["baking", "sports", "diy"]
)
```

### Category Definition (MVP)

**Hardcoded categories** defined in both backend and frontend:

**Backend** (`api-server/src/domain/constants.py`):
```python
INTEREST_CATEGORIES = [
    "baking",
    "cooking",
    "sports",
    "workouts",
    "lab",
    "crafts",
    "diy",
    "beauty",
]
```

**Frontend** (`src/domain/constants/InterestCategories.ts`):
```typescript
export const INTEREST_CATEGORIES = [
  { id: 'baking', label: 'Baking' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'sports', label: 'Sports & Fitness' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'lab', label: 'Lab Protocols' },
  { id: 'crafts', label: 'Arts & Crafts' },
  { id: 'diy', label: 'DIY & Home Improvement' },
  { id: 'beauty', label: 'Beauty & Skincare' },
]
```

### User Interface

**ProfileScreen** - Interest selection via checkboxes:
```
Interests:
☑ Baking
☐ Sports & Fitness
☑ Cooking
☐ Workouts
☐ Lab Protocols
```

Users can select/deselect any combination. Changes saved via `PATCH /api/v1/users/profile`.

### Future Enhancements (Not in MVP)

⏭ **Server-driven categories**: Load categories from API endpoint
⏭ **Category metadata**: Icons, colors, descriptions
⏭ **Guide filtering**: Filter guide list by selected interests
⏭ **Recommendations**: Suggest guides based on interests
⏭ **Category analytics**: Track popular categories, usage patterns
⏭ **Custom categories**: Allow users to create custom interest tags
⏭ **Interest-based defaults**: Pre-select categories during onboarding

## Consequences

### Positive

- **Simple MVP**: Hardcoded list allows quick implementation without API complexity
- **User-driven**: Users explicitly choose interests (opt-in, not algorithmic)
- **Multi-interest support**: Users can be interested in multiple domains
- **Foundation for features**: Enables future filtering, recommendations, and analytics
- **No migration complexity**: Existing users have empty interests (backward compatible)
- **Clear UX**: Checkbox UI is familiar and self-explanatory
- **Lightweight data**: Stored as array of strings (small storage footprint)

### Negative

- **Hardcoded in two places**: Categories must stay in sync between backend and frontend
  - **Risk**: Drift between frontend labels and backend IDs
  - **Mitigation**: Document in code, consider validation endpoint (future)
- **No localization**: Category labels in English only (can add i18n later)
- **Limited initial categories**: Only 8 categories in MVP (can expand later)
- **No category hierarchy**: Flat list (no parent/child categories like "Cooking > Baking")
- **No icons/visuals**: Text-only in MVP (can add icons for better UX later)

### Design Decisions

**Why hardcoded vs. API-driven?**
- **Faster MVP**: No need for category CRUD endpoints and admin UI
- **Stable categories**: Interest categories unlikely to change frequently
- **Validation**: Can validate user interests against hardcoded list
- **Migration path**: Easy to evolve to API-driven later by adding `GET /categories` endpoint

**Why array of strings vs. relational IDs?**
- **Simplicity**: No need for separate Categories collection
- **Flexibility**: Easy to add/remove categories without migrations
- **Query simplicity**: MongoDB `$in` operator works well with arrays
- **Denormalization**: Acceptable tradeoff for MVP (category data is tiny)

**Why optional vs. required?**
- **Onboarding friction**: Don't force interest selection during registration
- **User freedom**: Some users may not want to categorize themselves
- **Existing users**: Backward compatible (empty list = no interests selected)

## Alternatives Considered

### 1. Tags Instead of Categories
**Rejected**: More flexible but less structured. Tags are better for content tagging (guides), categories are better for user classification.

### 2. Single Interest (Radio Buttons)
**Rejected**: Too restrictive. Many users have multiple interests (e.g., baking + sports).

### 3. Free-Text Interest Field
**Rejected**: No structure, can't filter/group, difficult to analyze. Predefined categories provide better UX and analytics.

### 4. Skill Levels Instead of Categories
**Rejected**: Orthogonal concept. Skill level (beginner/advanced) could be added separately per category later.

### 5. API-Driven Categories from Day 1
**Rejected**: Over-engineering for MVP. Hardcoded list is sufficient until we know which categories are popular.

## Implementation Notes

- **Validation**: Backend should validate that submitted interests exist in `INTEREST_CATEGORIES` list
- **Case-insensitive matching**: Store interest IDs in lowercase, compare case-insensitively
- **Duplicate prevention**: Backend should deduplicate interests before saving
- **Empty list is valid**: Users don't have to select any interests
- **Update granularity**: Updating interests replaces entire list (not append/remove operations)
- **Event emission**: Emit `UserProfileUpdated` event when interests change

## Migration Path to API-Driven

When we outgrow hardcoded categories:

1. Create `categories` collection in MongoDB
2. Seed with existing hardcoded categories
3. Add `GET /api/v1/categories` endpoint
4. Update frontend to fetch categories on ProfileScreen load
5. Add admin UI for category management (optional)
6. Maintain backward compatibility (validate against DB instead of hardcoded list)

## Related Decisions

- [ADR-001: User Profile and Account Management System](./001-user-profile-and-account-management.md) - Interests are part of user profile
- Future ADR: Guide filtering by interests
- Future ADR: Recommendation engine based on interests

## Date

2026-01-05
