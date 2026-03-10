# React Native Craftsman Memory

## Project Structure
- Mobile root: `mobile/` — React Native 0.83.1, TypeScript strict
- Layers: `src/{common,domain,infrastructure,presentation}`
- Infrastructure API: `src/infrastructure/api/`
- Hooks: `src/presentation/hooks/`
- Mocks dir: `mobile/__mocks__/` (RN bridge mocks only)
- Jest setup: `mobile/jest.setup.js` — global browser API mocks live here

## Global Test Environment Mocks (jest.setup.js)
- `global.WebSocket` — no-op mock (Node lacks WebSocket)
- `global.XMLHttpRequest` — no-op mock added for EventSourceSyncClient
- When adding infrastructure that uses browser APIs not in Node/Jest, add a no-op global mock in `jest.setup.js`

## DI Pattern for Hook Testability
When a hook instantiates a client internally, add an optional `clientFactory` param to the options interface:
```typescript
export type SyncClientFactory = (url: string, token: string, onMessage: Handler) => ISyncClient
export interface UseSyncConnectionOptions {
  clientFactory?: SyncClientFactory  // optional, defaults to real impl
}
```
Tests inject a `FakeSyncClient` class via `clientFactory`. No `jest.mock()` needed.

## Fetch-based SSE Client Pattern (EventSourceSyncClient)
- Uses `XMLHttpRequest` with `readyState === 3` (LOADING) for streaming
- SSE parsing: track `processedLength` cursor; split new text on `\n`
- Only reset `pendingEventType` / `pendingData` after a real dispatch (when `pendingData !== ''`)
  - Bug to avoid: resetting event type on trailing `\n` before data arrives
- Inject `XhrFactory` as optional constructor param for testability
- Reconnect: exponential backoff, same as WebSocketSyncClient (1s base, 30s cap, 10 max)
- File: `src/infrastructure/api/EventSourceSyncClient.ts`

## Key Files
- `src/common/SyncEventEmitter.ts` — singleton event bus for sync events
- `src/infrastructure/api/WebSocketSyncClient.ts` — kept (not deleted), no longer used by hook
- `src/presentation/hooks/useSyncConnection.ts` — uses EventSourceSyncClient via factory DI

## Test Counts (as of 2026-03-09)
- Mobile: 1369 tests, 86 suites (Jest)

See `patterns.md` for more detail.
