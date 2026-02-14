# ADR-028: Multi-Language Guide Content

## Status
Accepted

## Context
AI guide generation from URLs translates content to English by default — a Dutch recipe URL produces an English guide. Users want guides in their original or preferred language. The API, mobile, and web apps need a `language` field on guides and a `preferred_languages` field on user profiles so language selectors pre-fill sensibly. The app UI itself stays English; only guide content is multilingual.

## Decision
Add ISO 639-1 language support across all layers of the stack.

### Language Model
- **Value object**: `Language` wraps a validated ISO 639-1 code string (not an enum — too many entries for ~184 codes). Validates against a `VALID_CODES` set at construction time.
- **Default**: `DEFAULT_LANGUAGE = Language("en")` — all existing data migrated to English.
- **Guide entity**: New `language: Language` field (default English) with `update_language()` method.
- **User entity**: New `preferred_languages: list[str]` field (default `["en"]`) with `set_preferred_languages()` method.

### API Changes
| Change | Scope |
|--------|-------|
| `language` field on Guide DTOs, Pydantic models, and response objects | Create, Update, Response |
| `language` parameter on generation endpoints | `POST /guides/generate`, `POST /guides/generate-from-url`, `POST /guides/with-steps` |
| `preferredLanguages` field on User DTOs and profile endpoints | Profile update, response |
| LLM prompt prefix `[Language: {code}]` when language ≠ English | AI generation |
| Two migrations: backfill `language="en"` on guides, `preferredLanguages=["en"]` on users | Data migration |

### Mobile App
- `Languages.ts` constant with all ~184 ISO 639-1 codes and native-script labels.
- `LanguageSelector` component: Modal-based searchable picker.
- `GuideFormScreen`: Language selector pre-filled from user preferences.
- `ProfileScreen`: Preferred languages checkbox section (10 common languages).
- Guide entity, DTOs, and mapper updated to carry `language` field.

### Web App
- Language `<select>` dropdown added to new-guide-page and generate-guide-page (10 common languages).
- Language badge on guide cards when language ≠ English.
- Generation service and models updated to thread `language` through all flows.

### Duration Convention
Step durations remain in **minutes** for AI-generated output and **seconds** in the domain model, consistent with ADR-027.

## Consequences

### Positive
- AI-generated guides preserve the original language of URL content.
- Users can create guides in any ISO 639-1 language.
- Preferred languages pre-fill selectors for a smoother creation flow.
- Backward compatible — existing data defaults to English via migration.

### Negative
- UI language selectors show only 10 common languages (not all 184) for UX simplicity.
- No language detection — users must explicitly select the target language.
- No content translation between languages after guide creation.

### Not in Scope (Future)
- Automatic language detection from URL content.
- Guide translation (convert existing guide to another language).
- Per-step language (mixed-language guides).
- Full ISO 639-1 language picker in web app (currently 10 common languages).
