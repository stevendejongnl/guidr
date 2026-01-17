# ADR-012: API Server Crash and Health Failure Notifications

**Date**: 2026-01-17

**Status**: Accepted

## Context

The Guidr API server is deployed to Kubernetes with 2 replicas, but there is currently limited visibility into failure events:

1. **Unhandled exceptions**: When the API crashes due to unhandled exceptions, there's no immediate notification
2. **Database connectivity failures**: If the database connection drops, the health probe eventually triggers a restart, but no one knows why
3. **Pod restarts**: Kubernetes auto-restarts failed pods, but there's no record of what caused the failure
4. **Graceful shutdowns**: When a pod is terminated (e.g., during deployment), there's no notification
5. **Multi-replica challenges**: With 2 replicas, we need per-pod notifications to track which instances are affected

Current state:
- Telegram notification service exists but only sends startup notifications
- Health endpoint exists but doesn't validate database connectivity
- No exception handler catches crashes before they result in pod termination
- No shutdown hook sends notifications on graceful termination

This results in reactive incident response: engineers only discover issues when users report problems or services degrade, leading to longer recovery times.

## Decision

Implement a multi-layered notification system for API server failures with the following components:

### 1. **Extended TelegramNotificationService**
   - Add `send_crash_notification(error, version, pod_name)` - sends on unhandled exceptions
   - Add `send_shutdown_notification(version, pod_name, reason)` - sends on pod termination
   - Add `send_health_failure_notification(reason, version, pod_name)` - sends on health check failures
   - Add `_send_message()` helper to consolidate message sending logic
   - Add `_escape_html()` helper for security (prevent HTML injection attacks)
   - All methods gracefully handle missing credentials and network failures

