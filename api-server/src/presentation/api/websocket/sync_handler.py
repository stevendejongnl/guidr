"""WebSocket sync endpoint for cross-device real-time updates."""

import asyncio
import json
import logging

from starlette.applications import Starlette
from starlette.routing import WebSocketRoute
from starlette.websockets import WebSocket, WebSocketDisconnect

from src.infrastructure.auth import JWTService
from src.infrastructure.websocket.connection_manager import (
    ConnectionManager,
)

logger = logging.getLogger(__name__)

HEARTBEAT_TIMEOUT_S = 40


async def sync_endpoint(
    websocket: WebSocket,
    jwt_service: JWTService,
    connection_manager: ConnectionManager,
) -> None:
    """Handle a single WebSocket sync connection."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    payload = jwt_service.verify_access_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        await websocket.close(
            code=4001, reason="Invalid token payload"
        )
        return

    await websocket.accept()
    await connection_manager.connect(user_id, websocket)

    try:
        await websocket.send_json({"type": "welcome"})

        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_TIMEOUT_S,
                )
            except TimeoutError:
                logger.info(
                    "Heartbeat timeout for user %s", user_id
                )
                break
            except WebSocketDisconnect:
                break

            try:
                message = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                continue

            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    finally:
        await connection_manager.disconnect(user_id, websocket)


def create_sync_app(
    jwt_service: JWTService,
    connection_manager: ConnectionManager,
) -> Starlette:
    """Create a Starlette app with the sync WebSocket route.

    Used for testing and for mounting onto the main FastAPI app.
    """

    async def handler(websocket: WebSocket) -> None:
        await sync_endpoint(
            websocket, jwt_service, connection_manager
        )

    return Starlette(
        routes=[
            WebSocketRoute(
                "/api/v1/ws/sync", endpoint=handler
            ),
        ]
    )
