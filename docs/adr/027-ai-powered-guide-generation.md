# ADR-027: AI-Powered Guide Generation

## Status
Accepted

## Context
Users currently have no way to generate structured guides from free-form input. Creating a guide manually requires defining the type, title, description, metadata, and individual steps — a tedious process that discourages guide creation. We want to let users type a prompt ("bread baking guide for beginners") or paste a URL (an existing online recipe/tutorial) and receive a fully structured guide draft with steps, metadata, and descriptions. The user reviews and edits the draft, then saves it.

## Decision
Add AI-powered guide generation behind the API server, using OpenAI as the primary LLM provider. The web UI never talks to OpenAI directly — all AI calls go through the API server.

### Architecture
- **Provider abstraction**: `LLMService` ABC at infrastructure layer. `OpenAILLMService` implements it using the `openai` Python SDK with `AsyncOpenAI`. New providers (Anthropic, local models) can be added by implementing the same ABC.
- **URL content extraction**: `UrlContentExtractor` fetches URLs via `httpx`, strips HTML tags, and truncates to ~10,000 characters for token safety.
- **Batch endpoint**: `POST /guides/with-steps` creates a guide and all its steps atomically in a single request, avoiding partial creation states.
- **Structured output**: OpenAI JSON mode (`response_format={"type": "json_object"}`) with a system prompt that includes all guide types and their metadata schemas, ensuring the AI generates conformant output.
- **Optional credentials**: Follows the same pattern as `TelegramNotificationService` — missing `OPENAI_API_KEY` logs a warning at startup and returns a 503 if generation is attempted.

### API Endpoints
| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /guides/generate` | Generate draft from text prompt | Required |
| `POST /guides/generate-from-url` | Generate draft from URL content | Required |
| `POST /guides/with-steps` | Save guide + steps atomically | Required |

### Web App
- New `generate-guide-page` LitElement component with three states: input (prompt/URL tabs), review (editable form with steps), and saved (success with navigation).
- "Generate with AI" button added to the guides list page.
- Route registered at `/guides/generate` (before parameterized `/guides/:id`).

### Security & Cost Controls
- API keys stored in environment variables (never in client code)
- Prompt length limit: 1,000 characters
- URL content truncated to 10,000 characters
- `max_tokens` setting (default 4,096) caps response size
- All generation endpoints require authentication

### Duration Units
- AI generates step durations in **minutes** (natural for user-facing output)
- Domain model stores durations in **seconds** (`StepDuration` value object)
- Web UI converts minutes to seconds on save (`duration * 60`)

## Consequences

### Positive
- Users can create guides from natural language or existing web content
- Provider-agnostic abstraction enables future LLM swaps without application layer changes
- Atomic batch creation prevents orphaned guides or steps
- No new frontend dependencies — all AI interaction server-side

### Negative
- Requires OpenAI API key and incurs per-request costs
- AI output quality depends on prompt quality and model capability
- No streaming — user waits for full generation before reviewing

### Not in Scope (Future)
- Streaming generation (SSE/WebSocket for progressive draft display)
- Multiple LLM provider selection in UI
- Guide regeneration / partial re-generation of individual steps
- Cost tracking and per-user generation limits
