"""SSE sync endpoint for cross-device real-time updates."""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import StreamingResponse

from src.domain.events.base import BaseDomainEvent
from src.infrastructure.auth import JWTService
from src.infrastructure.event_bus.in_memory_event_bus import InMemoryEventBus
from src.infrastructure.sse.sse_manager import SSEManager
from src.infrastructure.websocket.event_serializer import EventSerializer

logger = logging.getLogger(__name__)

_KEEP_ALIVE_INTERVAL_S = 15


def _extract_bearer_token(request: Request) -> str | None:
    """Extract the Bearer token from the Authorization header.

    Returns the raw token string, or None if the header is absent or
    does not use the Bearer scheme.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[len("Bearer "):]


def _format_sse_frame(event: str, data: dict) -> str:
    """Format a single SSE frame.

    Produces:
        event: <event>\\n
        data: <json>\\n
        \\n
    """
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _stream_events(
    user_id: str,
    sse_manager: SSEManager,
) -> AsyncGenerator[str, None]:
    """Async generator that yields SSE frames until the client disconnects.

    Starts with a 'connected' frame, then forwards domain events from the
    per-connection queue. Sends a keep-alive comment every
    _KEEP_ALIVE_INTERVAL_S seconds to prevent proxy timeouts.
    """
    queue = await sse_manager.add_connection(user_id)
    try:
        yield _format_sse_frame(
            "connected",
            {"status": "connected", "userId": user_id},
        )

        while True:
            try:
                data = await asyncio.wait_for(
                    queue.get(), timeout=_KEEP_ALIVE_INTERVAL_S
                )
                event_type = data.get("type", "event")
                yield _format_sse_frame(event_type, data)
            except TimeoutError:
                # SSE keep-alive comment — prevents proxy / load-balancer timeouts
                yield ": keep-alive\n\n"
    except asyncio.CancelledError:
        # Client disconnected
        pass
    finally:
        await sse_manager.remove_connection(user_id, queue)
        logger.debug("SSE stream closed for user %s", user_id)


async def sse_sync_endpoint(
    request: Request,
    jwt_service: JWTService,
    sse_manager: SSEManager,
) -> Response:
    """Handle a single SSE sync connection.

    Auth: Authorization: Bearer <JWT> header (NOT query param).
    Returns a streaming text/event-stream response.
    """
    token = _extract_bearer_token(request)
    if not token:
        return Response(
            content='{"detail": "Missing or invalid Authorization header"}',
            status_code=status.HTTP_401_UNAUTHORIZED,
            media_type="application/json",
        )

    payload = jwt_service.verify_access_token(token)
    if payload is None:
        return Response(
            content='{"detail": "Invalid or expired token"}',
            status_code=status.HTTP_401_UNAUTHORIZED,
            media_type="application/json",
        )

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        return Response(
            content='{"detail": "Invalid token payload"}',
            status_code=status.HTTP_401_UNAUTHORIZED,
            media_type="application/json",
        )

    logger.info("SSE sync connection established for user %s", user_id)

    return StreamingResponse(
        _stream_events(user_id, sse_manager),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def create_sse_app(
    jwt_service: JWTService,
    sse_manager: SSEManager,
    event_bus: InMemoryEventBus,
    event_serializer: EventSerializer,
) -> FastAPI:
    """Create a FastAPI app with the SSE sync route.

    Wires the event bus so that published domain events are forwarded to all
    connected SSE streams for the relevant user.

    Used for testing and for mounting onto the main FastAPI app.
    """
    app = FastAPI()

    async def _broadcast_event(event: BaseDomainEvent) -> None:
        user_id = getattr(event, "user_id", "")
        if not user_id:
            return
        data = event_serializer.serialize(event)
        await sse_manager.send_to_user(user_id, data)

    event_bus.subscribe(None, _broadcast_event)

    @app.get("/api/v1/sse/sync")
    async def sync(request: Request) -> Response:
        return await sse_sync_endpoint(request, jwt_service, sse_manager)

    return app