### 2. **Global Exception Handler (FastAPI)**
   - Add exception handler to `create_app()` that catches all unhandled exceptions
   - Sends crash notification with error type and first 500 chars of message
   - Returns 500 error to client (doesn't suppress the error)
   - Non-blocking: notification failure doesn't prevent error response

### 3. **Lifespan Shutdown Notification**
   - Enhance `lifespan()` context manager to send shutdown notifications
   - Track shutdown reason: "graceful" for normal termination, "error: {ExceptionType}" for crashes
   - Send notification in finally block before database disconnect
   - Extract pod name from `POD_NAME` environment variable or config

### 4. **Enhanced Health Check**
   - Update `/api/v1/health` endpoint to verify database connectivity
   - Execute MongoDB ping command during health check
   - Return 503 status on database failure (triggers Kubernetes liveness probe restart)
   - Send health failure notification when database is unreachable
   - Include database status in response payload

### 5. **Configuration and Kubernetes Integration**
   - Add `pod_name` field to `Settings` (optional, can be set via environment variable)
   - Add `POD_NAME` environment variable in Kubernetes deployment manifest
   - Use `metadata.name` field reference to automatically populate pod name
   - All notification methods include pod name for identification

### 6. **Message Formats**

**Crash Notification** (❌ emoji):
```
❌ API Server Crashed

Error Type: ValueError
Message: Database connection failed
Version: 1.23.2
Timestamp: 2026-01-17 15:30:45 UTC
Pod: guidr-api-server-abc123

[API Documentation link]
```

**Shutdown Notification** (🔄 emoji):
```
🔄 API Server Shutdown

Reason: graceful
Version: 1.23.2
Timestamp: 2026-01-17 15:31:20 UTC
Pod: guidr-api-server-abc123

[API Documentation link]
```

**Health Failure Notification** (⚠️ emoji):
```
⚠️ API Server Unhealthy

Reason: Database connection failed: ConnectionError
Version: 1.23.2
Timestamp: 2026-01-17 15:32:00 UTC
Pod: guidr-api-server-abc123

[API Documentation link]
```

## Consequences

### Positive
- **Proactive incident response**: Engineers notified immediately when crashes occur, enabling faster recovery
- **Visibility into failures**: Clear categorization of failure types (crash vs shutdown vs health)
- **Multi-replica tracking**: Pod name in notifications shows which replica failed
- **Database issues detected**: Health checks validate actual connectivity, not just app availability
- **Graceful shutdown tracking**: Know when deployments succeed vs fail with shutdown notifications
- **No false positives**: Notification sending is non-blocking, won't create additional failures
- **Security**: HTML escaping prevents injection attacks via pod names or error messages
- **Backwards compatible**: Existing startup notifications continue working
- **Deployable per pod**: Each replica sends independent notifications (no coordination needed)

### Negative
- **Notification overhead**: Each crash/shutdown sends an HTTP request to Telegram (minimal impact)
- **Temporary Telegram unavailability**: If Telegram API is down, notifications won't be delivered (but app continues normally)
- **Credential dependency**: Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to be configured
- **Message rate limits**: Rapid crashes could hit Telegram rate limits (unlikely, but possible in runaway loop scenarios)

### Neutral
- **No synchronous blocking**: All notification sends are async and don't block request handling
- **Error messages visible in chat**: Some users might see sensitive error details in Telegram (mitigated by limiting message to 500 chars)

## Alternatives Considered

### 1. External Monitoring Tools (Datadog, New Relic, etc.)
   - **Pros**: Comprehensive observability, dashboards, alerting rules
   - **Cons**: Additional paid service, complex setup, overkill for current needs
   - **Rejected**: Telegram provides sufficient notifications for immediate incident awareness

### 2. Kubernetes Events and Logs Only
   - **Pros**: Built-in, no external dependencies
   - **Cons**: Passive approach, requires engineers to check logs proactively, no real-time alerts
   - **Rejected**: We need real-time notifications to be truly proactive

### 3. Structured Logging with Aggregation (ELK, CloudWatch)
   - **Pros**: Centralized logging, searchable, good audit trail
   - **Cons**: Still requires log monitoring, not real-time alerting, complex setup
   - **Rejected**: Complementary to this ADR, not a replacement for notifications

### 4. Health Check Endpoint Only (No Crash Notifications)
   - **Pros**: Simpler to implement, leverages existing health probe
   - **Cons**: Only catches failures detected by probe (60-second delay with 3 failures), misses immediate crashes
   - **Rejected**: Global exception handler enables notification within seconds

### 5. Database Ping Every Request
   - **Pros**: Immediate database failure detection
   - **Cons**: Performance overhead, unnecessary latency on every request
   - **Rejected**: Health check alone is sufficient for detecting connectivity issues

### 6. Send Notifications for Every Exception Type
   - **Pros**: Granular visibility
   - **Cons**: Notification spam for expected errors (400 Bad Request, 401 Unauthorized)
   - **Rejected**: Current approach sends crashes only (unhandled exceptions caught globally)

## Implementation Notes

### File Structure
```
api-server/src/
├── infrastructure/
│   ├── notifications/
│   │   ├── telegram_service.py (extended with 3 new methods)
│   │   └── telegram_service_test.py (14 new test cases)
│   ├── config/
│   │   └── settings.py (added pod_name field)
│   └── coordination/
│       └── (existing startup coordinator, no changes)
├── presentation/api/
│   ├── app.py (added global exception handler)
│   └── routers/
│       ├── system.py (enhanced health check)
│       └── system_test.py (new file, 6 test cases)
└── main.py (enhanced lifespan)

kubernetes.yaml (added POD_NAME environment variable)
```

### Test Coverage

**telegram_service_test.py** (14 new tests):
- `test_send_crash_notification_success` - successful crash notification
- `test_send_crash_notification_missing_credentials` - graceful handling when credentials missing
- `test_send_crash_notification_timeout` - timeout handling
- `test_send_shutdown_notification_success` - successful shutdown notification
- `test_send_shutdown_notification_with_error_reason` - shutdown with error reason
- `test_send_health_failure_notification_success` - successful health notification
- `test_send_health_failure_notification_missing_credentials` - missing credentials
- `test_send_crash_notification_html_escaping` - HTML security
- `test_send_health_failure_notification_html_escaping` - HTML security
- 5 additional error handling tests (network errors, etc.)

**system_test.py** (6 new tests):
- `test_health_endpoint_database_connected` - healthy database
- `test_health_endpoint_database_disconnected` - database error
- `test_health_endpoint_database_timeout` - timeout handling
- `test_health_endpoint_sends_notification_on_failure` - notification sending
- `test_health_endpoint_notification_failure_does_not_crash` - error resilience
- `test_health_endpoint_version_available` - version in all responses

**Total**: 20 new test cases covering all failure modes, error handling, and security

### Configuration Required

**Environment Variables**:
```yaml
# In Kubernetes deployment spec
env:
  - name: TELEGRAM_BOT_TOKEN
    valueFrom:
      secretKeyRef:
        name: guidr-telegram-secret
        key: bot-token
  - name: TELEGRAM_CHAT_ID
    valueFrom:
      secretKeyRef:
        name: guidr-telegram-secret
        key: chat-id
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
```

**No code changes required** if Telegram credentials already configured (from ADR-006).

### Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 API Server Pod                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Request → [Global Exception Handler]                 │
│                      ↓                                 │
│            Unhandled Exception Caught                  │
│                      ↓                                 │
│        send_crash_notification() ──┐                 │
│                      ↓              │                 │
│            Return 500 Error         │ (async)         │
│                                    ↓                 │
├─────────────────────────────────────────────────────────┤
│                 Telegram API                           │
│        (receive and deliver message)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            Kubernetes Lifespan (SIGTERM)               │
├─────────────────────────────────────────────────────────┤
│  lifespan() context manager → finally block            │
│                      ↓                                 │
│  send_shutdown_notification() ──┐                     │
│                      ↓          │ (async)             │
│  Disconnect Database  ↓                               │
│  Pod Terminates       ↓                               │
├─────────────────────────────────────────────────────────┤
│            Telegram API                                │
│       (receive and deliver message)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          Kubernetes Health Check Probe                 │
├─────────────────────────────────────────────────────────┤
│  GET /api/v1/health every 30 seconds                   │
│  (liveness) / 10 seconds (readiness)                  │
│                      ↓                                 │
│  Database ping fails × 3                              │
│                      ↓                                 │
│  send_health_failure_notification() ──┐              │
│                      ↓                 │ (async)      │
│  Return 503 Unavailable                │              │
│                      ↓                 ↓              │
│  Kubernetes restarts pod               Telegram       │
└─────────────────────────────────────────────────────────┘
```

### Error Message Examples

**Crash - Database Connection Error**:
```
❌ API Server Crashed
Error Type: ConnectionError
Message: Connection to MongoDB failed after 3 retries
Version: 1.23.2
Timestamp: 2026-01-17 15:30:45 UTC
Pod: guidr-api-server-7d8f9b-abc12
```

**Shutdown - Normal Termination**:
```
🔄 API Server Shutdown
Reason: graceful
Version: 1.23.2
Timestamp: 2026-01-17 15:31:20 UTC
Pod: guidr-api-server-7d8f9b-abc12
```

**Health Failure - Database Unreachable**:
```
⚠️ API Server Unhealthy
Reason: Database connection failed: TimeoutError
Version: 1.23.2
Timestamp: 2026-01-17 15:32:00 UTC
Pod: guidr-api-server-7d8f9b-xyz78
```

## Verification

### Automated Testing
Run full test suite:
```bash
npm run api:test
# Expected: All existing tests pass + 20 new tests pass
```

Type checking:
```bash
npm run api:typecheck
# Expected: No errors
```

Linting:
```bash
npm run api:lint
# Expected: No errors
```

### Manual Testing

1. **Test Crash Notification**
   - In development, add an endpoint that raises an exception
   - Call the endpoint
   - Verify Telegram message received with error details

2. **Test Shutdown Notification**
   - Kill the container gracefully
   - Verify Telegram message received with "graceful" reason

3. **Test Health Failure**
   - Stop MongoDB temporarily
   - Call `/api/v1/health`
   - Verify health check returns 503
   - Verify Telegram message received

4. **Test Pod Name in Notifications**
   - Deploy to Kubernetes
   - Trigger a crash or health failure
   - Verify pod name appears in Telegram message

### Success Criteria
- ✅ All 20 new tests passing
- ✅ No type errors
- ✅ No lint errors
- ✅ Crash notifications sent on unhandled exceptions
- ✅ Shutdown notifications sent on pod termination
- ✅ Health failure notifications sent when database unavailable
- ✅ Pod names included in all notifications
- ✅ Different emoji/formats for different notification types
- ✅ HTML escaping prevents injection attacks
- ✅ Graceful handling when Telegram credentials missing

## Deployment Notes

### Prerequisites
- Telegram bot token and chat ID (already configured for ADR-006)
- POD_NAME environment variable in Kubernetes (new in this ADR)

### Rollout Strategy
1. Deploy to staging cluster first
2. Monitor for crashes/shutdowns
3. Verify notifications received
4. Deploy to production
5. Keep monitoring for 1 week after production deployment

### Rollback Plan
If issues occur:
1. Notifications are non-blocking, so crashes will still be caught
2. Can disable notifications by removing Telegram credentials
3. No database schema changes, no data migration needed
4. Simple code rollback to previous version

## Future Enhancements

### Phase 13 (Optional): Slack Integration
- Add `send_crash_notification_to_slack()` method
- Support both Telegram and Slack channels
- Allow configuration of which channel gets which notification type

### Phase 14 (Optional): Metrics and Dashboards
- Track notification frequency in Prometheus
- Create dashboard showing crash rates per pod
- Alert on abnormal crash frequency

### Phase 15 (Optional): Structured Logging Integration
- Send crashes to centralized logging service (ELK, CloudWatch)
- Correlate Telegram notifications with log entries
- Full audit trail of all failures

### Phase 16 (Optional): Auto-Recovery Logic
- Detect repeated crashes (> 3 in 5 minutes)
- Escalate alerts to on-call engineer
- Trigger automated recovery procedures

## References

- **Related ADRs**:
  - ADR-006 (Admin user authorization)
  - ADR-007 (User-based admin mode)
  - ADR-009 (Server health validation)
- **Existing Implementation**: `telegram_service.py` with startup notifications
- **Kubernetes**: Liveness and readiness probes in deployment manifest
- **FastAPI Documentation**: https://fastapi.tiangolo.com/advanced/events/
- **Telegram Bot API**: https://core.telegram.org/bots/api

## Commit Reference

Implementation committed as: `feat: implement Telegram notifications for API server crashes and health failures`

All code changes follow the requirements of:
- Conventional Commits specification (feat:)
- Project linting and type checking standards
- 100% test coverage for new functionality
- No breaking changes to existing APIs
