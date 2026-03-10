# FastAPI DDD Architect Memory — Guidr Project

## Project Structure
- `api-server/src/` — DDD layers: domain, application, infrastructure, presentation
- `api-server/src/container.py` — dependency_injector DeclarativeContainer; all singletons/factories live here
- `api-server/src/main.py` — `create_application()` wires container into FastAPI, registers WebSocket + SSE routes manually
- `api-server/src/presentation/api/app.py` — `create_app()` registers routers; no container wiring here
- Routers follow the pattern: module-level `_container`, `set_container()`, dependency provider functions

## DI Wiring Pattern
- Routers/dependencies expose `set_container(container)` called from `main.py::create_application()`
- Container providers: `providers.Singleton` for shared state, `providers.Factory` for per-request use cases
- auth dependencies module: `src/presentation/api/dependencies/auth.py` — `set_container` + `get_current_user`

## Testing Patterns
- Tests co-located with source (e.g., `entity_test.py` beside `entity.py`)
- No `unittest.mock.patch` / `MagicMock` — use real fakes with DI
- `Mock()` is acceptable for simple protocol stubs (e.g., JWT service in handler tests)
- `pytest-asyncio` mode=AUTO; async tests get `@pytest.mark.asyncio` decorator
- Ruff rule E741: avoid single-letter variable names like `l` — use `line`/`ln`

## SSE Implementation (added 2026-03-09)
- `src/infrastructure/sse/sse_manager.py` — `SSEManager`: asyncio.Queue per connection, per user
- `src/presentation/api/sse/sync_handler.py` — `_stream_events` async generator + `sse_sync_endpoint` + `create_sse_app`
- Container: `sse_manager = providers.Singleton(SSEManager)` (alongside existing WS providers)
- Route: `GET /api/v1/sse/sync`, auth via `Authorization: Bearer <JWT>` header
- Event bus wired twice in `main.py`: once for WebSocket broadcast, once for SSE broadcast

## SSE Testing Insight
- SSE streaming tests with `TestClient.stream()` + `iter_bytes()` WILL HANG — TestClient waits for
  the server generator to finish; infinite generators never finish
- Solution: test the async generator directly (`gen.__anext__()` / `gen.aclose()`) — fast, no HTTP stack
- HTTP-level tests (auth, headers) can use `TestClient.get()` for non-streaming responses (auth failures)
- httpx `ASGITransport` + `client.stream()` also hangs on cleanup for infinite generators

## Event Bus Subscription Pattern
- `InMemoryEventBus.subscribe(None, handler)` — wildcard (all events)
- Each subscriber gets `event` with optional `user_id` attribute
- Multiple subscribers are independent; each gets every event

## Key Import Paths
- `src/domain/events/base.py` — `BaseDomainEvent`
- `src/domain/services/event_bus.py` — `IEventBus` protocol, `EventHandler` type
- `src/infrastructure/event_bus/in_memory_event_bus.py` — `InMemoryEventBus`
- `src/infrastructure/websocket/event_serializer.py` — `EventSerializer` (reusable for SSE)
- `src/infrastructure/auth/jwt_service.py` — `JWTService`
