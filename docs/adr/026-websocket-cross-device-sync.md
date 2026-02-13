# ADR-026: WebSocket Cross-Device Timer & Session Sync

## Status
Accepted

## Context
Timers started on one device (e.g. iOS) don't appear or update on another device (e.g. Android) until the app is restarted. Timer state is fetched via REST on mount and never refreshed — each device runs independently. For users who switch between devices during a guide session, this creates a confusing experience where timers appear out of sync.

Domain events already exist (`SessionStarted`, `StepTimerStarted`, etc.) but are only persisted to audit logs — they are never published for real-time consumption.

## Decision
Add WebSocket-based real-time sync so timer and session state changes propagate instantly across all connected devices for the same user.

### Architecture
- **WebSocket is read-only** for domain mutations. All timer/session mutations continue through REST endpoints. WebSocket only broadcasts state changes. This avoids duplicating validation logic.
- **Event bus** (`IEventBus` protocol at domain layer, `InMemoryEventBus` at infrastructure) decouples event publishing from WebSocket broadcasting. Swappable to Redis Pub/Sub later if multi-pod needed.
- **Connection manager** groups WebSocket connections by `user_id`, supporting multiple devices per user. Stale connections are automatically cleaned up on send failure.
- **Event serializer** maps domain events to camelCase WebSocket messages (`StepTimerStarted` → `{"type": "timer.started", "payload": {...}}`).

### API Changes
- New WS endpoint: `ws /api/v1/ws/sync?token=<JWT>`
- JWT auth validated on connect (close 4001 if invalid)
- Heartbeat: client pings every 25s, server closes after 40s without message
- Timer use cases (`StartStepTimer`, `PauseStepTimer`, `ResetStepTimer`) now accept optional `event_bus` via constructor injection
- Session mutation endpoints (`start`, `pause`, `resume`, `complete`, `cancel`, `move-to-step`) now require auth (`get_current_user`) and publish events from the router

### Mobile Changes
- `WebSocketSyncClient`: Built-in RN WebSocket, exponential backoff reconnect (1s → 30s cap, 10 attempts)
- `SyncEventEmitter`: In-memory pub/sub decoupling WebSocket lifecycle from hooks
- `useSyncConnection`: Manages WS lifecycle, reconnects on app foreground, triggers REST refresh on reconnect
- `useStepTimers`: Subscribes to `timer.started/paused/reset` events, rebuilds DTOs from payload
- `useActiveTimers`: Subscribes to timer events, triggers `refresh()` on any event

### Keep-Alive Behavior
- React Native WebSocket stays open ~30s after backgrounding (iOS)
- On `AppState` → `'active'`: reconnect + full REST refresh to catch missed events
- Server heartbeat timeout at 40s cleans up stale connections

## Consequences

### Positive
- Cross-device timer/session updates within ~100ms
- No new dependencies (built-in RN WebSocket, FastAPI/Starlette WebSocket support)
- Backward compatible — existing REST flow unchanged, `event_bus=None` default preserves existing test behavior
- Clean separation via `IEventBus` protocol enables future Redis Pub/Sub swap

### Negative
- Single-process only (no multi-pod broadcasting without Redis)
- No event replay on reconnect — relies on REST refresh after reconnect
- Session endpoints now require auth tokens (previously unauthenticated)

### Not in Scope (Future)
- Event replay with sequence numbers for gap detection
- Redis Pub/Sub for multi-pod broadcasting
- Push notifications for background timer completion
- Conflict resolution (last-write-wins is acceptable for single-user timers)
