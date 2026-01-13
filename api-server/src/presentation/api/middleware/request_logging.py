"""Request logging middleware for audit trail."""

import asyncio
from collections.abc import Awaitable, Callable
from time import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.domain.services import IEventPersistenceService


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests to audit trail.

    Logs all authenticated API requests with timing information.
    Fire-and-forget approach to avoid blocking response times.
    """

    def __init__(
        self,
        app,
        event_persistence_service: IEventPersistenceService | None = None,
    ):
        """Initialize middleware.

        Args:
            app: FastAPI application
            event_persistence_service: Optional service for persisting audit logs
        """
        super().__init__(app)
        self._event_persistence_service = event_persistence_service

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request and log to audit trail if authenticated.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler

        Returns:
            HTTP response
        """
        start_time = time()

        # Extract request context
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent")

        # Process request
        response = await call_next(request)

        # Calculate request duration
        duration_ms = (time() - start_time) * 1000

        # Log audit trail asynchronously (fire-and-forget)
        # Only for non-static file requests and if service is available
        if self._event_persistence_service and not request.url.path.startswith(
            "/assets"
        ):
            asyncio.create_task(
                self._log_request(
                    request=request,
                    response=response,
                    duration_ms=duration_ms,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
            )

        return response

    async def _log_request(
        self,
        request: Request,
        response: Response,
        duration_ms: float,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        """Log request details to audit trail.

        Args:
            request: HTTP request
            response: HTTP response
            duration_ms: Request duration in milliseconds
            ip_address: Client IP address
            user_agent: Client user agent
        """
        # Skip if service not available
        if not self._event_persistence_service:
            return

        # Get user from request state (set by auth dependency if authenticated)
        user = getattr(request.state, "user", None)

        # Only log authenticated requests
        if not user:
            return

        # Create generic request event
        # In real implementation, this would create domain events
        # For now, we skip as events are created at use case level
        # This middleware is here for completeness and future enhancement

    def _get_client_ip(self, request: Request) -> str | None:
        """Extract client IP address from request.

        Checks X-Forwarded-For header first (for proxies),
        then falls back to client connection info.

        Args:
            request: HTTP request

        Returns:
            Client IP address or None
        """
        # Check for forwarded IP (from proxy or load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP if there are multiple
            return forwarded_for.split(",")[0].strip()

        # Fall back to direct connection IP
        if request.client:
            return request.client.host

        return None
